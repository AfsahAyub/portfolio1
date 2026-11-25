
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "portfolio_session";
const SESSION_DURATION = 7 * 24 * 60 * 60;

function getSecret() {
  const secret = process.env.AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET is missing or invalid.");
  }

  return secret;
}

function sign(value) {
  return createHmac("sha256", getSecret())
    .update(value)
    .digest("base64url");
}

function safeCompare(a, b) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  return (
    first.length === second.length &&
    timingSafeEqual(first, second)
  );
}

export function verifyCredentials(username, password) {
  const savedUsername = process.env.AUTH_USERNAME;
  const savedPassword = process.env.AUTH_PASSWORD;

  if (!savedUsername || !savedPassword) {
    return false;
  }

  return (
    safeCompare(username, savedUsername) &&
    safeCompare(password, savedPassword)
  );
}

export function createSessionToken(username) {
  const payload = Buffer.from(
    JSON.stringify({
      username,
      expires: Math.floor(Date.now() / 1000) + SESSION_DURATION,
    })
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    const [payload, signature] = token.split(".");

    if (!payload || !signature) return false;

    if (!safeCompare(signature, sign(payload))) {
      return false;
    }

    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    return (
      session.username === process.env.AUTH_USERNAME &&
      Number.isFinite(session.expires) &&
      session.expires > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export { COOKIE_NAME, SESSION_DURATION };
