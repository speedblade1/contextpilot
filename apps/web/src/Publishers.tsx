import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categories, type Publisher } from "@contextpilot/shared";
import { api } from "./api";
export function Publishers() {
  const cache = useQueryClient();
  const q = useQuery({
    queryKey: ["publishers"],
    queryFn: () => api<Publisher[]>("/publishers"),
  });
  const [name, setName] = useState(""),
    [siteUrl, setUrl] = useState(""),
    [category, setCategory] =
      useState<(typeof categories)[number]>("technology"),
    [deleting, setDeleting] = useState<string | null>(null),
    [copied, setCopied] = useState("");
  const add = useMutation({
    mutationFn: () =>
      api("/publishers", "POST", { name, siteUrl, category, confirmed: true }),
    onSuccess: () => {
      setName("");
      setUrl("");
      void cache.invalidateQueries({ queryKey: ["publishers"] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) =>
      api(`/publishers/${id}`, "DELETE", { confirmed: true }),
    onSuccess: () => {
      setDeleting(null);
      void cache.invalidateQueries({ queryKey: ["publishers"] });
    },
  });
  function snippet(p: Publisher) {
    return `import { ContextPilot } from '@contextpilot/sdk';\nconst ads = new ContextPilot({\n  publisherId: '${p.id}',\n  apiUrl: 'http://localhost:4000'\n});\nawait ads.renderAd({\n  container: '#ad-container',\n  context: {category: '${p.category}', keywords: [], country: 'US'}\n});\n// Call ads.dispose() when leaving the page.`;
  }
  return (
    <>
      <p className="eyebrow">THE RIGHT PLACE FOR YOUR STORY</p>
      <h1>Your publisher network</h1>
      <p className="muted">
        Connect your own pages and choose where each campaign belongs.
      </p>
      <section className="card padded">
        <h2>Add a publisher</h2>
        <form
          className="publisher-form"
          onSubmit={(e) => {
            e.preventDefault();
            add.mutate();
          }}
        >
          <label>
            Publisher name
            <input
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your publication"
            />
          </label>
          <label>
            Website URL
            <input
              required
              type="url"
              value={siteUrl}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://localhost:5174"
            />
          </label>
          <label>
            Publisher category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <button disabled={add.isPending}>Add publisher</button>
        </form>
        <small>
          The API runs on this computer. To integrate another local site, add
          its origin to CORS_ORIGINS in .env.
        </small>
      </section>
      {(q.error || add.error || remove.error) && (
        <p role="alert" className="error">
          {(q.error || add.error || remove.error)?.message}
        </p>
      )}
      {q.isPending ? (
        <p>Loading publishers…</p>
      ) : (
        <div className="publisher-grid">
          {q.data?.map((p) => (
            <article className="card padded publisher-card" key={p.id}>
              <span className="mini-icon">✧</span>
              <h2>{p.name}</h2>
              <span className="pill">{p.category}</span>
              <p>
                {p.siteUrl ? (
                  <a href={p.siteUrl} target="_blank" rel="noreferrer">
                    {p.siteUrl} ↗
                  </a>
                ) : (
                  "Website not configured"
                )}
              </p>
              <details>
                <summary>Integration code</summary>
                <pre className="code-block">{snippet(p)}</pre>
                <button
                  className="secondary"
                  onClick={() => {
                    void navigator.clipboard
                      .writeText(snippet(p))
                      .then(() => setCopied(p.id))
                      .catch(() => setCopied("unavailable"));
                  }}
                >
                  {copied === p.id ? "Copied" : "Copy code"}
                </button>
                {copied === "unavailable" && (
                  <small>Select and copy the code above.</small>
                )}
              </details>
              <div className="publisher-delete">
                {deleting === p.id ? (
                  <>
                    <span>Delete this publisher?</span>
                    <button
                      className="secondary"
                      onClick={() => setDeleting(null)}
                    >
                      Cancel
                    </button>
                    <button
                      disabled={remove.isPending}
                      onClick={() => remove.mutate(p.id)}
                    >
                      Confirm delete
                    </button>
                  </>
                ) : (
                  <button
                    className="text-button danger"
                    onClick={() => setDeleting(p.id)}
                  >
                    Remove publisher
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
