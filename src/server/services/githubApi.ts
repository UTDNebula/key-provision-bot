import { Octokit } from "@octokit/rest";
import { exchangeWebFlowCode } from "@octokit/oauth-methods";

// TODO: I should cache this like mongoClient
// Metadata for discord
export interface GitHubIdentity {
  id: number;
  login: string;
}

// Build a reusable authenticated Octokit client.
export function createGitHubClient(accessToken: string): Octokit {
  return new Octokit({
    auth: accessToken,
    userAgent: "discord-linked-roles/1.0.0",
    request: { signal: AbortSignal.timeout(10_000) },
  });
}

/**
 * Exchange the OAuth `code` GitHub sent to the callback for a user access token.
 * Uses Octokit's web-flow helper instead of a hand-rolled fetch.
 */
export async function exchangeGitHubCode(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUrl?: string;
}): Promise<string> {
  const { clientId, clientSecret, code, redirectUrl } = params;

  const { authentication } = await exchangeWebFlowCode({
    clientType: "oauth-app",
    clientId,
    clientSecret,
    code,
    ...(redirectUrl ? { redirectUrl } : {}),
  });

  return authentication.token;
}

// Fetch the authenticated user's data
export async function getGitHubUser(
  accessToken: string,
): Promise<GitHubIdentity> {
  const octokit = createGitHubClient(accessToken);
  const { data } = await octokit.rest.users.getAuthenticated();

  return { id: data.id, login: data.login };
}

// Check if a authenticated user is part of an organization
export async function checkOrganizationMembership(
  accessToken: string,
  org: string,
) {
  const octokit = createGitHubClient(accessToken);

  try {
    const { data } = await octokit.rest.orgs.getMembershipForAuthenticatedUser({
      org,
    });

    return data.state === "active";
  } catch (error: any) {
    if (error.status === 404) {
      return false; // not a member
    }
    throw error;
  }
}
