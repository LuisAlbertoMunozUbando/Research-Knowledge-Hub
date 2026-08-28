"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";

type UploadResponse = {
  ok?: boolean;
  package_token?: string;
  title?: string;
  slides?: number;
  files?: string[];
  stage?: string;
  pipeline_stdout?: string;
  detail?: unknown;
};

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  const [uploading, setUploading] =
    useState(false);

  const [result, setResult] =
    useState<UploadResponse | null>(null);

  const [error, setError] =
    useState("");

  function selectFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const selected = Array.from(
      event.target.files || []
    );

    setFiles(selected);
    setResult(null);
    setError("");
  }

  async function submit(
    event: FormEvent
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Please enter a package title."
      );
      return;
    }

    if (files.length === 0) {
      setError(
        "Please select at least one image."
      );
      return;
    }

    setUploading(true);
    setError("");
    setResult(null);

    const form = new FormData();

    form.append(
      "title",
      title.trim()
    );

    form.append(
      "note",
      note.trim()
    );

    for (const file of files) {
      form.append(
        "files",
        file
      );
    }

    try {
      const response = await fetch(
        "/api/upload",
        {
          method: "POST",
          body: form,
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data.detail === "string"
            ? data.detail
            : JSON.stringify(data.detail)
        );
      }

      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : String(err)
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl px-6 py-12">

        <a
          href="/"
          className="text-sm text-zinc-500 hover:text-white"
        >
          ← Research Knowledge Hub
        </a>

        <header className="mt-8 mb-10">
          <p className="text-sm uppercase tracking-[0.25em] text-zinc-500">
            Multimodal Capture
          </p>

          <h1 className="mt-2 text-4xl font-semibold">
            Upload Knowledge
          </h1>

          <p className="mt-4 max-w-2xl text-zinc-400">
            Create a research package from one or
            more images. The DGX Spark will extract,
            verify and structure the visible
            knowledge.
          </p>
        </header>

        <form
          onSubmit={submit}
          className="rounded-2xl border border-zinc-800 bg-zinc-900 p-7"
        >
          <label className="block">
            <span className="text-sm text-zinc-400">
              Package title
            </span>

            <input
              value={title}
              onChange={(e) =>
                setTitle(e.target.value)
              }
              placeholder="e.g. Own the Stack"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 outline-none focus:border-zinc-500"
            />
          </label>

          <label className="mt-6 block">
            <span className="text-sm text-zinc-400">
              Research note
            </span>

            <textarea
              value={note}
              onChange={(e) =>
                setNote(e.target.value)
              }
              placeholder="Why is this relevant?"
              className="mt-2 min-h-24 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 outline-none focus:border-zinc-500"
            />
          </label>

          <label className="mt-6 block">
            <span className="text-sm text-zinc-400">
              Images / slides
            </span>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={selectFiles}
              className="mt-2 block w-full rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-6"
            />
          </label>

          {files.length > 0 && (
            <div className="mt-5 rounded-xl bg-zinc-950 p-4">
              <p className="text-sm font-medium">
                {files.length} image
                {files.length !== 1
                  ? "s"
                  : ""}{" "}
                selected
              </p>

              <div className="mt-3 space-y-1 text-sm text-zinc-500">
                {files.map(
                  (file, index) => (
                    <p key={file.name}>
                      {index + 1}.{" "}
                      {file.name}
                    </p>
                  )
                )}
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
            {uploading
              ? "Processing on DGX Spark..."
              : "Upload Knowledge"}
          </button>
        </form>

        {result?.ok && (
          <section className="mt-8 rounded-2xl border border-emerald-900 bg-emerald-950/20 p-7">
            <p className="text-sm uppercase tracking-wider text-emerald-500">
              Capture complete
            </p>

            <h2 className="mt-2 text-2xl font-medium">
              {result.title}
            </h2>

            <div className="mt-5 space-y-2 text-zinc-300">
              <p>
                Slides: {result.slides}
              </p>

              <p>
                Stage: {result.stage}
              </p>

              <p>
                Package token:{" "}
                {result.package_token}
              </p>
            </div>

            {result.pipeline_stdout && (
              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-zinc-400">
                  Pipeline details
                </summary>

                <pre className="mt-3 overflow-auto whitespace-pre-wrap rounded-xl bg-zinc-950 p-4 text-xs text-zinc-400">
                  {result.pipeline_stdout}
                </pre>
              </details>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
