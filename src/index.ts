import { getCommands } from "@/utils.ts";
import type { DiscordClient } from "@/interface.ts";
import "dotenv/config";
import {
  ActivityType,
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  MessageFlags,
  PresenceUpdateStatus,
} from "discord.js";

const discordToken = process.env.DISCORD_TOKEN;
if (!discordToken) {
  console.error("Undefined DISCORD_TOKEN. Program terminating.");
  process.exit(1);
}

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
  // Upon startup, set the bot to be online
  if (client.user) {
    client.user!.setPresence({
      activities: [{ name: "Provide API key", type: ActivityType.Custom }],
      status: PresenceUpdateStatus.Online,
    });
  } else {
    console.log("Bot wasn't set online when starting up...");
  }
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const interactionClient = interaction.client as DiscordClient;
  const commandName = interaction.commandName;
  const command = interactionClient.commands.get(commandName);
  if (!command) {
    console.error(`${commandName} not found!`);
    return;
  }
  try {
    const bot = interaction.client.user;
    if (commandName !== "sleep_or_wake" && bot.presence.status !== "online") {
      // If the bot is offline, user can't command it to do anything
      // other than admin command to wake the bot up.

      const user = interaction.user;
      await interaction.reply(
        `Hello <@${user.id}>! I'm currently offline, please comeback later.`,
      );
      return;
    } 

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
client.login(discordToken);
