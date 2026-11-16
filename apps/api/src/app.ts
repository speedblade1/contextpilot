import express from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { z, ZodError } from "zod";
import { countries, categories, safeUrl } from "@contextpilot/shared";
import { OpenAIProvider } from "./ai/openai.js";
import { config } from "./config.js";
import { db, repository, serialize, ownerId } from "./repositories.js";
import {
  AppError,
  requireCampaign,
  updateCampaign,
  transition,
} from "./services/campaigns.js";
import { converse } from "./services/conversation.js";
import { matchAd } from "./services/matching.js";
import { DemoProvider, LiveProvider, type Provider } from "./ai/provider.js";
const revision = z.number().int().nonnegative();
export function createApp(
  provider: Provider = config.mode === "live"
    ? config.provider === "openai"
      ? new OpenAIProvider()
      : new LiveProvider()
    : new DemoProvider(),
) {
  const app = express();
  app.use(
    helmet(),
    cors({ origin: config.origins }),
    express.json({ limit: "16kb" }),
  );
  app.use((req, res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.path !== "/api/ads/match" &&
      req.get("X-ContextPilot-Client") !== "1"
    )
      return next(
        new AppError(
          403,
          "CLIENT_HEADER_REQUIRED",
          "Use the workspace client.",
        ),
      );
    if (req.get("origin") && !config.origins.includes(req.get("origin")!))
      return next(new AppError(403, "ORIGIN_DENIED", "Origin not allowed"));
    next();
  });
  app.get("/api/health", (_req, res) =>
    res.json({
      ok: true,
      mode: config.mode,
      provider: config.provider,
      model: config.model,
      aiConfigured: config.mode === "demo" || Boolean(config.apiKey),
      localOnly: true,
    }),
  );
  app.post(
    "/api/ai/check",
    rateLimit({ windowMs: 60000, limit: 3 }),
    async (req, res) => {
      z.object({ confirmed: z.literal(true) })
        .strict()
        .parse(req.body);
      const result = await provider.propose({
        draft: { currency: "USD" },
        publishers: [],
        messages: [
          {
            role: "user",
            content:
              "Set the budget to 1 USD. Leave all other fields unchanged.",
          },
        ],
      });
      if (result.patch.budget !== 1)
        throw new AppError(
          502,
          "AI_CHECK_FAILED",
          "The provider responded but did not return the expected validated update.",
        );
      res.json({
        ok: true,
        model: config.model,
        tokens: result.tokens ?? null,
        checkedAt: new Date().toISOString(),
      });
    },
  );
  app.post("/api/publishers", async (req, res) => {
    const data = z
      .object({
        name: z.string().trim().min(1).max(100),
        category: z.enum(categories),
        siteUrl: safeUrl,
        confirmed: z.literal(true),
      })
      .strict()
      .parse(req.body);
    res
      .status(201)
      .json(
        await db.publisher.create({
          data: {
            id: crypto.randomUUID(),
            name: data.name,
            category: data.category,
            siteUrl: data.siteUrl,
          },
        }),
      );
  });
  app.delete("/api/publishers/:id", async (req, res) => {
    z.object({ confirmed: z.literal(true) })
      .strict()
      .parse(req.body);
    const id = String(req.params.id);
    if (
      (await repository.list()).some((c) => c.data.publisherIds?.includes(id))
    )
      throw new AppError(
        409,
        "PUBLISHER_IN_USE",
        "Remove this publisher from its campaigns before deleting it.",
      );
    const deleted = await db.publisher.deleteMany({ where: { id } });
    if (!deleted.count)
      throw new AppError(404, "NOT_FOUND", "Publisher not found");
    res.status(204).end();
  });
  app.get("/api/publishers", async (_req, res) =>
    res.json(await db.publisher.findMany()),
  );
  app.get("/api/campaigns", async (_req, res) =>
    res.json(await repository.list()),
  );
  app.post("/api/campaigns", async (req, res) => {
    z.object({ confirmed: z.literal(true) })
      .strict()
      .parse(req.body);
    res.status(201).json(await repository.create());
  });
  app.get("/api/campaigns/:id", async (req, res) =>
    res.json({
      campaign: serialize(await requireCampaign(req.params.id)),
      messages: await repository.history(req.params.id),
    }),
  );
  app.patch("/api/campaigns/:id", async (req, res) => {
    const b = z
      .object({ version: revision, patch: z.unknown() })
      .strict()
      .parse(req.body);
    res.json(await updateCampaign(req.params.id, b.version, b.patch));
  });
  app.post("/api/campaigns/:id/transition", async (req, res) => {
    const b = z
      .object({
        version: revision,
        action: z.enum(["save", "activate", "pause"]),
        confirmed: z.boolean(),
      })
      .strict()
      .parse(req.body);
    res.json(await transition(req.params.id, b.version, b.action, b.confirmed));
  });
  app.delete("/api/campaigns/:id", async (req, res) => {
    const b = z
      .object({ version: revision, confirmed: z.literal(true) })
      .strict()
      .parse(req.body);
    await requireCampaign(req.params.id);
    const deleted = await db.campaign.deleteMany({
      where: { id: req.params.id, ownerId, version: b.version },
    });
    if (!deleted.count)
      throw new AppError(409, "STALE_VERSION", "Reload before deleting");
    res.status(204).end();
  });
  app.post(
    "/api/campaigns/:id/messages",
    rateLimit({
      windowMs: 60000,
      limit: 20,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      handler: (_req, res) =>
        res.status(429).json({
          error: {
            code: "RATE_LIMIT",
            message: "Too many messages. Wait a minute.",
          },
        }),
    }),
    async (req, res) => {
      const b = z
        .object({
          version: revision,
          content: z.string().trim().min(1).max(4000),
        })
        .strict()
        .parse(req.body);
      res.json(
        await converse(provider, String(req.params.id), b.version, b.content),
      );
    },
  );
  app.post("/api/ads/match", async (req, res) => {
    const b = z
      .object({
        publisherId: z.string().max(80),
        country: z.enum(countries),
        category: z.enum(categories),
        keywords: z.array(z.string().max(60)).max(20),
      })
      .strict()
      .parse(req.body);
    res.json({ ad: await matchAd(b) });
  });
  app.use((_req, _res, next) =>
    next(new AppError(404, "NOT_FOUND", "Endpoint not found")),
  );
  app.use(
    (
      error: unknown,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      if (error instanceof ZodError)
        return res.status(422).json({
          error: {
            code: "VALIDATION_ERROR",
            message: error.issues
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; "),
          },
        });
      if (error instanceof AppError)
        return res
          .status(error.status)
          .json({ error: { code: error.code, message: error.message } });
      if (error instanceof SyntaxError)
        return res.status(400).json({
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON",
          },
        });
      res.status(500).json({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected server error occurred",
        },
      });
    },
  );
  return app;
}
