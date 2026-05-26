import { SlashCommandBuilder } from "discord.js";
import { GoogleAuth } from "google-auth-library";
import "dotenv/config";
import type { Command } from "@/interface.ts";

/**
 * Backoff for number of seconds, used for polling the key for operations
 */
function backoff(dur: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, dur * 1000));
}

type APIConfig = {
  baseUrl: string;
  projectID: string;
  service: string;
  accessToken: string;
};

/**
 * Get config for API, including URL, project's ID, service, token.
 */
async function getAPIConfig(): Promise<APIConfig> {
  const baseUrl = `https://apikeys.googleapis.com/v2`;

  const projectID = process.env.NEBULA_API_PROJECT_ID;
  if (typeof projectID !== "string") {
    throw new Error("Undefined NEBULA_API_PROJECT_ID");
  }
  const service = process.env.NEBULA_API_SERVICE;
  if (typeof service !== "string") {
    throw new Error("Undefined NEBULA_API_SERVICE");
  }

  let accessToken: string;
  const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform",
  });
  try {
    // The token is cached, so we can call function multiple times and still get same token
    const client = await auth.getClient();
    const response = await client.getAccessToken();
    if (typeof response.token !== "string") {
      throw new Error("Undefined access token");
    }
    accessToken = response.token;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown cause";
    throw new Error(`Error getting access token: ${message}`);
  }

  return {
    baseUrl,
    projectID,
    service,
    accessToken,
  } as APIConfig;
}

/**
 * Check if this user has a provisioned key and returns the key.
 * Otherwise, returns an empty string.
 * If there's other HTTP errors while checking, returns null.
 *
 * Refer to https://docs.cloud.google.com/api-keys/docs/get-info-api-keys
 */
async function checkExistingKey(userId: string): Promise<string> {
  const { baseUrl, projectID, accessToken } = await getAPIConfig();

  const keyName = `projects/${projectID}/locations/global/keys/proj-${userId}`;
  const response = await fetch(`${baseUrl}/${keyName}/keyString`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-goog-user-project": projectID,
    },
  });
  if (response.status === 404) {
    return "";
  }
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status} checking key!`);
  }
  const data = await response.json();

  return data.keyString;
}

/**
 * Provision the new API key for this user.
 *
 * Refer to https://docs.cloud.google.com/api-keys/docs/create-manage-api-keys on
 * how to create Google Cloud API key through REST.
 */
async function generateNewKey(userId: string): Promise<string> {
  const { baseUrl, projectID, service, accessToken } = await getAPIConfig();

  // Define the name and restrict the key to only use Nebula API
  const nameAndRestrictions = {
    displayName: `proj-${userId}`,
    restrictions: {
      api_targets: [
        {
          service: service,
        },
      ],
    },
  };

  // userId is unique identifier of Discord user, so should be good
  const keyId = `proj-${userId}`;
  let response = await fetch(
    `${baseUrl}/projects/${projectID}/locations/global/keys?keyId=${keyId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${accessToken}`,
        "x-goog-user-project": projectID,
      },
      body: JSON.stringify(nameAndRestrictions),
    },
  );
  if (!response.ok) {
    throw new Error(`HTTP error ${response.status} creating key!`);
  }
  const data = await response.json();
  const operation: string = data.name;

  // Poll the operations until we get the key
  let keyDetails: any = {};
  while (!("done" in keyDetails && keyDetails.done === true)) {
    await backoff(10);

    response = await fetch(`${baseUrl}/${operation}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-goog-user-project": projectID,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} polling key!`);
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
    const user = interaction.user;

    await interaction.reply(`Hello <@${user.id}>! Please check your DM later.`);
    const existingKey = await checkExistingKey(interaction.user.id);
    if (existingKey !== "") {
      await user.send(
        `You have been provisioned a key. Your key is ||${existingKey}||. If you have any question, please DM Mike.`,
      );
      return;
    }
    const newKey = await generateNewKey(user.id);
    await user.send(
      `Your new key is ||${newKey}||. Happy coding! If you have any question, please DM Mike.`,
    );
  },
};

export default keyRequestCommand;
