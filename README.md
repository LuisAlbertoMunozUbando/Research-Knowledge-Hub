# Research Knowledge Hub

A collaborative research-memory interface for capturing, searching and asking questions over multimodal evidence processed on local GPU infrastructure.

## Current scope

The first stable ingestion scope intentionally supports two resource families:

- Images, screenshots and slides (`JPG`, `JPEG`, `PNG`, `WEBP`)
- Born-digital research PDFs (`PDF`)

Both converge into the same searchable knowledge pipeline.

## Architecture

```text
Researcher
   |
   v
Next.js / Vercel
   |
   v
FastAPI ingestion API
   |
   +----------------------+----------------------+
   |                                             |
   v                                             v
Image resources                               PDF resources
   |                                             |
Qwen2.5-VL                               PDF Inspector
   |                                             |
verified visual evidence                  compact PDF evidence
   |                                             |
   |                                      pdf-researcher
   |                                             |
   +----------------------+----------------------+
                          |
                          v
                 normalized evidence
                          |
                          v
                knowledge-synthesizer
                          |
                          v
                    canonical JSON
                          |
             +------------+------------+
             |            |            |
             v            v            v
        Google Drive     FTS5      embeddings
                          |
                          v
                      searchable
```

The reference backend runs on an NVIDIA DGX Spark and uses local inference, OpenClaw/NemoClaw/OpenShell components, SQLite FTS5, semantic embeddings and a persistent Google Drive evidence archive.

## Frontend

The application provides three primary workflows:

1. Upload images or PDFs as research packages.
2. Search the accumulated knowledge using hybrid lexical + semantic retrieval.
3. Ask grounded questions over the collected evidence.

The upload page accepts `image/*` and PDF files and routes them to the backend without requiring the researcher to choose an AI pipeline manually.

## Deployment

The frontend is designed for Vercel. The backend is reached through an HTTPS endpoint exposed from the DGX Spark through Cloudflare Tunnel.

Production frontend environment variable:

```env
KNOWLEDGE_API_URL=https://knowledge-api.albertomunoz.ai
```

The intended public frontend hostname is:

```text
knowledge.albertomunoz.ai
```

## Backend

Backend source and architecture documentation:

https://github.com/LuisAlbertoMunozUbando/Research-Knowledge-Backend

## Design principles

- Preserve original evidence.
- Keep AI interpretation separate from deterministic validation.
- Make ingestion resumable after failures.
- Keep local inference services private.
- Archive provenance together with generated metadata.
- Prefer a small set of stable modalities before expanding ingestion scope.

## Status

Image ingestion is operational end-to-end. PDF ingestion has also been validated end-to-end through inspection, specialized PDF research extraction, knowledge synthesis, canonicalization, Drive archival, FTS5, embeddings, database synchronization and final searchable state.

## License

MIT.
