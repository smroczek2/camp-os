import { NextResponse } from "next/server";
import { setDevUser } from "@/lib/dev-auth";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Verify user exists
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Set dev user cookie
    await setDevUser(userId);

    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
      },
    });
  } catch (error) {
    console.error("Dev login error:", error);
    return NextResponse.json(
      {
        error: "Login failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
