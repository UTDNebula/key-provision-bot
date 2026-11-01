import { getAuthorizedUsersCollection } from "@/shared/db.ts";
import { ChatInputCommandInteraction, MessageFlags } from "discord.js";
import { Execute } from "./interface.ts";

export function withGithubVerified(execute: Execute): Execute {
  return async (interaction) => {
    console.log("[AUTH] Wrapper entered");

    const ok = await ensureGithubVerified(interaction);

    console.log("[AUTH] Result:", ok);

    if (ok !== true) {
      console.log("[AUTH] BLOCKED");
      return;
    }

    console.log("[AUTH] PASSED - Executing command");

    await execute(interaction);
  };
}

export async function ensureGithubVerified(
  interaction: ChatInputCommandInteraction,
): Promise<boolean> {
  const authorized = await getAuthorizedUsersCollection();

  const record = await authorized.findOne({
    discordUserId: interaction.user.id,
    revokedAt: null,
  });

  if (record) return true;

  await interaction.reply({
    content:
      `You need to link your GitHub account first.\n` +
      `Click here to authorize: ${buildLinkUrl(interaction.user.id)}`,
    flags: MessageFlags.Ephemeral,
  });

  return false;
}

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
