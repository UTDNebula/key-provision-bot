import { SlashCommandBuilder } from "discord.js";
import { GoogleAuth } from "google-auth-library";
import "dotenv/config";
import type { Command } from "../../interface.ts";

/**
 * Backoff for 10 seconds, used for polling the key for operations
 */
function backoff(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10000));
}

/**
 * Get access token to call keys API
 */
async function getBearerToken(): Promise<string | null> {
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  try {
    const client = await auth.getClient();
    const response = await client.getAccessToken();
    return response.token ?? null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";
    console.error(`Error getting access token: ${message}`);
    return null;
  }
}

/**
 * Provision the new API key for this user.
 *
 * Refer to https://docs.cloud.google.com/api-keys/docs/create-manage-api-keys on how to
 * create Google Cloud API key through REST.
 */
async function provisionKey(name: string): Promise<string | null> {
  const API_KEY_URL = `https://apikeys.googleapis.com/v2`;

  const PROJECT_ID = process.env.NEBULA_API_PROJECT_ID;
  if (typeof PROJECT_ID !== "string") {
    console.error("Undefined project ID");
    return null;
  }
  const API_SERVICE = process.env.NEBULA_API_SERVICE;
  if (typeof API_SERVICE !== "string") {
    console.error("Undefined project service");
    return null;
  }

  // Get the bearer token
  const bearerToken = await getBearerToken();
  if (typeof bearerToken !== "string") {
    return null;
  }

  // Define the name and restrict the key to only use Nebula API
  const nameAndRestrictions = {
    displayName: `${name}'s key`,
    restrictions: {
      api_targets: [
        {
          service: API_SERVICE,
        },
      ],
    },
  };

  let response = await fetch(
    `${API_KEY_URL}/projects/${PROJECT_ID}/locations/global/keys`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${bearerToken}`,
        "x-goog-user-project": PROJECT_ID,
      },
      body: JSON.stringify(nameAndRestrictions),
    },
  );
  if (!response.ok) {
    console.error(`HTTP error creating key! status: ${response.status}`);
    return null;
  }
  const data = await response.json();
  const operation: string = data.name;

  // Poll the operations until we get the key
  let keyDetails: any = {};
  while (!("done" in keyDetails && keyDetails.done == true)) {
    await backoff();

    response = await fetch(`${API_KEY_URL}/${operation}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "x-goog-user-project": PROJECT_ID,
      },
    });
    if (!response.ok) {
      console.error(`HTTP error polling key! status: ${response.status}`);
      return null;
    }
    keyDetails = await response.json();
  }
  return keyDetails.response.keyString;
}

/**
 * Command responding to key's request
 */
const keyRequestCommand: Command = {
  data: new SlashCommandBuilder()
    .setName("key_request")
    .setDescription("Provision the API key to the user upon request"),
  async execute(interaction) {
    await interaction.reply(
      `Hello <@${interaction.user.id}>! Please check your DM later.`,
    );
    // Provision the key
    const key = await provisionKey(interaction.user.username);
    const message =
      key !== null
        ? `Your key is ||${key}||. Happy coding! If you have any question, DM Mike directly!`
        : `Error! Please re-request your key in Nebula Labs server`;
    interaction.user.send(message);
  },
};

export default keyRequestCommand;
