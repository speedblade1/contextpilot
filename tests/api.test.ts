import "./setup-db";
import { beforeEach, afterAll, describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../apps/api/src/app";
import { db } from "../apps/api/src/repositories";
import { DemoProvider } from "../apps/api/src/ai/provider";
const app = createApp(new DemoProvider());
const headers = { "X-ContextPilot-Client": "1" };
const complete = {
  campaignName: "Learn code",
  productDescription: "Programming course",
  budget: 500,
  currency: "USD",
  category: "technology",
  targetCountries: ["DE"],
  publisherIds: ["byte-journal"],
  destinationUrl: "https://example.com",
};
beforeEach(async () => {
  await db.message.deleteMany();
  await db.campaign.deleteMany();
  await db.publisher.deleteMany();
  await db.publisher.create({
    data: { id: "byte-journal", name: "Byte Journal", category: "technology" },
  });
});
afterAll(() => db.$disconnect());
async function draft() {
  return (
    await request(app)
      .post("/api/campaigns")
      .set(headers)
      .send({ confirmed: true })
  ).body;
}
async function filled() {
  const c = await draft();
  return (
    await request(app)
      .patch(`/api/campaigns/${c.id}`)
      .set(headers)
      .send({ version: 0, patch: complete })
  ).body;
}
describe("Campaign API boundaries", () => {
  it("creates publishers and prevents deleting a referenced publisher", async () => {
    const added = await request(app)
      .post("/api/publishers")
      .set(headers)
      .send({
        name: "My journal",
        category: "technology",
        siteUrl: "http://localhost:5174",
        confirmed: true,
      });
    expect(added.status).toBe(201);
    expect(
      (
        await request(app)
          .delete(`/api/publishers/${added.body.id}`)
          .set(headers)
          .send({ confirmed: true })
      ).status,
    ).toBe(204);
    await filled();
    expect(
      (
        await request(app)
          .delete("/api/publishers/byte-journal")
          .set(headers)
          .send({ confirmed: true })
      ).status,
    ).toBe(409);
  });
  it("requires confirmation to check the AI and does not save its probe", async () => {
    expect(
      (
        await request(app)
          .post("/api/ai/check")
          .set(headers)
          .send({ confirmed: false })
      ).status,
    ).toBe(422);
    expect(
      (
        await request(app)
          .post("/api/ai/check")
          .set(headers)
          .send({ confirmed: true })
      ).body.ok,
    ).toBe(true);
    expect(await db.campaign.count()).toBe(0);
  });
  it("extracts, stores and preserves fields across conversational changes", async () => {
    const c = await draft();
    const a = await request(app)
      .post(`/api/campaigns/${c.id}/messages`)
      .set(headers)
      .send({
        version: 0,
        content:
          "Promote my programming course in Germany with a budget of $500",
      });
    expect(a.status).toBe(200);
    expect(a.body.campaign.data).toMatchObject({
      budget: 500,
      targetCountries: ["DE"],
      publisherIds: ["byte-journal"],
    });
    const b = await request(app)
      .post(`/api/campaigns/${c.id}/messages`)
      .set(headers)
      .send({
        version: 1,
        content: "Increase the budget to $400 and add France",
      });
    expect(b.body.campaign.data).toMatchObject({
      budget: 400,
      targetCountries: ["DE", "FR"],
      category: "technology",
    });
    const stored = await request(app).get(`/api/campaigns/${c.id}`);
    expect(stored.body.messages).toHaveLength(4);
  });
  it.each([
    { budget: -1 },
    { budget: 0 },
    { targetCountries: ["ZZ"] },
    { publisherIds: ["invented"] },
    { status: "ACTIVE" },
    { destinationUrl: "javascript:alert(1)" },
  ])("rejects invalid patch %j", async (patch) => {
    const c = await draft();
    const r = await request(app)
      .patch(`/api/campaigns/${c.id}`)
      .set(headers)
      .send({ version: 0, patch });
    expect(r.status).toBe(422);
    expect(
      (await db.campaign.findUniqueOrThrow({ where: { id: c.id } })).version,
    ).toBe(0);
  });
  it("refuses incomplete activation, missing confirmation and stale versions", async () => {
    const c = await draft();
    expect(
      (
        await request(app)
          .post(`/api/campaigns/${c.id}/transition`)
          .set(headers)
          .send({ version: 0, action: "activate", confirmed: true })
      ).status,
    ).toBe(422);
    const ready = await filled();
    expect(ready.status).toBe("READY");
    expect(
      (
        await request(app)
          .post(`/api/campaigns/${ready.id}/transition`)
          .set(headers)
          .send({ version: 1, action: "activate", confirmed: false })
      ).status,
    ).toBe(422);
    expect(
      (
        await request(app)
          .patch(`/api/campaigns/${ready.id}`)
          .set(headers)
          .send({ version: 0, patch: { budget: 400 } })
      ).status,
    ).toBe(409);
  });
  it("activates, matches context/country/budget and requires pause before editing", async () => {
    const c = await filled();
    const active = await request(app)
      .post(`/api/campaigns/${c.id}/transition`)
      .set(headers)
      .send({ version: 1, action: "activate", confirmed: true });
    expect(active.body.status).toBe("ACTIVE");
    const ctx = {
      publisherId: "byte-journal",
      country: "DE",
      category: "technology",
      keywords: ["software"],
    };
    expect(
      (await request(app).post("/api/ads/match").send(ctx)).body.ad.id,
    ).toBe(c.id);
    expect(
      (
        await request(app)
          .post("/api/ads/match")
          .send({ ...ctx, country: "FR" })
      ).body.ad,
    ).toBeNull();
    expect(
      (
        await request(app)
          .patch(`/api/campaigns/${c.id}`)
          .set(headers)
          .send({ version: 2, patch: { budget: 600 } })
      ).status,
    ).toBe(409);
    await db.campaign.update({
      where: { id: c.id },
      data: { spentCents: 50000 },
    });
    expect(
      (await request(app).post("/api/ads/match").send(ctx)).body.ad,
    ).toBeNull();
    expect(
      (
        await request(app)
          .post(`/api/campaigns/${c.id}/transition`)
          .set(headers)
          .send({ version: 2, action: "pause", confirmed: true })
      ).body.status,
    ).toBe("READY");
    expect(
      (
        await request(app)
          .delete(`/api/campaigns/${c.id}`)
          .set(headers)
          .send({ version: 3, confirmed: true })
      ).status,
    ).toBe(204);
  });
  it.each(["http://localhost:5173", "http://127.0.0.1:5173"])(
    "accepts the local dashboard origin %s",
    async (origin) => {
      const response = await request(app)
        .post("/api/campaigns")
        .set({ ...headers, Origin: origin })
        .send({ confirmed: true });
      expect(response.status).toBe(201);
      expect(response.headers["access-control-allow-origin"]).toBe(origin);
    },
  );
  it("blocks cross-origin writes and mutations without the demo header", async () => {
    expect(
      (await request(app).post("/api/campaigns").send({ confirmed: true }))
        .status,
    ).toBe(403);
    expect(
      (
        await request(app)
          .post("/api/campaigns")
          .set({ ...headers, Origin: "https://evil.example" })
          .send({ confirmed: true })
      ).status,
    ).toBe(403);
  });
  it("does not apply untrusted provider fields or invent publishers", async () => {
    const c = await draft();
    const evil = createApp({
      propose: async () => ({ patch: { publisherIds: ["made-up"] } }),
    });
    expect(
      (
        await request(evil)
          .post(`/api/campaigns/${c.id}/messages`)
          .set(headers)
          .send({ version: 0, content: "hello" })
      ).status,
    ).toBe(422);
    expect(await db.message.count()).toBe(0);
  });
  it("allows only one concurrent update for the same revision", async () => {
    const c = await draft();
    const responses = await Promise.all(
      [100, 200].map((budget) =>
        request(app)
          .patch(`/api/campaigns/${c.id}`)
          .set(headers)
          .send({ version: 0, patch: { budget } }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
  });
});
