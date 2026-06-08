import {
  LabelBuilder,
  ModalBuilder,
  SlashCommandBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import "dotenv/config";
import type { Command } from "@/interface.ts";

/**
 * Build the form asking for project's usage of the API
 * @returns {ModalBuilder}
 */
function buildRequestKeyForm(): ModalBuilder {
  const nameInput = new TextInputBuilder()
    .setCustomId("projectName")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Mars, Milky Way, WHL0137-LS, etc.")
    .setRequired(true);

  const nameLabel = new LabelBuilder()
    .setLabel("What is your project's name?")
    .setDescription("Anything! It's used for naming your API key.")
    .setTextInputComponent(nameInput);

  const descriptionInput = new TextInputBuilder()
    .setCustomId("projectDescription")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true);

  const descriptionLabel = new LabelBuilder()
    .setLabel("Give us a short description")
    .setDescription(
      "How will you use Nebula API in your project? (We appreciate as much information as possible)",
    )
    .setTextInputComponent(descriptionInput);

  const requestKeyForm = new ModalBuilder()
    .setCustomId("requestKeyForm")
    .setTitle("Request API Key Form");

  requestKeyForm.addLabelComponents(nameLabel, descriptionLabel);
  return requestKeyForm;
}

/**
 * Responding to user's command requesting the key
 */
const requestKeyCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("request-key")
    .setDescription("Request the Nebula API key"),
  async execute(interaction) {
    await interaction.showModal(buildRequestKeyForm());
  },
};

export default requestKeyCommand;
