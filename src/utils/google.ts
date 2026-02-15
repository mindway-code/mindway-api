import { OAuth2Client } from "google-auth-library";
import { env } from "../core/config/env.js";
import { badRequest, unauthorized } from "../core/errors/httpError.js";

export type GoogleIdentity = {
  googleId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
};


const oauthClient = new OAuth2Client(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET || undefined,
  env.GOOGLE_REDIRECT_URI || undefined
);


export async function verifyGoogleIdToken(idToken: string): Promise<GoogleIdentity> {
  if (!idToken) throw badRequest("idToken is required");

  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw unauthorized("Invalid Google token");

  const googleId = payload.sub;
  const email = (payload.email || "").trim().toLowerCase();
  const emailVerified = Boolean(payload.email_verified);
  const name = (payload.name || "").trim();
  const picture = payload.picture;

  if (!googleId) throw unauthorized("Invalid Google token: missing sub");
  if (!email) throw unauthorized("Invalid Google token: missing email");
  if (!name) throw unauthorized("Invalid Google token: missing name");

  const identity: GoogleIdentity = {
    googleId,
    email,
    emailVerified,
    name,
    ...(picture ? { picture } : {}),
  };

  return identity;
}


export async function exchangeCodeForIdToken(code: string): Promise<string> {
  if (!code) throw badRequest("code is required");

  if (!env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
    throw badRequest("Google code flow is not configured (missing client_secret or redirect_uri)");
  }

  const { tokens } = await oauthClient.getToken(code);
  const idToken = tokens.id_token;

  if (!idToken) {
    throw unauthorized("Google code exchange failed (missing id_token)");
  }

  return idToken;
}
