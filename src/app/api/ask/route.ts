import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.KNOWLEDGE_API_URL || "http://127.0.0.1:8010";

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
