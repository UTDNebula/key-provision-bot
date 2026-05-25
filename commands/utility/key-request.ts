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

type APIConfig = {
  baseUrl: string;
  projectID: string;
  service: string;
  accessToken: string;
};

/**
 * Get config for API calling
 */
async function getAPIConfig(): Promise<APIConfig | null> {
  const baseUrl = `https://apikeys.googleapis.com/v2`;

  const projectID = process.env.NEBULA_API_PROJECT_ID;
  if (typeof projectID !== "string") {
    console.error("Undefined project ID");
    return null;
  }
  const service = process.env.NEBULA_API_SERVICE;
  if (typeof service !== "string") {
    console.error("Undefined project service");
    return null;
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
      console.error("Undefined bearer token");
      return null;
    }
    accessToken = response.token;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown";
    console.error(`Error getting access token: ${message}`);
    return null;
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
 */
async function checkExistingKey(userId: string): Promise<string | null> {
  const APIConfig = await getAPIConfig();
  if (!APIConfig) {
    return null;
  }
  const { baseUrl, projectID, accessToken } = APIConfig;
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
    console.error(`Error ${response.status} checking key!`);
    return null;
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
async function provisionKey(userId: string): Promise<string | null> {
  const APIConfig = await getAPIConfig();
  if (!APIConfig) {
    return null;
  }
  const { baseUrl, projectID, service, accessToken } = APIConfig;

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
    console.error(`Error ${response.status} creating key!`);
    return null;
  }
  const data = await response.json();
  const operation: string = data.name;

  // Poll the operations until we get the key
  let keyDetails: any = {};
  while (!("done" in keyDetails && keyDetails.done == true)) {
    await backoff();

    response = await fetch(`${baseUrl}/${operation}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-goog-user-project": projectID,
      },
    });
    if (!response.ok) {
      console.error(`Error ${response.status} polling key!`);
      return null;
    }
    keyDetails = await response.json();
  }
  return keyDetails.response.keyString;
}

function newKeyMessage(key: string) {
  return `Your new key is ||${key}||. Happy coding! If you have any question, please DM Mike.`;
}

function existingKeyMessage(key: string) {
  return `You have been provisioned a key. Your key is ||${key}||. If you have any question, please DM Mike.`;
}

const errorMessage = "Error! Please re-request your key in Nebula Labs server";

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
    let key = await checkExistingKey(interaction.user.id);
    if (key !== null) {
      if (key !== "") {
        interaction.user.send(existingKeyMessage(key));
        return;
      }
    } else {
      interaction.user.send(errorMessage);
      return;
    }
    key = await provisionKey(interaction.user.id);
    const message = key !== null ? newKeyMessage(key) : errorMessage;
    interaction.user.send(message);
  },
};

export default keyRequestCommand;
