import {
  BranchMetadata,
  ModalSubmit,
  NotAuthorizedError,
  PROJECTS,
} from "@/bot/interface.ts";
import { getAuthorizedUsersCollection } from "@/shared/db.ts";
import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { user } from "../db-brancher/identifiers/UserIdentifier.ts";
import { getAuthorizedNeonUser, getBrancherClient } from "../utils.ts";
// TODO: Add more logging to this script

const MAX_BRANCHES_PER_USER = 5; // TODO: Also should be handled branch side?

/**
 * Check if this user has a provisioned branch with this name and returns it.
 * Otherwise, returns null.
 */
async function checkExistingBranch(
  userId: string,
): Promise<BranchMetadata | null> {
  // TODO: Checking logic
  return null;
}

const requestBranchModalSubmit: ModalSubmit = {
  customId: "requestBranchModal",
  execute: async (interaction: ModalSubmitInteraction) => {
    const discordUser = interaction.user;
    const fields = interaction.fields;
    const branchName = fields.getTextInputValue("branchName");
    const [project] = fields.getStringSelectValues("project");

    // Guard against stale modals (project removed mid-session)
    if (!PROJECTS.some((p) => p.value === project)) {
      await interaction.reply({
        content: "Unknown project selected. Please try again.",
        ephemeral: true,
      });
      return;
    }

    // Keep it name in a friendly file format for storage in neon
    if (!/^[a-zA-Z0-9_-]+$/.test(branchName)) {
      await interaction.reply({
        content: "Branch name may only contain letters, numbers, `-` and `_`.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      const brancher = getBrancherClient();

      const neonUser = await getAuthorizedNeonUser(discordUser);
      const newBranch = await brancher.user.createBranch(neonUser, branchName);

      const existing = await checkExistingBranch(discordUser.id);
      if (!existing) {
        // TODO: Do something, lowkey this should be handled brancher side but whatever
      }

      await interaction.reply({
        content: `Your new provisioned branch is ||${newBranch}||.\nIf have experience any issues with the bot, please DM one of our leadership.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error: any) {
      if (error instanceof NotAuthorizedError) {
        console.warn(
          `[WARN] User ${discordUser.username} is not authorized to provision a branch`,
        );
        await interaction.reply({
          content:
            "You don't have access to provision a branch. Please contact leadership if you think this is a mistake.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      console.error(
        `[ERROR] Failed provisioning for user ${discordUser.username}: ${error})`,
      );
      await interaction.reply({
        content:
          "Something went wrong provisioning your branch. Please try again later.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default requestBranchModalSubmit;
