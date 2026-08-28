import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.KNOWLEDGE_API_URL || "http://127.0.0.1:8010";

export async function POST(request: NextRequest) {
  try {
    const incoming = await request.formData();

    const response = await fetch(`${BACKEND_URL}/upload`, {
      method: "POST",
      body: incoming,
      cache: "no-store",
    });

    const data = await response.json();

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
