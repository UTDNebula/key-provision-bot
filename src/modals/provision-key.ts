import { ModalSubmitInteraction } from "discord.js";
import { GoogleAuth } from "google-auth-library";
import "dotenv/config";
import { KeyProvision, ModalSubmit } from "@/interface.ts";
import { getKeyProvisionCollection } from "@/utils.ts";

/**
 * Backoff for number of seconds, used for polling the key for operations
 */
function backoff(dur: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, dur * 1000));
}

/**
 * Check if this user has a provisioned key and returns the key.
 * Otherwise, returns an empty string.
 */
async function checkExistingKey(userId: string): Promise<string> {
  const collection = await getKeyProvisionCollection();

  const doc = await collection.findOne({ userId: userId });
  if (!doc){
    return ""
  }
  return doc.key
}

type APIConfig = {
  baseUrl: string;
  projectId: string;
  service: string;
  accessToken: string;
};

/**
 * Get config for API, including URL, project's ID, service, token.
 */
async function getAPIConfig(): Promise<APIConfig> {
  const baseUrl = `https://apikeys.googleapis.com/v2`;

  const projectId = process.env.NEBULA_API_PROJECT_ID;
  if (!projectId) {
    throw new Error("Undefined NEBULA_API_PROJECT_ID");
  }
  const service = process.env.NEBULA_API_SERVICE;
  if (!service) {
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
    if (!response.token) {
      throw new Error("Undefined access token");
    }
    accessToken = response.token;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown cause";
    throw new Error(`Error getting access token: ${message}`);
  }

  return {
    baseUrl,
    projectId,
    service,
    accessToken,
  } as APIConfig;
}

/**
 * Provision the new API key for this user.
 *
 * Refer to https://docs.cloud.google.com/api-keys/docs/create-manage-api-keys on
 * how to create Google Cloud API key through REST.
 */
async function generateNewKey(
  userId: string,
  username: string,
  project: string,
  description: string,
): Promise<string> {
  const { baseUrl, projectId, service, accessToken } = await getAPIConfig();

  // Define the display name and restrict the key to only use Nebula API
  const body = {
    displayName: `${username}/${project}`,
    restrictions: {
      api_targets: [
        {
          service: service,
        },
      ],
    },
  };
  let response = await fetch(
    `${baseUrl}/projects/${projectId}/locations/global/keys`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${accessToken}`,
        "x-goog-user-project": projectId,
      },
      body: JSON.stringify(body),
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
        "x-goog-user-project": projectId,
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status} polling key!`);
    }
    keyDetails = await response.json();
  }

  // Save the provision record to the database
  const collection = await getKeyProvisionCollection();
  const doc = {
      userId: userId,
      username: username,
      project: project,
      description: description,
      key: keyDetails.response.keyString,
    } as KeyProvision;

  const insertedDoc = await collection.insertOne(doc);
  if (!insertedDoc.acknowledged) {
    throw new Error("Error inserting provision to DB");
  }

  return keyDetails.response.keyString;
}

/**
 * Responding to user submissions the form
 */
const provisionKeyModalSubmit: ModalSubmit = {
  customId: "requestKeyForm",
  execute: async (interaction: ModalSubmitInteraction) => {
    const user = interaction.user;
    const fields = interaction.fields;

    await interaction.reply(
      `Hello <@${user.id}>! We received your request. We'll DM you later.`,
    );

    let key = await checkExistingKey(user.id);
    if (key !== "") {
      await user.send(
        `You have been provisioned a key. Your key is ||${key}||. If you have any question, please DM Mike.`,
      );
      return;
    }
    key = await generateNewKey(
      user.id,
      user.username,
      fields.getTextInputValue("projName"),
      fields.getTextInputValue("projDescription"),
    );
    await user.send(
      `Your new key is ||${key}||. Happy coding! If you have any question, please DM Mike.`,
    );
  },
};

export default provisionKeyModalSubmit;
