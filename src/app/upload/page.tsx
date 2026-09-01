"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import Link from "next/link";

type UploadResponse = {
  ok?: boolean;
  accepted?: boolean;
  processing?: boolean;
  package_token?: string;
  package_id?: number | null;
  title?: string;
  files?: string[];
  stage?: string;
  current_stage?: string;
  completed_stages?: string[];
  failed_stage?: string | null;
  error?: string | null;
  message?: string;
  detail?: unknown;
};

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 400;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILE_SIZE_LABEL = "10 MB";
const KNOWLEDGE_API_URL = (
  process.env.NEXT_PUBLIC_KNOWLEDGE_API_URL ||
  "https://knowledge-api.albertomunoz.ai"
).replace(/\/+$/, "");

function formatFileSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState("");

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files || []);

    const oversized = selected.filter(
      (file) => file.size > MAX_FILE_SIZE_BYTES
    );

    if (oversized.length > 0) {
      const names = oversized.map((file) => file.name).join(", ");
      event.target.value = "";
      setFiles([]);
      setResult(null);
      setError(
        `${names} exceed${oversized.length === 1 ? "s" : ""} the ${MAX_FILE_SIZE_LABEL} limit per file.`
      );
      return;
    }

    setFiles(selected);
    setResult(null);
    setError("");
  }

  async function pollPipeline(packageToken: string) {
    for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
      await sleep(POLL_INTERVAL_MS);

      const response = await fetch(
        `/api/pipeline/${encodeURIComponent(packageToken)}`,
        { cache: "no-store" }
      );

      const contentType = response.headers.get("content-type") || "";
      const data: UploadResponse = contentType.includes("application/json")
        ? await response.json()
        : { detail: await response.text() };

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail)
        );
      }

      setResult(data);

      if (data.failed_stage) {
        throw new Error(
          data.error || `Pipeline paused at ${data.failed_stage}`
        );
      }

      if (
        data.current_stage === "searchable" ||
        data.stage === "searchable"
      ) {
        return data;
      }
    }

    throw new Error(
      "Processing is still running. The package is safe on DGX Spark; use the package token to check it again later."
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      setError("Please enter a package title.");
      return;
    }

    if (files.length === 0) {
      setError("Please select at least one image or PDF.");
      return;
    }

    const oversized = files.find(
      (file) => file.size > MAX_FILE_SIZE_BYTES
    );

    if (oversized) {
      setError(
        `${oversized.name} exceeds the ${MAX_FILE_SIZE_LABEL} limit per file.`
      );
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("title", title.trim());
    form.append("note", note.trim());

    for (const file of files) {
      form.append("files", file);
    }

    try {
      const response = await fetch(`${KNOWLEDGE_API_URL}/upload`, {
        method: "POST",
        body: form,
      });

      const contentType = response.headers.get("content-type") || "";
      const data: UploadResponse = contentType.includes("application/json")
        ? await response.json()
        : { detail: await response.text() };

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail)
        );
      }

      setResult(data);

      if (
        data.package_token &&
        data.stage !== "searchable" &&
        data.current_stage !== "searchable"
      ) {
        await pollPipeline(data.package_token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  const currentStage =
    result?.current_stage || result?.stage || "waiting";

  const complete = currentStage === "searchable";

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm text-zinc-500 hover:text-white">
          ← Research Knowledge Hub
        </Link>

        <header className="mt-8 mb-10">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            Multimodal Capture · v1
          </p>

          <h1 className="mt-2 text-4xl font-semibold">Upload Knowledge</h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Upload images, screenshots, slides or PDF papers. The request is
            accepted immediately, while the DGX Spark continues extraction,
            synthesis, archival and indexing in the background.
          </p>
        </header>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7"
        >
          <label className="block">
            <span className="text-sm text-zinc-400">Package title</span>

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Visual Pose Tracking Teleoperation"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 outline-none focus:border-zinc-500"
            />
          </label>

          <label className="mt-6 block">
            <span className="text-sm text-zinc-400">Research note</span>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why is this relevant?"
              className="mt-2 min-h-24 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 outline-none focus:border-zinc-500"
            />
          </label>

          <label className="mt-6 block">
            <span className="text-sm text-zinc-400">
              Images, screenshots, slides or PDFs · maximum {MAX_FILE_SIZE_LABEL} per file
            </span>

            <input
              type="file"
              accept="image/*,application/pdf,.pdf"
              multiple
              onChange={selectFiles}
              className="mt-2 block w-full rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-6"
            />
          </label>

          {files.length > 0 && (
            <div className="mt-5 rounded-xl bg-zinc-950 p-4">
              <p className="text-sm font-medium">
                {files.length} resource{files.length !== 1 ? "s" : ""} selected
              </p>

              <div className="mt-3 space-y-1 text-sm text-zinc-500">
                {files.map((file, index) => (
                  <p key={`${file.name}-${index}`}>
                    {index + 1}. {file.name} · {formatFileSize(file.size)}
                  </p>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-900 bg-red-950/40 p-4 text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={uploading}
            className="mt-7 rounded-xl bg-white px-6 py-3 font-medium text-black disabled:opacity-50"
          >
            {uploading ? "Processing on DGX Spark..." : "Upload Knowledge"}
          </button>
        </form>

        {result?.ok && (
          <section
            className={`mt-8 rounded-2xl border p-7 ${
              complete
                ? "border-emerald-900 bg-emerald-950/20"
                : "border-sky-900 bg-sky-950/20"
            }`}
          >
            <p
              className={`text-sm uppercase tracking-wider ${
                complete ? "text-emerald-500" : "text-sky-400"
              }`}
            >
              {complete ? "Capture complete" : "Processing asynchronously"}
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              {result.title || title}
            </h2>

            <div className="mt-5 space-y-2 text-zinc-300">
              {result.files && <p>Resources: {result.files.length}</p>}
              <p>Stage: {currentStage}</p>
              <p>Package token: {result.package_token}</p>
              {result.package_id && <p>Package ID: {result.package_id}</p>}
            </div>

            {!complete && (
              <p className="mt-5 text-sm leading-6 text-zinc-400">
                The browser no longer needs to keep a long request open. This
                page is polling the persistent pipeline state while the Spark
                continues working.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
