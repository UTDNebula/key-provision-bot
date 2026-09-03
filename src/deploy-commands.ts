import { REST, Routes } from "discord.js";
import { getCommands } from "@/utils.ts";
import "dotenv/config";

/**
 * Deploy (or reload) the slash commands
 */
async function deployCommands() {
  const discordToken = process.env.DISCORD_TOKEN;
  if (!discordToken) {
    throw new Error("Undefined DISCORD_TOKEN");
  }
  const clientId = process.env.CLIENT_ID;
  if (!clientId) {
    throw new Error("Undefined CLIENT_ID");
  }
  const guildId = process.env.GUILD_ID;
  if (!guildId) {
    throw new Error("Undefined GUILD_ID");
  }

  const serializedCommands: any[] = [];
  for (const command of await getCommands()) {
    serializedCommands.push(command.data.toJSON());
  }

  // Instance for REST API calling
  const rest = new REST().setToken(discordToken);

  try {
    console.log(`[DEPLOY] Deploying ${serializedCommands.length} commands...`);
    const data: any = await rest.put(
      Routes.applicationGuildCommands(clientId!, guildId!),
      {
        body: serializedCommands,
      },
    );
    console.log(`[DEPLOY] Successfully deployed ${data.length} commands!`);
  } catch (err) {
    throw err;
  }
}

try {
  await deployCommands();
} catch (err) {
  console.error(`[ERROR] Error deploying commands: ${err}`);
  process.exit(1);
}
