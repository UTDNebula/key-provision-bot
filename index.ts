import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
} from "discord.js";
import "dotenv/config";
import { getCommands } from "./utils.ts";
import type { DiscordClient } from "./interface.ts";

/*
TODO:
- Cooldowns to avoid spamming,
- Refactor the file structure,
- Message-based commands
 */

// Init the Discord client from the token
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
}) as DiscordClient;

client.commands = new Collection();
for (const command of await getCommands()) {
  client.commands.set(command.data.name, command);
}

// Configure the client
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const interactionClient = interaction.client as DiscordClient;
  const command = interactionClient.commands.get(interaction.commandName);
  if (!command) {
    console.error(`${interaction.commandName} not found!`);
    return;
  }
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral,
      });
    }
  }
});

// Login discord
client.login(process.env.DISCORD_TOKEN ?? "");
