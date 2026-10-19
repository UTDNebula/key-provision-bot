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
    .setCustomId("projName")
    .setStyle(TextInputStyle.Short)
    .setPlaceholder("Mars, Milky Way, WHL0137-LS, etc.")
    .setRequired(true);

  const nameLabel = new LabelBuilder()
    .setLabel("What is your project's name?")
    .setDescription("Anything! It's used for naming your API key.")
    .setTextInputComponent(nameInput);

  const descriptionInput = new TextInputBuilder()
    .setCustomId("projDescription")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false);

  const checkboxGroupLabel = new LabelBuilder()
    .setLabel("What are you using this API for?")
    .setCheckboxGroupComponent((checkboxes) =>
      checkboxes.setCustomId("apiPurpose").addOptions([
        {
          label: "Personal Project",
          value: "personal",
          description: "Building something for myself or portfolio",
          default: false,
        },
        {
          label: "Hackathon Project",
          value: "hackathon",
          description: "Building for a competition or hackathon event",
          default: false,
        },
        {
          label: "Class Assignment",
          value: "classwork",
          description: "School/university project or coursework",
          default: false,
        },
        {
          label: "Learning/Educational",
          value: "learning",
          description: "Just learning how APIs work",
          default: false,
        },
        {
          label: "Testing the API",
          value: "testing",
          description: "For API developers/members testing functionality",
          default: false,
        },
      ]),
    );

  const descriptionLabel = new LabelBuilder()
    .setLabel("Give us a short description")
    .setDescription(
      "Tell us more! We would love to hear more details on how you are using our API. (Optional)",
    )
    .setTextInputComponent(descriptionInput);

  const requestKeyForm = new ModalBuilder()
    .setCustomId("requestKeyForm")
    .setTitle("Request API Key Form");

  requestKeyForm.addLabelComponents(
    nameLabel,
    checkboxGroupLabel,
    descriptionLabel,
  );

  return requestKeyForm;
}

/**
 * Responding to user's command requesting the key
 */
const requestKeyCommand: Command = {
  cooldown: 120,
  data: new SlashCommandBuilder()
    .setName("request-key")
    .setDescription("Request the Nebula API key"),
  async execute(interaction) {
    await interaction.showModal(buildRequestKeyForm());
  },
};

export default requestKeyCommand;
