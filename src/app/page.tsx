"use client";

import { useState } from "react";

type SearchResult = {
  package_id: number;
  title: string;
  hybrid_score: number;
  semantic_score: number;
  lexical_score: number;
  summary?: string;
  topics?: string[];
  organizations?: string[];
};

type AskResponse = {
  ok?: boolean;
  ask_token?: string;
  status?: "queued" | "retrieving" | "generating" | "completed" | "failed";
  answer?: string;
  source_package_ids?: number[];
  insufficient_evidence?: boolean;
  sources?: SearchResult[];
  error?: string;
  detail?: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [askQuery, setAskQuery] = useState("");

  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [answer, setAnswer] = useState<AskResponse | null>(null);

  const [searching, setSearching] = useState(false);
  const [asking, setAsking] = useState(false);
  const [askStatus, setAskStatus] = useState("");

  const [error, setError] = useState("");

  async function runSearch() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError("");
    setSearchResults([]);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: searchQuery,
          limit: 10,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || "Search failed"
        );
      }

      setSearchResults(data.results || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err)
      );
    } finally {
      setSearching(false);
    }
  }

  async function runAsk() {
    if (!askQuery.trim()) return;

    setAsking(true);
    setError("");
    setAnswer(null);
    setAskStatus("Submitting...");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: askQuery,
          limit: 5,
        }),
      });

      const data: AskResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || "Ask failed"
        );
      }

      // Backward compatibility if a synchronous backend is ever used.
      if (response.status !== 202 || !data.ask_token) {
        setAnswer(data);
        setAskStatus("");
        return;
      }

      const token = data.ask_token;
      setAskStatus("Queued...");

      // Each status request is intentionally short. The expensive
      // Nemotron inference runs on the Spark in the background.
      for (let attempt = 0; attempt < 300; attempt += 1) {
        await sleep(2000);

        const statusResponse = await fetch(
          `/api/ask-status/${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const statusData: AskResponse = await statusResponse.json();

        if (!statusResponse.ok) {
          throw new Error(
            statusData.detail ||
              statusData.error ||
              "Could not read ask status"
          );
        }

        if (statusData.status === "completed") {
          setAnswer(statusData);
          setAskStatus("");
          return;
        }

        if (statusData.status === "failed") {
          throw new Error(
            statusData.error || "Grounded RAG generation failed"
          );
        }

        if (statusData.status === "retrieving") {
          setAskStatus("Retrieving evidence...");
        } else if (statusData.status === "generating") {
          setAskStatus("Reasoning over evidence...");
        } else {
          setAskStatus("Queued...");
        }
      }

      throw new Error("Ask timed out while waiting for background inference");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : String(err)
      );
      setAskStatus("");
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-12">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-zinc-500">
            DGX Spark Research Infrastructure
          </p>

          <h1 className="text-5xl font-semibold tracking-tight">
            Research Knowledge Hub
          </h1>

          <p className="mt-4 max-w-3xl text-lg text-zinc-400">
            Capture multimodal research evidence, search the
            accumulated knowledge, and ask grounded questions
            against your team&apos;s research memory.
          </p>

          <div className="mt-6">
            <a
              href="/upload"
              className="inline-flex rounded-xl bg-white px-5 py-3 font-medium text-black transition hover:bg-zinc-200"
            >
              Upload Knowledge
            </a>
          </div>
        </header>

        {error && (
          <div className="mb-8 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-5">
              <p className="text-sm text-zinc-500">
                Hybrid Retrieval
              </p>
              <h2 className="mt-1 text-2xl font-medium">
                Search Knowledge
              </h2>
            </div>

            <textarea
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts, companies, projects, technologies..."
              className="min-h-32 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 outline-none focus:border-zinc-500"
            />

            <button
              onClick={runSearch}
              disabled={searching}
              className="mt-4 rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
            >
              {searching ? "Searching..." : "Search"}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="mb-5">
              <p className="text-sm text-zinc-500">
                Grounded RAG
              </p>
              <h2 className="mt-1 text-2xl font-medium">
                Ask the Library
              </h2>
            </div>

            <textarea
              value={askQuery}
              onChange={(e) => setAskQuery(e.target.value)}
              placeholder="What does our collected evidence suggest about..."
              className="min-h-32 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 outline-none focus:border-zinc-500"
            />

            <button
              onClick={runAsk}
              disabled={asking}
              className="mt-4 rounded-xl bg-white px-5 py-3 font-medium text-black disabled:opacity-50"
            >
              {asking ? askStatus || "Thinking..." : "Ask"}
            </button>
          </div>
        </section>

        {answer && (
          <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-7">
            <p className="text-sm uppercase tracking-wider text-zinc-500">
              Answer
            </p>

            <p className="mt-4 whitespace-pre-wrap text-lg leading-8">
              {answer.answer}
            </p>

            {answer.source_package_ids &&
              answer.source_package_ids.length > 0 && (
                <div className="mt-6">
                  <p className="mb-2 text-sm text-zinc-500">
                    Evidence packages
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {answer.source_package_ids.map((id) => (
                      <span
                        key={id}
                        className="rounded-full border border-zinc-700 px-3 py-1 text-sm"
                      >
                        Package #{id}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </section>
        )}

        {searchResults.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-4 text-2xl font-medium">
              Search Results
            </h2>

            <div className="space-y-4">
              {searchResults.map((result) => (
                <article
                  key={result.package_id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-zinc-500">
                        Package #{result.package_id}
                      </p>

                      <h3 className="mt-1 text-xl font-medium">
                        {result.title}
                      </h3>
                    </div>

                    <div className="text-right text-xs text-zinc-500">
                      Hybrid{" "}
                      {result.hybrid_score?.toFixed(3)}
                    </div>
                  </div>

                  {result.summary && (
                    <p className="mt-4 leading-7 text-zinc-300">
                      {result.summary}
                    </p>
                  )}

                  {result.organizations &&
                    result.organizations.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {result.organizations.map((org) => (
                          <span
                            key={org}
                            className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300"
                          >
                            {org}
                          </span>
                        ))}
                      </div>
                    )}
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
