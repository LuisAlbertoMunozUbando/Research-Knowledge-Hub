import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.KNOWLEDGE_API_URL || "http://127.0.0.1:8010";

async function readBackendResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return {
    error: "Non-JSON response from knowledge backend",
    detail: text || response.statusText,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await readBackendResponse(response);

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Knowledge backend unavailable",
        detail:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
