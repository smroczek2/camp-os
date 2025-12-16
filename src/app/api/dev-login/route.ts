import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { user } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { DEV_SESSION_COOKIE } from "@/lib/dev-auth";

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Not available in production" },
      { status: 403 }
    );
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const email = typeof body.email === "string" ? body.email : undefined;
    const userId = typeof body.userId === "string" ? body.userId : undefined;

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Email or userId required" },
        { status: 400 }
      );
    }

    const userRecord = await db.query.user.findFirst({
      where: userId ? eq(user.id, userId) : eq(user.email, email!),
    });

    if (!userRecord) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const response = NextResponse.json({
      success: true,
      user: {
        id: userRecord.id,
        name: userRecord.name,
        email: userRecord.email,
        role: userRecord.role,
      },
    });

    response.cookies.set(DEV_SESSION_COOKIE, userRecord.id, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });

    return response;
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
