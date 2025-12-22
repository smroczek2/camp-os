import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-helper";
import { db } from "@/lib/db";
import { sessions } from "@/lib/schema";
import { z } from "zod";

// Input validation schema
const sessionDataSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  price: z.number().min(0).max(100000),
  capacity: z.number().int().min(1).max(1000),
  minAge: z.number().int().min(0).max(100).optional(),
  maxAge: z.number().int().min(0).max(100).optional(),
  minGrade: z.number().int().min(-1).max(12).optional(),
  maxGrade: z.number().int().min(-1).max(12).optional(),
});

const createSessionsRequestSchema = z.object({
  plan: z.object({
    sessions: z
      .array(sessionDataSchema)
      .min(1, "At least one session is required")
      .max(50, "Too many sessions"),
    recommendedForms: z
      .array(
        z.object({
          name: z.string(),
          reason: z.string(),
        })
      )
      .optional(),
  }),
});

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
    const validationResult = createSessionsRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { plan } = validationResult.data;

    // 3. Validate session dates
    for (const sessionData of plan.sessions) {
      const startDate = new Date(sessionData.startDate);
      const endDate = new Date(sessionData.endDate);

      if (endDate < startDate) {
        return NextResponse.json(
          {
            error: "Invalid dates",
            message: "End date must be after start date",
          },
          { status: 400 }
        );
      }

      // Validate age ranges if provided
      if (
        sessionData.minAge !== undefined &&
        sessionData.maxAge !== undefined &&
        sessionData.maxAge < sessionData.minAge
      ) {
        return NextResponse.json(
          {
            error: "Invalid age range",
            message: "Maximum age must be greater than or equal to minimum age",
          },
          { status: 400 }
        );
      }

      // Validate grade ranges if provided
      if (
        sessionData.minGrade !== undefined &&
        sessionData.maxGrade !== undefined &&
        sessionData.maxGrade < sessionData.minGrade
      ) {
        return NextResponse.json(
          {
            error: "Invalid grade range",
            message:
              "Maximum grade must be greater than or equal to minimum grade",
          },
          { status: 400 }
        );
      }
    }

    // 4. Create sessions in database
    const sessionIds: string[] = [];
    for (const sessionData of plan.sessions) {
      const [created] = await db
        .insert(sessions)
        .values({
          name: sessionData.name,
          description: sessionData.description ?? null,
          startDate: new Date(sessionData.startDate),
          endDate: new Date(sessionData.endDate),
          price: sessionData.price.toString(),
          capacity: sessionData.capacity,
          status: "draft",
          minAge: sessionData.minAge ?? null,
          maxAge: sessionData.maxAge ?? null,
          minGrade: sessionData.minGrade ?? null,
          maxGrade: sessionData.maxGrade ?? null,
        })
        .returning();
      sessionIds.push(created.id);
    }

    return NextResponse.json({
      success: true,
      sessionIds,
      message: `Successfully created ${sessionIds.length} session(s)`,
    });
  } catch (error) {
    console.error("Create sessions error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        message: "Failed to create sessions",
      },
      { status: 500 }
    );
  }
}
