import { REST, Routes } from "discord.js";
import { getCommands } from "./utils.js";
import "dotenv/config";

const jsonCommands = [];
for (const command of await getCommands()) {
  jsonCommands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN ?? "");

// Deploy commands
(async () => {
  try {
    console.log(`Reloading ${jsonCommands.length} application commands...`);

    // Refresh all commands
    const data = await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID ?? ""),
      {
        body: jsonCommands,
      },
    );

    console.log(`Successfully reloaded ${data.length} application commands!`);
  } catch (error) {
    console.error(error);
  }
})();
