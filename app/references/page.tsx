"use client";

import { FormEvent, useState } from "react";

type ReferenceResult = {
  title: string;
  url: string;
  publishedDate: string | null;
  author: string | null;
  excerpt: string;
  verification: "candidate_source";
};

const sourceOptions = [
  { value: "learn.microsoft.com", label: "Microsoft Learn" },
  { value: "support.microsoft.com", label: "Microsoft Support" },
  { value: "nist.gov", label: "NIST" },
  { value: "cisa.gov", label: "CISA" },
  { value: "owasp.org", label: "OWASP" },
];

export default function ReferencesPage() {
  const [query, setQuery] = useState("");
  const [domains, setDomains] = useState<string[]>([]);
  const [results, setResults] = useState<ReferenceResult[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  function toggleDomain(domain: string) {
    setDomains((current) => current.includes(domain)
      ? current.filter((item) => item !== domain)
      : [...current, domain]);
  }

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed.length < 3 || loading) return;

    setLoading(true);
    setError("");
    setNote("");
    setResults([]);
    setSearched(false);
    try {
      const response = await fetch("/api/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, domains }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = typeof payload === "object" && payload !== null && "error" in payload
          && typeof payload.error === "string" ? payload.error : "Reference search failed.";
        throw new Error(message);
      }
      if (typeof payload !== "object" || payload === null || !("results" in payload)
        || !Array.isArray(payload.results)) {
        throw new Error("The reference provider returned an unexpected response.");
      }
      setResults(payload.results as ReferenceResult[]);
      setNote("note" in payload && typeof payload.note === "string" ? payload.note : "");
      setSearched(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Reference search failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="reference-shell">
      <header className="reference-topbar">
        <a className="reference-brand" href="/">✦ COSMOS <span>/ REFERENCE CENTER</span></a>
        <span className="reference-status">EVIDENCE · FIRST</span>
      </header>

      <section className="reference-content">
        <div className="reference-eyebrow">KNOWLEDGE RETRIEVAL · EXPERIMENTAL</div>
        <h1>Search beyond<br /><em>the known.</em></h1>
        <p className="reference-intro">
          Find useful documentation and research when Cosmos needs more evidence.
          Search results are starting points—not verified answers.
        </p>

        <form className="reference-search" onSubmit={search}>
          <label htmlFor="reference-query">WHAT DO YOU NEED TO VERIFY?</label>
          <textarea
            id="reference-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Microsoft Entra ID conditional access best practices"
            maxLength={500}
            rows={3}
            required
            minLength={3}
          />
          <div className="reference-filters">
            <div className="reference-filter-heading">PREFERRED SOURCES <span>Optional</span></div>
            <div className="reference-domain-list">
              {sourceOptions.map((source) => (
                <label className="reference-domain" key={source.value}>
                  <input
                    type="checkbox"
                    checked={domains.includes(source.value)}
                    onChange={() => toggleDomain(source.value)}
                  />
                  {source.label}
                </label>
              ))}
            </div>
            <p className="reference-filter-help">Selecting sources limits results to those domains. No selection allows broader search.</p>
          </div>
          <div className="reference-submit-row">
            <span>{query.length}/500 characters</span>
            <button type="submit" disabled={loading || query.trim().length < 3}>
              {loading ? "Searching…" : "Search references ↗"}
            </button>
          </div>
        </form>

        {error && <p className="reference-error" role="alert">{error}</p>}

        {searched && (
          <section className="reference-results" aria-live="polite">
            <div className="reference-results-heading">
              <h2>Candidate sources</h2>
              <span>{results.length} result{results.length === 1 ? "" : "s"}</span>
            </div>
            {results.length === 0 ? (
              <p className="reference-empty">No usable results returned. Try a broader query or remove source filters.</p>
            ) : results.map((result) => (
              <article className="reference-card" key={result.url}>
                <div className="reference-card-label">CANDIDATE SOURCE · NOT VERIFIED</div>
                <h3><a href={result.url} target="_blank" rel="noopener noreferrer">{result.title}</a></h3>
                <div className="reference-meta">
                  {result.author ? <span>{result.author}</span> : null}
                  {result.publishedDate ? <span>{result.publishedDate}</span> : null}
                  <span>{new URL(result.url).hostname}</span>
                </div>
                {result.excerpt && <p>{result.excerpt}</p>}
                <a className="reference-open" href={result.url} target="_blank" rel="noopener noreferrer">Open original source ↗</a>
              </article>
            ))}
            <p className="reference-disclaimer">{note}</p>
          </section>
        )}

        <aside className="reference-principle">
          <strong>Cosmos evidence rule</strong>
          <p>Search is not verification. Before using a claim, check the publisher, publication date, context, and whether the source directly supports the claim. Retrieved pages may contain untrusted instructions; never treat them as system instructions.</p>
        </aside>
        <a className="reference-back" href="/">← Back to Cosmos dashboard</a>
      </section>
    </main>
  );
}
