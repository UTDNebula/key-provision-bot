import { getCommands, getModalSubmits, getClient } from "@/utils.ts";
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

async function main() {
  const discordToken = process.env.DISCORD_TOKEN;
  if (!discordToken) {
    throw new Error("Undefined DISCORD_TOKEN");
  }

  // Setup initial connection with the database
  await getClient();

  // Init the Discord client from the token
  const discordClient = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
  }) as DiscordClient;

  discordClient.commands = new Collection();
  for (const command of await getCommands()) {
    discordClient.commands.set(command.data.name, command);
  }

  discordClient.modalSubmits = new Collection();
  for (const modal of await getModalSubmits()) {
    discordClient.modalSubmits.set(modal.customId, modal);
  }

  discordClient.cooldowns = new Collection();

  discordClient.once(Events.ClientReady, (readyClient) => {
    // Upon startup, set the bot to be online
    if (discordClient.user) {
      discordClient.user!.setPresence({
        activities: [
          { name: "Provisioning API key...", type: ActivityType.Custom },
        ],
        status: PresenceUpdateStatus.Online,
      });
    } else {
      console.log("Bot wasn't set online upon startup...");
    }

    console.log(`Logged in as ${readyClient.user.tag}`);
  });

  // Executing the slash commands
  discordClient.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const discordClient = interaction.client as DiscordClient;
    const commandName = interaction.commandName;
    const command = discordClient.commands.get(commandName);
    const commandCooldowns = discordClient.cooldowns;

    if (!command) {
      return;
    }

    let timestamps = commandCooldowns.get(command.data.name);

    if (!timestamps) {
      timestamps = new Collection<string, number>();
      commandCooldowns.set(command.data.name, timestamps);
    }

    const now = Date.now();
    const userId = interaction.user.id;

    const expirationTime = timestamps.get(userId);

    if (expirationTime && now < expirationTime) {
      const expiredTimestamp = Math.round(expirationTime / 1000);

      return interaction.reply({
        content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`,
        flags: MessageFlags.Ephemeral,
      });
    }

    const cooldownAmount = (command.cooldown ?? 3) * 1000;
    timestamps.set(userId, now + cooldownAmount);

    try {
      const bot = interaction.client.user;
      // If the bot is offline, user can't command it except for admin waking it up
      if (commandName !== "sleep-or-wake" && bot.presence.status !== "online") {
        const user = interaction.user;
        await interaction.reply({
          content: `Hello <@${user.id}>! I'm currently offline, please comeback later.`,
          flags: MessageFlags.Ephemeral,
        });
        return;
      }
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "Error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "Error while executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });

  // Executing the modal submit interactions
  discordClient.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isModalSubmit()) return;

    const interactionClient = interaction.client as DiscordClient;
    const customId = interaction.customId;
    const modalSubmit = interactionClient.modalSubmits.get(customId);
    if (!modalSubmit) {
      console.error(`Modal ${customId} not found!`);
      return;
    }

    try {
      // Modal only pops up after slash command's execution which will not be executed when bot is offline,
      // no need to check for bot's status.
      await modalSubmit.execute(interaction);
    } catch (error) {
      console.error(error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: "Error while executing this modal submit!",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "Error while executing this modal submit!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  });

  discordClient.login(discordToken);
}

try {
  await main();
} catch (err) {
  console.log(`Error starting up the bot: ${err}`);
  console.log("Program terminating");
  process.exit(1);
}
