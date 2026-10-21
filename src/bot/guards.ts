import { ensureGithubLinkedRole } from "./utils.ts";
import { Execute } from "./interface.ts";

export function withGithubLinkedRole(execute: Execute): Execute {
  return async (interaction) => {
    const ok = await ensureGithubLinkedRole(interaction);
    if (!ok) return;
    return execute(interaction);
  };
}
