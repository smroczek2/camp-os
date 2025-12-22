import { NextRequest, NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { sessions, formDefinitions } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

// Input validation schema
const sessionSetupRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(4000, "Message content too long"),
      })
    )
    .max(30, "Too many messages"),
});

const systemPrompt = `You are a helpful assistant for setting up sessions.

IMPORTANT RULES:
1. NEVER assume details the user didn't provide
2. ALWAYS ask clarifying questions before creating anything
3. ALWAYS show a preview and get confirmation before creating sessions
4. Be conversational and friendly, not robotic
5. Explain your suggestions when relevant ("STEM programs typically need a tech agreement form")

WORKFLOW:
1. Understand what the user wants to create
2. Ask clarifying questions for any missing required info:
   - Session name (required) - e.g., "Summer Week 1", "Art Camp June"
   - Session description
   - Age range (optional but recommended)
   - Number of sessions
   - Dates (start and end)
   - Price (can suggest but must confirm)
   - Capacity (can suggest but must confirm)
3. Once you have enough info, propose a session plan
4. Wait for user confirmation or edits
5. Only create sessions after explicit confirmation

You can suggest reasonable defaults but must confirm:
- Middle school = ages 11-14, grades 6-8
- Elementary = ages 6-10, grades 1-5
- Sessions typically run Mon-Fri for day camps
- Form recommendations based on session type

When user says things like "create", "make", or "set up" sessions,
first gather info, then propose, then wait for "looks good" or similar.

When you have enough information to propose sessions, include a JSON block with:
\`\`\`json
{
  "sessionPlan": {
    "sessions": [
      {
        "name": "...",
        "description": "...",
        "startDate": "YYYY-MM-DD",
        "endDate": "YYYY-MM-DD",
        "price": number,
        "capacity": number,
        "minAge": number,
        "maxAge": number,
        "minGrade": number,
        "maxGrade": number
      }
    ],
    "recommendedForms": [
      { "name": "...", "reason": "..." }
    ]
  }
}
\`\`\`

Existing sessions will be provided in the context for reference.`;

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getSession();
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin access required" },
        { status: 401 }
      );
    }

    // 2. Input validation
    const body = await request.json();
    const validationResult = sessionSetupRequestSchema.safeParse(body);

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

    // 3. Get existing sessions and forms for context
    const [existingSessions, existingForms] = await Promise.all([
      db.query.sessions.findMany({
        orderBy: [desc(sessions.startDate)],
        limit: 20,
      }),
      db.query.formDefinitions.findMany({
        where: eq(formDefinitions.status, "active"),
        orderBy: [desc(formDefinitions.createdAt)],
        limit: 20,
      }),
    ]);

    const contextMessage = `
Context:
- Existing sessions: ${existingSessions.length > 0 ? existingSessions.map(s => `${s.name} (${s.startDate.toISOString().split('T')[0]} to ${s.endDate.toISOString().split('T')[0]})`).join(", ") : "None yet"}
- Available forms: ${existingForms.length > 0 ? existingForms.map(f => `${f.name} (${f.formType})`).join(", ") : "None yet"}
- Today's date: ${new Date().toISOString().split("T")[0]}
`;

    // 4. Generate AI response
    const result = await generateText({
      model: openai(process.env.OPENAI_MODEL || "gpt-4o-mini"),
      messages: [
        { role: "system", content: systemPrompt + contextMessage },
        ...messages,
      ],
      temperature: 0.7,
    });

    const responseContent = result.text;

    // 5. Try to extract session plan from response
    let sessionPlan = null;
    const jsonMatch = responseContent.match(/```json\s*\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        sessionPlan = parsed.sessionPlan;
      } catch {
        // No valid JSON found, that's okay
      }
    }

    // Clean the message (remove JSON block if present)
    const cleanMessage = responseContent
      .replace(/```json[\s\S]*?```/g, "")
      .trim();

    return NextResponse.json({
      message: cleanMessage || responseContent,
      sessionPlan,
    });
  } catch (error) {
    console.error("AI session setup error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process your request",
      },
      { status: 500 }
    );
  }
}
