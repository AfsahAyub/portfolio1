
import { NextResponse } from "next/server";
import {
  verifyCredentials,
  createSessionToken,
  COOKIE_NAME,
  SESSION_DURATION,
} from "../../../../../lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = body.username;
    const password = body.password;

    if (
      typeof username !== "string" ||
      typeof password !== "string" ||
      !verifyCredentials(username, password)
    ) {
      return NextResponse.json(
        { error: "Invalid username or password." },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);

    const response = NextResponse.json({ success: true });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_DURATION,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Unable to log in. Please try again." },
      { status: 500 }
    );
  }
}
