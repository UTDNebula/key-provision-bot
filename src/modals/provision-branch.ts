import { PROJECTS } from "@/commands/key-management/branch/request-branch.ts";
import { Branch, BranchProvision, ModalSubmit } from "@/interface.ts";
import { getBranchProvisionCollection } from "@/utils.ts";
import { MessageFlags, ModalSubmitInteraction } from "discord.js";

// TODO: Add more logging to this script

const MAX_BRANCHES_PER_USER = 5;

// TODO: DB Generation script will execute here
// - Values will need to be filtered based on project branchName
// - Check for duplicates
function provisionBranch() {}

/**
 * Check if this user has a provisioned branch with this name and returns it.
 * Otherwise, returns null.
 */
async function checkExistingBranch(
  userId: string,
  branchName: string, // was `url` — the map is keyed by name, not url
): Promise<Branch | null> {
  const collection = await getBranchProvisionCollection();

  const doc = await collection.findOne({ userId: userId });
  if (!doc) {
    return null;
  }
  return doc.branches[branchName] ?? null;
}

const requestBranchModalSubmit: ModalSubmit = {
  customId: "requestBranchModal",
  execute: async (interaction: ModalSubmitInteraction) => {
    const user = interaction.user;
    const fields = interaction.fields;
    const branchName = fields.getTextInputValue("branchName");
    const [project] = fields.getStringSelectValues("project");

    // Guard against stale modals (project removed mid-session)
    if (!PROJECTS.some((p) => p.value === project)) {
      await interaction.reply({
        content: "Unknown project selected. Please try again.",
        ephemeral: true,
      });
      return;
    }

    // Branch name becomes a Mongo field path — keep it path-safe.
    if (!/^[a-zA-Z0-9_-]+$/.test(branchName)) {
      await interaction.reply({
        content: "Branch name may only contain letters, numbers, `-` and `_`.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // TODO: Replace this with a provisionBranch method that utilizes Clubs DB script
    const existing = await checkExistingBranch(user.id, branchName);
    const { url, isNewlyCreated } = existing
      ? { url: existing.url, isNewlyCreated: false }
      : { url: "examplekey", isNewlyCreated: true };

    if (!isNewlyCreated) {
      await interaction.reply({
        content: `You have already been provisioned a branch with this name.\nThe URL is ||${url}||.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const branch: Branch = {
      name: branchName,
      url,
      project: project as Branch["project"],
      createdAt: new Date(),
    };

    try {
      // Upsert: creates the user doc on first branch, appends on later ones.
      const collection = await getBranchProvisionCollection();
      const result = await collection.updateOne(
        { userId: user.id },
        {
          $set: { [`branches.${branchName}`]: branch },
          $setOnInsert: {
            userId: user.id,
            githubUserId: "",
            githubUsername: "",
          },
        },
        { upsert: true },
      );

      if (!result.acknowledged) {
        throw new Error("Error upserting provision to DB");
      }
    } catch (error: any) {
      console.error(`[ERROR] Failed provisioning for user ${user.username}`);
      await interaction.reply({
        content:
          "Something went wrong provisioning your branch. Please try again later.",
        flags: MessageFlags.Ephemeral,
      });
      return; // don't tell the user it worked if the DB write failed
    }

    await interaction.reply({
      content: `Your new provisioned url is ||${url}||.\nHappy coding! If you have any question, please DM one of our leadership.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

export default requestBranchModalSubmit;
