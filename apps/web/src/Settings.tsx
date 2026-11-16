import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "./api";
export type Health = {
  mode: string;
  provider: string;
  model: string;
  aiConfigured: boolean;
  localOnly: boolean;
};
export function Settings({
  name,
  onName,
  motion,
  onMotion,
}: {
  name: string;
  onName: (value: string) => void;
  motion: boolean;
  onMotion: (value: boolean) => void;
}) {
  const [value, setValue] = useState(name),
    [saved, setSaved] = useState(false);
  const q = useQuery({
    queryKey: ["health"],
    queryFn: () => api<Health>("/health"),
  });
  const check = useMutation({
    mutationFn: () =>
      api<{ ok: boolean; tokens: number; checkedAt: string }>(
        "/ai/check",
        "POST",
        { confirmed: true },
      ),
  });
  return (
    <>
      <p className="eyebrow">MAKE ROOM FOR YOUR IDEAS</p>
      <h1>Your workspace, your rhythm.</h1>
      <p className="muted">
        A little personalization. A clear connection. Everything in its place.
      </p>
      <div className="settings-grid">
        <section className="card padded settings-form">
          <span className="chapter">01 / PERSONAL TOUCH</span>
          <h2>A place that feels like you</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onName(value.trim());
              setSaved(true);
            }}
          >
            <label>
              Workspace name
              <input
                required
                maxLength={50}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setSaved(false);
                }}
              />
            </label>
            <button type="submit" disabled={!value.trim()}>
              Save workspace name
            </button>
            {saved && (
              <p role="status" className="notice">
                Your workspace name is saved on this browser.
              </p>
            )}
          </form>
          <label className="motion-control">
            <input
              type="checkbox"
              checked={motion}
              onChange={(e) => onMotion(e.target.checked)}
            />{" "}
            Gentle animations
          </label>
          <small>
            Your system's reduced-motion preference always takes priority.
          </small>
          <div className="palette">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <p className="muted">
            Lavender, moonstone, and a quiet touch of violet.
          </p>
        </section>
        <section className="card padded settings-form">
          <span className="chapter">02 / YOUR ASSISTANT</span>
          <h2>OpenAI connection</h2>
          {q.isPending ? (
            <p>Checking configuration…</p>
          ) : (
            <>
              <div className="connection-state">
                <span
                  className={`connection-dot ${q.data?.aiConfigured ? "ready" : ""}`}
                />
                {q.data?.aiConfigured
                  ? "API key configured · verification available"
                  : "API key needed"}
              </div>
              <p className="muted">
                Model: <code>{q.data?.model ?? "Unavailable"}</code>
              </p>
              <p>
                Open the project's private <code>.env</code> file and add your
                key to <code>OPENAI_API_KEY</code>. Restart the app afterward.
              </p>
              <pre className="code-block">OPENAI_API_KEY=your-key-here</pre>
              <p className="muted">
                Your key stays on the local server. Campaign forms and publisher
                previews work without it.
              </p>
              <a
                className="inline-link"
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
              >
                Open OpenAI API keys ↗
              </a>
              <div className="connection-check">
                <button
                  disabled={!q.data?.aiConfigured || check.isPending}
                  onClick={() => check.mutate()}
                >
                  {check.isPending
                    ? "Checking connection…"
                    : "Check OpenAI connection"}
                </button>
                <small>
                  This sends one small API request and may use paid API credits.
                </small>
              </div>
            </>
          )}
          {(q.error || check.error) && (
            <p role="alert" className="error">
              {(q.error || check.error)?.message}
            </p>
          )}
          {check.data && (
            <p className="notice" role="status">
              Connected successfully. A structured response was validated ·{" "}
              {check.data.tokens ?? "Unknown"} tokens.
            </p>
          )}
        </section>
      </div>
      <section className="card padded workspace-notes">
        <h2>Made for your computer</h2>
        <p>
          Your campaigns and conversations are saved locally. When you use AI
          chat, the current draft and recent messages are sent to OpenAI. Active
          campaigns can appear on your connected publisher pages. Budgets are
          planning limits; this app does not purchase placements or charge them.
        </p>
      </section>
    </>
  );
}
