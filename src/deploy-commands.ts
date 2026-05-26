import { REST, Routes } from "discord.js";
import { getCommands } from "@/utils.ts";
import "dotenv/config";

const discordToken = process.env.DISCORD_TOKEN;
if (!discordToken) {
  console.error("Undefined DISCORD_TOKEN. Program terminating.");
  process.exit(1);
}

const clientID = process.env.CLIENT_ID;
if (!clientID) {
  console.error("Undefined CLIENT_ID. Program terminating.");
  process.exit(1);
}

const serializedCommands: any[] = [];
for (const command of await getCommands()) {
  serializedCommands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(discordToken);

async function deployCommands() {
  try {
    console.log(`Reloading ${serializedCommands.length} commands...`);

    // Reload all commands
    const data: any = await rest.put(Routes.applicationCommands(clientID!), {
      body: serializedCommands,
    });

    console.log(`Successfully reloaded ${data.length} commands!`);
  } catch (error) {
    console.error(error);
  }
}

// Deploy the commands
await deployCommands();
