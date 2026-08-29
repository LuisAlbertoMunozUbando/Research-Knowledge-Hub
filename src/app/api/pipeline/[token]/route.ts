import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.KNOWLEDGE_API_URL || "http://127.0.0.1:8010";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    const response = await fetch(
      `${BACKEND_URL}/pipeline/${encodeURIComponent(token)}`,
      {
        method: "GET",
        cache: "no-store",
      }
    );

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : { detail: await response.text() };

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Pipeline status unavailable",
        detail:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
