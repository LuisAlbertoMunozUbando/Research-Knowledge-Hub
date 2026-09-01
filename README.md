# 🧠 Research Knowledge Hub

<p align="center">
  <strong>A collaborative research-memory interface for images and PDF papers.</strong>
</p>

<p align="center">
  <a href="https://knowledge.albertomunoz.ai"><img src="https://img.shields.io/badge/Live-knowledge.albertomunoz.ai-111111?style=for-the-badge&logo=vercel" alt="Live"></a>
  <img src="https://img.shields.io/badge/v1-FROZEN-2563EB?style=for-the-badge" alt="v1 Frozen">
  <img src="https://img.shields.io/badge/Inputs-Images%20%2B%20PDF-8B5CF6?style=for-the-badge" alt="Images and PDF">
  <img src="https://img.shields.io/badge/Next.js-Frontend-000000?style=for-the-badge&logo=nextdotjs" alt="Next.js">
  <img src="https://img.shields.io/badge/License-MIT-F59E0B?style=for-the-badge" alt="MIT License">
</p>

---

## ✨ Overview

**Research Knowledge Hub** is the web interface for a local-first research memory system.

Researchers can upload evidence, search accumulated knowledge and ask grounded questions over the collection while AI processing runs on local GPU infrastructure.

The first stable milestone is intentionally frozen around two input families:

- 🖼️ **Images** — screenshots, slides, diagrams and visual research evidence.
- 📄 **PDF papers** — born-digital research documents.

> **The goal is not to collect more files. The goal is to build searchable research memory.**

---

## 🚦 v1 status

| Workflow | Status |
|---|---|
| Upload images | ✅ |
| Upload PDF papers | ✅ |
| Automatic resource routing | ✅ |
| Hybrid search | ✅ |
| Grounded Ask / RAG | ✅ |
| Vercel deployment | ✅ |
| Custom production domain | ✅ |
| DGX Spark backend | ✅ |
| Additional modalities | ⏸️ Deferred |

**v1 is frozen at Images + PDF.**

---

## 🌐 Live application

### Frontend

**[https://knowledge.albertomunoz.ai](https://knowledge.albertomunoz.ai)**

### Backend API

```text
https://knowledge-api.albertomunoz.ai
```

---

## 🏗️ Architecture

```text
                      Researcher
                          │
                          ▼
              ┌────────────────────────┐
              │  Research Knowledge Hub│
              │      Next.js / Vercel  │
              └───────────┬────────────┘
                          │
                          ▼
              knowledge-api.albertomunoz.ai
                          │
                          ▼
                  Cloudflare Tunnel
                          │
                          ▼
                 FastAPI on DGX Spark
                          │
               ┌──────────┴──────────┐
               │                     │
               ▼                     ▼
          🖼️ Images               📄 PDFs
               │                     │
          Qwen2.5-VL           PDF Inspector
               │                     │
        verified evidence       pdf-researcher
               │                     │
               └──────────┬──────────┘
                          ▼
                 knowledge-synthesizer
                          │
                          ▼
                     Canonical JSON
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
       Google Drive     SQLite FTS5   Embeddings
                          │
                          ▼
                  Search + Grounded RAG
```

---

## 🧭 Main workflows

### 📥 Upload Knowledge

Create a research package from one or more supported files.

```text
Image / PDF
    ↓
Automatic routing
    ↓
Local AI processing
    ↓
Structured package
    ↓
Searchable memory
```

The researcher does not need to choose which AI pipeline to run.

### 🔎 Search Knowledge

Uses hybrid lexical + semantic retrieval to find accumulated evidence by topic, concept, organization, project or related meaning.

### 💬 Ask the Library

Runs grounded questions against retrieved packages instead of answering from an unconnected model context.

---

## ⚙️ Frontend stack

- ⚛️ React
- ▲ Next.js
- 🟦 TypeScript
- 🎨 Tailwind CSS
- ☁️ Vercel

Production environment variable:

```env
KNOWLEDGE_API_URL=https://knowledge-api.albertomunoz.ai
NEXT_PUBLIC_KNOWLEDGE_API_URL=https://knowledge-api.albertomunoz.ai
```

Uploads are sent directly from the browser to the FastAPI endpoint so PDF and
image bodies do not pass through a Vercel Function. The production ingestion
limit is **10 MiB per file** and is enforced in both the browser and backend.

---

## 🧠 Backend

The AI and retrieval infrastructure lives in the companion repository:

**[LuisAlbertoMunozUbando/Research-Knowledge-Backend](https://github.com/LuisAlbertoMunozUbando/Research-Knowledge-Backend)**

The backend includes:

- FastAPI ingestion and routing
- NVIDIA DGX Spark execution
- Qwen2.5-VL image understanding
- PDF inspection and native text extraction
- specialized `pdf-researcher`
- `knowledge-synthesizer`
- persistent / resumable processing
- deterministic fallback for PDF agent failures
- Google Drive evidence archive
- SQLite FTS5
- semantic embeddings
- hybrid retrieval
- grounded RAG

---

## 🔁 Resilience

The backend maintains persistent ingestion state. A failure does not require re-uploading the original resource.

```text
saved
  ↓
verified evidence
  ↓
package creation
  ↓
synthesis
  ↓
canonicalization
  ↓
archive
  ↓
indexing
  ↓
embeddings
  ↓
searchable
```

This is particularly important for local generative workflows where model output can occasionally be malformed or incomplete.

---

## 🔐 Privacy by architecture

The public UI is hosted on Vercel, while sensitive AI infrastructure can remain on local GPU hardware.

```text
Public
  ├── Next.js frontend
  └── FastAPI HTTPS endpoint

Private
  ├── Ollama
  ├── model endpoints
  ├── OpenClaw
  ├── OpenShell
  ├── local SQLite
  └── agent execution
```

The architecture is designed so internal inference services do not need to be exposed directly to the Internet.

---

## 🧪 Design principles

- 🧾 Preserve original evidence.
- 🔗 Keep provenance connected to interpretation.
- 🧠 Use agents for semantic work.
- ⚙️ Use deterministic software for critical contracts and state.
- 🔁 Make ingestion resumable.
- 🛡️ Do not let malformed model output destroy a package.
- 🎯 Prefer a small stable scope before expanding modalities.

---

## 🧊 v1 scope freeze

The stable milestone intentionally supports only:

```text
🖼️ Images ✅
📄 PDF    ✅
```

Possible future directions such as audio, YouTube, URLs, GitHub repositories, WhatsApp and email are deliberately postponed.

The current goal is maturity, not modality count.

---

## ❤️ Why this project?

Research teams continuously encounter useful fragments:

```text
screenshots
papers
slides
figures
conference material
methods
results
people
companies
projects
ideas
```

Without an explicit memory layer, those discoveries remain distributed across people, phones, folders, browser tabs and messaging apps.

Research Knowledge Hub turns them into a shared searchable collection.

> **Capture knowledge. Preserve evidence. Learn together.**

---

## 📄 License

MIT License.

---

<p align="center">
  🔬 Evidence → 🧠 Knowledge → 🔎 Retrieval → 🤝 Shared research memory
</p>
