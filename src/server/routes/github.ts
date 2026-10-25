import { randomBytes } from "node:crypto";
import { Router } from "express";
import { exchangeGitHubCode, getGitHubUser } from "../services/githubApi.js";

const router = Router();

interface PendingState {
  discordUserId: string;
  expiresAt: number;
}

const oauthStates = new Map<string, PendingState>();
const stateLifetimeMs = 10 * 60 * 1000;

router.get("/auth/github", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const callbackUrl = process.env.GITHUB_CALLBACK_URL;
  const discordUserId =
    typeof req.query.discord_user_id === "string"
      ? req.query.discord_user_id
      : "";

  if (!clientId || !callbackUrl) {
    return res.status(500).json({ error: "GitHub OAuth is not configured" });
  }
  if (!discordUserId) {
    return res.status(400).json({ error: "Missing discord_user_id" });
  }

  const now = Date.now();

  // Opportunistic sweep of expired states
  for (const [s, pending] of oauthStates) {
    if (pending.expiresAt <= now) oauthStates.delete(s);
  }

  // Store state
  const state = randomBytes(32).toString("hex");
  oauthStates.set(state, {
    discordUserId,
    expiresAt: now + stateLifetimeMs,
  });

  // Build redirect URL to github auth page
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", callbackUrl);
  url.searchParams.set("scope", "read:user read:org");
  url.searchParams.set("state", state);

  return res.redirect(url.toString());
});

router.get("/auth/github/callback", async (req, res) => {
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const pending = oauthStates.get(state);
  oauthStates.delete(state); // single-use

  if (!pending || pending.expiresAt <= Date.now()) {
    return res.status(400).json({ error: "Invalid or expired OAuth state" });
  }
  if (typeof req.query.error === "string") {
    return res.status(400).json({ error: "GitHub authorization was denied" });
  }

  const code = typeof req.query.code === "string" ? req.query.code : "";
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!code)
    return res.status(400).json({ error: "Missing authorization code" });
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "GitHub OAuth is not configured" });
  }

  try {
    // Code -> token
    const accessToken = await exchangeGitHubCode({
      clientId,
      clientSecret,
      code,
    });

    // Token -> user stats
    const stats = await getGitHubUser(accessToken);

    return res.json({ github: stats, discordUserId: pending.discordUserId });
  } catch (err) {
    console.error("GitHub OAuth callback failed:", err);
    return res.status(502).json({ error: "GitHub OAuth request failed" });
  }
});

export default router;
