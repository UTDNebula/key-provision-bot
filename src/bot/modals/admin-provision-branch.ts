import { ModalSubmit, NotAuthorizedError } from "@/bot/interface.ts";
import { MessageFlags, ModalSubmitInteraction } from "discord.js";
import { getAuthorizedNeonUser } from "../utils.ts";

const adminProvisionKeyModalSubmit: ModalSubmit = {
  customId: "adminProvisionKeyForm",
  execute: async (interaction: ModalSubmitInteraction) => {
    try {
      const target = interaction.fields
        .getSelectedUsers("targetUser", true)
        .first();

      if (!target) {
        await interaction.reply({
          content: "No user was selected.",
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      const neonUser = await getAuthorizedNeonUser(target);
      // TODO: provision the key for neonUser

      await interaction.reply({
        content: `Provisioned a key for <@${target.id}>.`,
        flags: MessageFlags.Ephemeral,
      });
    } catch (error: any) {
      if (error instanceof NotAuthorizedError) {
        await interaction.reply({
          content: `The selected user isn't authorized to hold a key.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      console.error(`[ERROR] Admin provision failed: ${error}`);
      await interaction.reply({
        content:
          "Something went wrong provisioning the key. Please try again later.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

export default adminProvisionKeyModalSubmit;
