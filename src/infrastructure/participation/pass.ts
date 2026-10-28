import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { isUuid } from "@/domain/privacy/issuance";

const PASS = "pqvst_participation";
const RECEIPT = "pqvst_submitted";
const TWELVE_HOURS = 60 * 60 * 12;
const TEN_MINUTES = 60 * 10;

function pepper(): string | null {
  const value = process.env.PARTICIPATION_TOKEN_PEPPER?.trim() ?? "";
  return value.length >= 32 ? value : null;
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export async function readPassCredentialId(): Promise<string | null> {
  const secret = pepper();
  if (!secret) return null;
  const value = (await cookies()).get(PASS)?.value;
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!parsed || typeof parsed !== "object") return null;
    const credentialId = "credentialId" in parsed ? parsed.credentialId : null;
    const exp = "exp" in parsed ? parsed.exp : null;
    if (typeof credentialId !== "string" || !isUuid(credentialId)) return null;
    if (typeof exp !== "number" || exp < Date.now()) return null;
    return credentialId;
  } catch {
    return null;
  }
}

export async function writeParticipationPass(credentialId: string) {
  const secret = pepper();
  if (!secret) {
    throw new Error("O segredo de hash da credencial é insuficiente.");
  }
  const payload = Buffer.from(JSON.stringify({ credentialId, exp: Date.now() + TWELVE_HOURS * 1000 })).toString(
    "base64url",
  );
  const jar = await cookies();
  jar.set(PASS, `${payload}.${sign(payload, secret)}`, cookieOptions(TWELVE_HOURS));
}

export async function clearParticipationPass() {
  const jar = await cookies();
  jar.delete(PASS);
}

export async function writeSubmissionReceipt() {
  const jar = await cookies();
  jar.set(RECEIPT, "1", cookieOptions(TEN_MINUTES));
}

export async function hasSubmissionReceipt(): Promise<boolean> {
  return (await cookies()).get(RECEIPT)?.value === "1";
}
