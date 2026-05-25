import { REST, Routes } from "discord.js";
import { getCommands } from "./utils.ts";
import "dotenv/config";

const serialized: any[] = [];
for (const command of await getCommands()) {
  serialized.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN ?? "");

async function deployCommands() {
  try {
    console.log(`Reloading ${serialized.length} commands...`);

    // Reload all commands
    const data: any = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID ?? ""),
      {
        body: serialized,
      },
    );

    console.log(`Successfully reloaded ${data.length} commands!`);
  } catch (error) {
    console.error(error);
  }
}

// Deploy the commands
deployCommands();
