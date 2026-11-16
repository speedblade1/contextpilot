import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  countries,
  categories,
  missingFields,
  type Campaign,
  type Draft,
  type Message,
  type Publisher,
} from "@contextpilot/shared";
import { api } from "./api";
import "./styles.css";
import { Settings, type Health } from "./Settings";
import { Publishers } from "./Publishers";
import { MoonGarden } from "./MoonGarden";
import { CampaignProgress } from "./CampaignProgress";
const client = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: 0 },
  },
});
function ErrorNotice({ error }: { error: Error | null }) {
  return error ? (
    <p role="alert" className="error">
      {error.message}
    </p>
  ) : null;
}
function App() {
  const [workspace, setWorkspace] = useState(
    () => localStorage.getItem("workspace-name") || "Moonlit workspace",
  );
  const [motion, setMotion] = useState(
    () => localStorage.getItem("gentle-motion") !== "off",
  );
  useEffect(() => {
    localStorage.setItem("workspace-name", workspace);
  }, [workspace]);
  useEffect(() => {
    localStorage.setItem("gentle-motion", motion ? "on" : "off");
    document.documentElement.dataset.motion = motion ? "on" : "off";
  }, [motion]);
  const [dark, setDark] = useState(
    () => localStorage.getItem("theme") === "dark",
  );
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link to="/" className="brand">
          <span className="brand-icon">◈</span>ContextPilot
          <span className="brand-dot">.</span>
        </Link>
        <p className="nav-label">WORKSPACE</p>
        <nav>
          <NavLink to="/" end>
            ▦ <span>Campaigns</span>
          </NavLink>
          <NavLink to="/settings">
            ☾ <span>Workspace settings</span>
          </NavLink>
          <NavLink to="/publishers">
            ◉ <span>Publisher network</span>
          </NavLink>
          <a href="http://localhost:5174" target="_blank" rel="noreferrer">
            ↗ <span>Publisher preview</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy">
            <span>◎ Context, with care.</span>
            <p>
              No cookies. No profiles.
              <br />
              Just relevant connections.
            </p>
          </div>
          <button className="secondary" onClick={() => setDark(!dark)}>
            {dark ? "☀ Light appearance" : "☾ Dark appearance"}
          </button>
          <div className="profile">
            <span className="avatar">CP</span>
            <div>
              {workspace}
              <small>Your personal studio</small>
            </div>
          </div>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <span>
            Workspace <span className="muted">/ Advertising</span>
          </span>
          <span className="pill">✧ A little magic, a clear purpose</span>
          <button
            className="secondary mobile-theme"
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setDark(!dark)}
          >
            {dark ? "☀" : "☾"}
          </button>
        </header>
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/campaigns/:id" element={<Builder />} />
            <Route path="/publishers" element={<Publishers />} />
            <Route
              path="/settings"
              element={
                <Settings
                  name={workspace}
                  onName={setWorkspace}
                  motion={motion}
                  onMotion={setMotion}
                />
              }
            />
            <Route
              path="*"
              element={
                <p>
                  Page not found. <Link to="/">Go to campaigns</Link>
                </p>
              }
            />
          </Routes>
        </div>
      </main>
    </div>
  );
}
function Dashboard() {
  const navigate = useNavigate(),
    cache = useQueryClient();
  const query = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api<Campaign[]>("/campaigns"),
  });
  const create = useMutation({
    mutationFn: () => api<Campaign>("/campaigns", "POST", { confirmed: true }),
    onSuccess: (c) => {
      void cache.invalidateQueries({ queryKey: ["campaigns"] });
      navigate(`/campaigns/${c.id}`);
    },
  });
  const rows = query.data ?? [];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</p>
          <h1>Your campaigns</h1>
          <p className="muted">
            A quiet space to turn your ideas into meaningful connections.
          </p>
        </div>
        <button onClick={() => create.mutate()} disabled={create.isPending}>
          ＋ Create campaign
        </button>
      </div>
      <ErrorNotice error={query.error ?? create.error} />
      <section className="stats">
        <Stat
          label="Total campaigns"
          value={String(rows.length)}
          note="Across your workspace"
        />
        <Stat
          label="Active campaigns"
          value={String(rows.filter((c) => c.status === "ACTIVE").length)}
          note="Available to your publishers"
        />
        <Stat
          label="Allocated budget"
          value={`$${rows.reduce((sum, c) => sum + (c.data.budget ?? 0), 0).toLocaleString()}`}
          note="USD · planned allocation"
        />
        <Stat
          label="Ads served"
          value={rows
            .reduce((sum, c) => sum + c.servedRequests, 0)
            .toLocaleString()}
          note="Matched requests, not unique views"
        />
      </section>
      <section className="intro-card">
        <div>
          <span className="eyebrow">
            SMALL BEGINNINGS. BEAUTIFUL POSSIBILITIES.
          </span>
          <h2>Every good story starts somewhere.</h2>
          <p>
            Describe what you're promoting. Shape the details together.
            <br />
            Take your time. Make it yours.
          </p>
          <button
            className="secondary"
            onClick={() => create.mutate()}
            disabled={create.isPending}
          >
            Build a campaign →
          </button>
        </div>
        <MoonGarden />
      </section>
      <section className="card">
        <div className="section-heading">
          <h2>
            Campaign overview <span className="count">{rows.length}</span>
          </h2>
          <span className="muted">All campaigns</span>
        </div>
        {query.isPending ? (
          <p className="padded">Loading campaigns…</p>
        ) : rows.length === 0 ? (
          <p className="padded">
            No campaigns yet. Create your first campaign above.
          </p>
        ) : (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Status</th>
                  <th>Markets</th>
                  <th>Budget</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/campaigns/${c.id}`} className="campaign-name">
                        {c.data.campaignName ?? "Untitled campaign"}
                      </Link>
                      <small>{c.data.category ?? "Awaiting your idea"}</small>
                    </td>
                    <td>
                      <span className={`status ${c.status.toLowerCase()}`}>
                        {c.status}
                      </span>
                    </td>
                    <td>{c.data.targetCountries?.join(", ") ?? "—"}</td>
                    <td>${c.data.budget?.toLocaleString() ?? "—"}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Link
                        aria-label={`Open ${c.data.campaignName ?? "Untitled campaign"}`}
                        to={`/campaigns/${c.id}`}
                      >
                        ↗
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <p className="footnote">
        Made for thoughtful ideas. Built around your context.
      </p>
    </>
  );
}
function Stat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}
type Detail = { campaign: Campaign; messages: Message[] };
function Builder() {
  const { id } = useParams(),
    cache = useQueryClient(),
    navigate = useNavigate();
  const detail = useQuery({
    queryKey: ["campaign", id],
    queryFn: () => api<Detail>(`/campaigns/${id}`),
  });
  const publishers = useQuery({
    queryKey: ["publishers"],
    queryFn: () => api<Publisher[]>("/publishers"),
  });
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api<Health>("/health"),
  });
  const [text, setText] = useState(""),
    [form, setForm] = useState<Draft>({}),
    [notice, setNotice] = useState(""),
    [confirm, setConfirm] = useState<
      "activate" | "save" | "pause" | "delete" | null
    >(null);
  useEffect(() => {
    if (detail.data) setForm(detail.data.campaign.data);
  }, [detail.data]);
  const refresh = async () => {
    await cache.invalidateQueries({ queryKey: ["campaign", id] });
    await cache.invalidateQueries({ queryKey: ["campaigns"] });
  };
  const message = useMutation({
    mutationFn: () =>
      api<Detail>(`/campaigns/${id}/messages`, "POST", {
        version: detail.data!.campaign.version,
        content: text,
      }),
    onSuccess: async () => {
      setText("");
      await refresh();
    },
  });
  const edit = useMutation({
    mutationFn: () =>
      api<Campaign>(`/campaigns/${id}`, "PATCH", {
        version: detail.data!.campaign.version,
        patch: form,
      }),
    onSuccess: async () => {
      setNotice("Changes validated and stored. Review before activation.");
      await refresh();
    },
  });
  const action = useMutation({
    mutationFn: () =>
      api(
        `/campaigns/${id}${confirm === "delete" ? "" : "/transition"}`,
        confirm === "delete" ? "DELETE" : "POST",
        {
          version: detail.data!.campaign.version,
          ...(confirm === "delete" ? {} : { action: confirm }),
          confirmed: true,
        },
      ),
    onSuccess: async () => {
      const deleted = confirm === "delete";
      setConfirm(null);
      setNotice("Confirmed. Campaign updated.");
      await refresh();
      if (deleted) navigate("/");
    },
  });
  if (detail.isPending) return <p>Loading campaign…</p>;
  if (!detail.data) return <ErrorNotice error={detail.error} />;
  const { campaign, messages } = detail.data;
  const missing = missingFields(campaign.data),
    busy = message.isPending || edit.isPending || action.isPending,
    locked = campaign.status === "ACTIVE";
  const dirty = JSON.stringify(form) !== JSON.stringify(campaign.data);
  const set = (key: keyof Draft, value: unknown) =>
    setForm((f) => ({ ...f, [key]: value }));
  return (
    <>
      <Link className="back" to="/">
        ← All campaigns
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">AI CAMPAIGN BUILDER</p>
          <h1>
            {campaign.data.campaignName ?? "A good campaign starts here."}
          </h1>
          <p className="muted">
            Tell us your idea. Fine-tune the details. Launch when you're ready.
          </p>
        </div>
        <span className={`status ${campaign.status.toLowerCase()}`}>
          {campaign.status}
        </span>
      </div>
      <ErrorNotice
        error={
          detail.error ??
          publishers.error ??
          health.error ??
          message.error ??
          edit.error ??
          action.error
        }
      />
      {notice && (
        <p role="status" className="notice">
          {notice}
        </p>
      )}
      {health.data && !health.data.aiConfigured && (
        <div className="connection-banner">
          <span>✧</span>
          <div>
            <strong>Your assistant is almost ready.</strong>
            <p>
              Add your OpenAI key to use chat. You can fill in every campaign
              detail on the right now.
            </p>
          </div>
          <Link to="/settings">Connect OpenAI →</Link>
        </div>
      )}
      <div className="builder-grid">
        <section className="card chat">
          <div className="section-heading">
            <div>
              <h2>
                <span className="mini-icon">◈</span> Your thoughtful companion
              </h2>
              <small>
                {health.data?.aiConfigured
                  ? health.data.mode === "demo"
                    ? "Automated test provider"
                    : "OpenAI · your ideas, thoughtfully shaped"
                  : "Connect OpenAI to start a conversation"}
              </small>
            </div>
            <span className="online">●</span>
          </div>
          <div className="messages" aria-live="polite">
            <div className="bubble assistant">
              <strong>Let's find your context.</strong>
              <p>
                What are you promoting, where would you like to reach people,
                and what's your budget?
              </p>
              <small>
                Try: “Promote my programming course in Germany and France with a
                budget of $500.”
              </small>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`bubble ${m.role}`}>
                <small>{m.role === "user" ? "YOU" : "CONTEXTPILOT"}</small>
                <p>{m.content}</p>
              </div>
            ))}
            {message.isPending && (
              <p role="status">Validating your next step…</p>
            )}
          </div>
          <form
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              message.mutate();
            }}
          >
            <label htmlFor="message">Your message</label>
            <textarea
              id="message"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe your campaign, or ask for a change…"
              maxLength={4000}
              disabled={locked || busy || dirty || !health.data?.aiConfigured}
            />
            <div>
              <small>
                {dirty
                  ? "Apply review edits before chatting."
                  : health.data?.mode === "live"
                    ? "Messages are sent to your configured AI provider."
                    : "Your draft is stored on this computer."}
              </small>
              <button
                disabled={
                  !text.trim() ||
                  locked ||
                  busy ||
                  dirty ||
                  !health.data?.aiConfigured
                }
                type="submit"
              >
                Send ↑
              </button>
            </div>
          </form>
        </section>
        <section className="card review">
          <div className="section-heading">
            <div>
              <h2>Campaign configuration</h2>
              <small>You're in control of the final details.</small>
            </div>
          </div>
          <CampaignProgress draft={campaign.data} />
          <form
            onSubmit={(e) => {
              e.preventDefault();
              edit.mutate();
            }}
            className="review-form"
          >
            <fieldset disabled={locked || busy}>
              <label>
                Campaign name
                <input
                  value={form.campaignName ?? ""}
                  onChange={(e) => set("campaignName", e.target.value)}
                  maxLength={100}
                />
              </label>
              <label>
                Product description
                <textarea
                  value={form.productDescription ?? ""}
                  onChange={(e) => set("productDescription", e.target.value)}
                  maxLength={1000}
                />
              </label>
              <div className="form-row">
                <label>
                  Budget (USD)
                  <input
                    type="number"
                    min="0.01"
                    max="1000000"
                    step="0.01"
                    value={form.budget ?? ""}
                    onChange={(e) =>
                      set(
                        "budget",
                        e.target.value === ""
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                  />
                </label>
                <label>
                  Category
                  <select
                    value={form.category ?? ""}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    <option value="" disabled>
                      Select category
                    </option>
                    {categories.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                Destination URL
                <input
                  type="url"
                  value={form.destinationUrl ?? ""}
                  onChange={(e) => set("destinationUrl", e.target.value)}
                  placeholder="https://example.com"
                />
              </label>
              <span className="field-label">Target countries</span>
              <div className="checks">
                {countries.map((c) => (
                  <label key={c}>
                    <input
                      type="checkbox"
                      checked={form.targetCountries?.includes(c) ?? false}
                      onChange={(e) =>
                        set(
                          "targetCountries",
                          e.target.checked
                            ? [...(form.targetCountries ?? []), c]
                            : (form.targetCountries ?? []).filter(
                                (x) => x !== c,
                              ),
                        )
                      }
                    />
                    {c}
                  </label>
                ))}
              </div>
              <span className="field-label">Publishers</span>
              <div className="publisher-checks">
                {publishers.data?.map((p) => (
                  <label key={p.id}>
                    <input
                      type="checkbox"
                      checked={form.publisherIds?.includes(p.id) ?? false}
                      onChange={(e) =>
                        set(
                          "publisherIds",
                          e.target.checked
                            ? [...(form.publisherIds ?? []), p.id]
                            : (form.publisherIds ?? []).filter(
                                (x) => x !== p.id,
                              ),
                        )
                      }
                    />
                    {p.name}
                    <small>{p.category}</small>
                  </label>
                ))}
              </div>
              <button
                className="secondary full"
                disabled={!dirty || busy}
                type="submit"
              >
                Apply review edits
              </button>
            </fieldset>
          </form>
          <div className="review-actions">
            {locked ? (
              <button disabled={busy} onClick={() => setConfirm("pause")}>
                Pause campaign to edit
              </button>
            ) : (
              <>
                <button
                  className="full"
                  disabled={missing.length > 0 || busy || dirty}
                  onClick={() => setConfirm("activate")}
                >
                  Review & activate campaign →
                </button>
                <button
                  className="secondary full"
                  disabled={missing.length > 0 || busy || dirty}
                  onClick={() => setConfirm("save")}
                >
                  Confirm & save campaign
                </button>
              </>
            )}
            <small>
              Draft changes autosave after validation. Activation always needs
              your confirmation.
            </small>
            <button
              className="text-button danger"
              disabled={busy}
              onClick={() => setConfirm("delete")}
            >
              Delete campaign
            </button>
          </div>
        </section>
      </div>
      {confirm && (
        <div className="modal-backdrop">
          <section
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onKeyDown={(e) => {
              if (e.key === "Escape" && !busy) setConfirm(null);
              if (e.key === "Tab") {
                const items = Array.from(
                  e.currentTarget.querySelectorAll<HTMLButtonElement>(
                    "button:not(:disabled)",
                  ),
                );
                const first = items[0],
                  last = items.at(-1);
                if (e.shiftKey && document.activeElement === first) {
                  e.preventDefault();
                  last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                  e.preventDefault();
                  first?.focus();
                }
              }
            }}
          >
            <h2 id="confirm-title">
              Confirm {confirm === "activate" ? "campaign activation" : confirm}
            </h2>
            <p>
              {campaign.data.campaignName} · ${campaign.data.budget} USD ·{" "}
              {campaign.data.targetCountries?.join(", ")}
            </p>
            <p>
              {confirm === "delete"
                ? "This deletes the campaign and its conversation."
                : "Activation makes this campaign eligible on your connected publisher pages. No budget will be charged."}
            </p>
            <div className="button-row">
              <button
                autoFocus
                className="secondary"
                disabled={busy}
                onClick={() => setConfirm(null)}
              >
                Cancel
              </button>
              <button disabled={busy} onClick={() => action.mutate()}>
                Confirm {confirm}
              </button>
            </div>
            <ErrorNotice error={action.error} />
          </section>
        </div>
      )}
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={client}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);

import "./moonlit.css";
