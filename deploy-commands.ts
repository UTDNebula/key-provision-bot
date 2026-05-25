import {
  REST,
  Routes,
} from "discord.js";
import { getCommands } from "./utils.ts";
import "dotenv/config";

const serializedCmds = [];
for (const command of await getCommands()) {
  serializedCmds.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN ?? "");

// Deploy commands
(async () => {
  try {
    console.log(`Reloading ${serializedCmds.length} application commands...`);

    // Refresh all commands
    const data: any = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID ?? ""),
      {
        body: serializedCmds,
      },
    );

    console.log(`Successfully reloaded ${data.length} application commands!`);
  } catch (error) {
    console.error(error);
  }
})();
