export type authorizedUser = {
  githubId: string;
  discordUserId: string;
  revokedAt: Date | null;
  verifiedAt: Date;
};
