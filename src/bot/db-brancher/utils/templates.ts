/** Matches a valid GitHub username */
export const GitHubUsernameRegex =
  /^[a-zA-Z\d](?:[a-zA-Z\d]|-(?=[a-zA-Z\d])){0,38}$/;

/**
 * Constructs the branch name belonging to a particular GitHub username
 *
 * @param githubUsername The person this branch belongs to
 * @param slot A positive integer that selects a branch per person. If 0, omits the slot suffix (i.e. uses legacy branch
 *   name system)
 * @param note A string to append to the end of the branch name
 * @returns
 */
export function dev(
  githubUsername: string,
  slot?: number,
  note?: string,
): string {
  if (slot && (!Number.isInteger(slot) || slot < 0)) {
    throw new Error('Invalid slot for branch name');
  }

  // Wildcard branch, or legacy branch name
  if (!slot || slot === 0) return `dev/${githubUsername}`;

  return `dev/${githubUsername}#${slot}${note ? ` ${note}` : ''}`;
}

/** Constructs a branch name based off a GitHub branch. */
export function preview(gitBranch: string): string {
  return `preview/${gitBranch}`;
}
