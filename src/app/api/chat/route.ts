import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { getSession } from "@/lib/auth-helper";
import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, createRateLimitHeaders } from "@/lib/rate-limit";

// Input validation schema
const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(4000, "Message content too long"),
      })
    )
    .max(20, "Too many messages"),
});

export async function POST(req: Request) {
  try {
    // 1. Authentication check
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in to use AI chat" },
        { status: 401 }
      );
    }

    // 2. Rate limiting
    const rateLimitResult = await checkRateLimit(
      "aiChat",
      session.user.id
    );

    if (!rateLimitResult.success) {
      const resetDate = new Date(rateLimitResult.reset);
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          message: "You have exceeded the AI chat rate limit. Please try again later.",
          reset: resetDate.toISOString(),
          limit: rateLimitResult.limit,
        },
        {
          status: 429,
          headers: createRateLimitHeaders(rateLimitResult),
        }
      );
    }

    // 3. Input validation
    const body = await req.json();
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { messages } = validationResult.data;

    // 4. Stream AI response
    const result = streamText({
      model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
      messages: messages,
    });

    const response = (
      result as unknown as { toUIMessageStreamResponse: () => Response }
    ).toUIMessageStreamResponse();

    // Add rate limit headers to response
    const rateLimitHeaders = createRateLimitHeaders(rateLimitResult);
    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "An error occurred while processing your request",
      },
      { status: 500 }
    );
  }
}
