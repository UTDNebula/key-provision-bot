import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";

export interface RoleConnectionResponse {
  platform_name: string | null;
  platform_username: string | null;
  metadata: Record<string, number | string | boolean>;
}

export async function updateRoleConnection(
  accessToken: string,
  applicationId: string,
  metadata: Record<string, number | string | boolean>,
  platformName: string = "GitHub",
): Promise<RoleConnectionResponse> {
  // Create a REST client with the Bearer auth prefix for user OAuth tokens
  const rest = new REST({ version: "10", authPrefix: "Bearer" }).setToken(
    accessToken,
  );

  const result = await rest.put(
    Routes.userApplicationRoleConnection(applicationId),
    {
      body: { platform_name: platformName, metadata },
    },
  );

  return result as RoleConnectionResponse;
}
