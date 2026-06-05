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

  const serializedCommands: any[] = [];
  for (const command of await getCommands()) {
    serializedCommands.push(command.data.toJSON());
  }

  // Instance for REST API calling
  const rest = new REST().setToken(discordToken);

  try {
    console.log(`Deploying ${serializedCommands.length} commands...`);

    const data: any = await rest.put(Routes.applicationCommands(clientId!), {
      body: serializedCommands,
    });

    console.log(`Successfully deployed ${data.length} commands!`);
  } catch (err) {
    throw err;
  }
}

try {
  await deployCommands();
} catch (err) {
  console.log(`Error deploying commands: ${err}`);
  console.log("Program terminating");
  process.exit(1);
}
