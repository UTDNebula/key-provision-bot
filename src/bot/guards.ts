import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Execute } from "./interface.ts";
import { getAuthorizedUsersCollection } from "@/shared/db.ts";

// TODO: Add more comments
// A guard describes:
//    how to check, what to say if it fails
//    This pattern is used across the codebase to enforce verification
type Guard = {
  check: (interaction: ChatInputCommandInteraction) => Promise<boolean>;
  denyMessage: (interaction: ChatInputCommandInteraction) => string;
};

export function withGuard(guard: Guard, execute: Execute): Execute {
  return async (interaction) => {
    const ok = await guard.check(interaction);
    if (!ok) {
      await interaction.reply({
        content: guard.denyMessage(interaction),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    await execute(interaction);
  };
}

export const isGithubVerified = async (
  interaction: ChatInputCommandInteraction,
) => {
  const authorized = await getAuthorizedUsersCollection();
  return !!(await authorized.findOne({
    discordUserId: interaction.user.id,
    revokedAt: null,
  }));
};

export const withGithubVerified = (execute: Execute) =>
  withGuard(
    {
      check: isGithubVerified,
      denyMessage: (i) =>
        `You need to link your GitHub account first.\n` +
        `Click here to authorize: ${buildLinkUrl(i.user.id)}`,
    },
    execute,
  );

export const isClubsLeadership = async (
  interaction: ChatInputCommandInteraction,
) => {
  // by guild + role, etc.
  return; /* boolean */
};

export const withSelectedLeadership = (execute: Execute) =>
  withGuard(
    {
      check: isSelectedLeadership,
      denyMessage: (i) =>
        "Only specific members are allowed to use this command",
    },
    execute,
  );

export const isSelectedLeadership = async (
  interaction: ChatInputCommandInteraction,
) => {
  const adminIds = process.env.BOT_ADMINS?.split(",") || [];
  return adminIds.includes(interaction.user.id);
};

function buildLinkUrl(discordUserId: string): string {
  const base = process.env.OAUTH_START_URL;
  if (!base) {
    console.error(
      "OAUTH_START_URL is not set, falling back to http://localhost:3000/auth/github.",
    );
  }
  const url = new URL(base ?? "http://localhost:3000/auth/github");
  url.searchParams.set("discord_user_id", discordUserId);
  return url.toString();
}

// export const withClubsLeadershipVerified = (execute: Execute) =>
//  withGuard(
//   {
//      check: isClubsLeadership,
//      denyMessage: () => `You need to be a club leader to run this.`,
//    },
//    execute,
//  );
