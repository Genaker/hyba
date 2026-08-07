import 'server-only';
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { provider } from './provider';
import type { User } from './types';

const sessionCookieName = 'session';

// Signs the cookie so a client can't just set session=someone@example.com and take
// over that account — see SESSION_SECRET in .env.example.
function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET env var is required (see .env.example)');
  return secret;
}
const sessionSecret = requireSessionSecret();

function sign(email: string): string {
  return createHmac('sha256', sessionSecret).update(email).digest('base64url');
}

function encodeCookie(email: string): string {
  return `${email}.${sign(email)}`;
}

// Returns the email only if the signature matches what we'd have produced for it —
// timingSafeEqual so a mismatched byte can't be inferred from response timing.
function decodeCookie(cookieValue: string): string | null {
  const separatorIndex = cookieValue.lastIndexOf('.');
  if (separatorIndex === -1) return null;
  const email = cookieValue.slice(0, separatorIndex);
  const signature = Buffer.from(cookieValue.slice(separatorIndex + 1));
  const expectedSignature = Buffer.from(sign(email));
  if (signature.length !== expectedSignature.length) return null;
  return timingSafeEqual(signature, expectedSignature) ? email : null;
}

export async function getSessionUser(): Promise<User | null> {
  const cookieValue = (await cookies()).get(sessionCookieName)?.value;
  if (!cookieValue) return null;
  const email = decodeCookie(cookieValue);
  if (!email) return null;
  return provider.getUserByEmail(email);
}

export async function createSession(email: string): Promise<void> {
  (await cookies()).set(sessionCookieName, encodeCookie(email), {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(sessionCookieName);
}
