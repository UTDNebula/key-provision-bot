import { dev } from '@/utils/templates';
import {
  BranchIdentifier,
  BranchIdentifierFields,
} from '@/identifiers/BranchIdentifier';
import { UserIdentifier } from '@/identifiers/UserIdentifier';
import BranchProviderClient from '@/providers/BranchProviderClient';

const slotRegex = /(?<=^[^\s]*#)\d+/;

export type BrancherDBClientOptions = {
  /**
   * Number of milliseconds before cached branches are considered stale and will be refetched.
   *
   * @default 15000
   */
  staleTime?: number;
  /**
   * Method for choosing the next unused user branch slot
   *
   * - `"smallest"` - Choose the smallest unused number
   * - `"iterate"` - Choose the number that suceeds the largest used number
   *
   * @default 'smallest'
   */
  nextUnusedSlotMethod?: 'smallest' | 'iterate';
};

export default class BrancherDBClient<
  BranchType extends BranchIdentifierFields,
> {
  #providerClient: BranchProviderClient<BranchType>;
  #branchesCache: BranchType[];
  #cacheLastFetch: Date;
  #cacheInvalid: boolean;
  #options: BrancherDBClientOptions;

  constructor(
    providerClient: BranchProviderClient<BranchType>,
    options?: BrancherDBClientOptions,
  ) {
    this.#providerClient = providerClient;
    this.#branchesCache = [];
    this.#cacheLastFetch = new Date(0);
    this.#cacheInvalid = false;
    this.#options = options ?? {};
  }

  /** Internal methods that may possibly be useful. */
  get $util() {
    return {
      /**
       * Fetches the branches from the database provider, then caches the result
       *
       * @returns The list of fetched branches
       */
      refetchCache: async (): Promise<BranchType[]> => {
        const branches = await this.#providerClient.getAll();
        this.#branchesCache = branches;
        this.#cacheLastFetch = new Date();
        return branches;
      },

      /**
       * Marks the cache of branches from the database provider as invalid. Does NOT re-fetch the branches; if you wish
       * to immediately update the cache, use {@linkcode fetchBranches} instead.
       */
      invalidateCache: () => {
        this.#cacheInvalid = true;
      },

      /** Returns the slot number for a branch given its name */
      getBranchSlot: (branchName: string): number => {
        const results = branchName.match(slotRegex);
        // If no result, use slot of 0 which corresponds to legacy branch
        const slotNumber = results ? Number(results[0]) : 0;
        return slotNumber;
      },

      /**
       * Gets the branch slots that a user has used
       *
       * @param userIdentifier Target user
       * @returns An array of numbers, each corresponding to a branch slot that has been used
       */
      getUsedSlotsForUser: async (
        userIdentifier: UserIdentifier,
      ): Promise<number[]> => {
        const userBranches = await this.user.getBranches(userIdentifier);

        const usedSlots: number[] = userBranches.reduce((acc, current) => {
          const slotNumber = this.$util.getBranchSlot(current.name);
          acc.push(slotNumber);
          return acc;
        }, [] as number[]);

        return usedSlots;
      },

      /**
       * Gets the next available branch slot for a user
       *
       * @param userIdentifier Target user
       * @param nextUnusedSlotMethod Method for choosing the next unused user branch slot (defaults to the value from
       *   the client instance)
       * @returns A number corresponding to an unused branch slot
       */
      getNextUnusedSlotForUser: async (
        userIdentifier: UserIdentifier,
        nextUnusedSlotMethod?: BrancherDBClientOptions['nextUnusedSlotMethod'],
      ): Promise<number> => {
        const usedSlots = await this.$util.getUsedSlotsForUser(userIdentifier);
        const method =
          nextUnusedSlotMethod ??
          this.#options.nextUnusedSlotMethod ??
          'smallest';

        switch (method) {
          case 'smallest': {
            // Does not include 0 because that corresponds to legacy branch name
            let slot = 1;
            while (usedSlots.includes(slot)) slot++;
            return slot;
          }
          case 'iterate': {
            return Math.max(...usedSlots) + 1;
          }
          default:
            throw new Error(
              `Invalid method for choosing next unused slot: ${method}`,
            );
        }
      },
    };
  }

  /** Methods to interact with database branches */
  get branch() {
    return {
      /**
       * Fetches the branches from either the cache or the branch provider, depending on whether the cache is stale or
       * invalid
       *
       * @returns The list of cached or fetched branches
       */
      getAll: async (): Promise<BranchType[]> => {
        if (this.#cacheInvalid) {
          return await this.$util.refetchCache();
        }

        const nowMs = Date.now();
        const lastFetchMs = this.#cacheLastFetch.getTime();
        const staleTimeMs = this.#options.staleTime ?? 15000;

        if (nowMs - lastFetchMs > staleTimeMs) {
          return await this.$util.refetchCache();
        } else {
          return this.#branchesCache;
        }
      },

      /** Direct access to methods of branch provider client */
      $raw: this.#providerClient,
    };
  }

  /** Methods to interact with database branches with respect to users */
  get user() {
    return {
      /**
       * Gets the list of branches belonging to a user
       *
       * @param userIdentifier Target user
       * @returns An array of branches belonging to that user
       */
      getBranches: async (
        userIdentifier: UserIdentifier,
      ): Promise<BranchType[]> => {
        const allBranches = await this.branch.getAll();

        const githubUsername = await userIdentifier.getGitHubUsername();

        const branchName = dev(githubUsername.toLowerCase());
        const escapedBranchName = branchName.replace(
          /[.*+?^${}()|[\]\\]/g,
          '\\$&',
        );
        const allPersonBranchesRegex = new RegExp(
          `^${escapedBranchName}(?=[# ]+|$)`,
        );

        const userBranches = allBranches.filter((branch) =>
          allPersonBranchesRegex.test(branch.name.toLowerCase()),
        );

        return userBranches;
      },

      /**
       * Gets the branch in the specified slot belonging to a user
       *
       * @param userIdentifier Target user
       * @param slot Target slot
       * @returns A branch belonging to that user
       */
      getBranch: async (
        userIdentifier: UserIdentifier,
        slot: number,
      ): Promise<BranchType> => {
        const userBranches = await this.user.getBranches(userIdentifier);

        const branch = userBranches.find((branch) => {
          const slotNumber = this.$util.getBranchSlot(branch.name);
          return slot === slotNumber;
        });

        if (!branch) {
          throw new Error(
            `Could not find branch at slot ${slot} for user identified by ${userIdentifier.toString()}`,
          );
        }

        return branch;
      },

      /**
       * Creates a new database branch for a user
       *
       * @param userIdentifier Target user
       * @param note Short description explaining purpose of the branch
       * @param nextUnusedSlotMethod Method for choosing the next unused user branch slot (defaults to the value from
       *   this class's instance)
       * @returns The new database branch
       */
      createBranch: async (
        userIdentifier: UserIdentifier,
        note?: string,
        nextUnusedSlotMethod?: BrancherDBClientOptions['nextUnusedSlotMethod'],
      ): Promise<BranchType> => {
        const githubUsername = await userIdentifier.getGitHubUsername();
        const nextUnusedSlot = await this.$util.getNextUnusedSlotForUser(
          userIdentifier,
          nextUnusedSlotMethod,
        );

        const branchName = dev(
          githubUsername.toLowerCase(),
          nextUnusedSlot,
          note,
        );

        const newBranch = await this.branch.$raw.create(branchName);

        // Reset connection string to prevent branch from having same role password as parent branch
        this.branch.$raw.resetConnectionURL(
          new BranchIdentifier({ id: newBranch.id }),
        );

        this.$util.invalidateCache();

        return newBranch;
      },

      /**
       * Creates a new database branch for a user and returns its connection string
       *
       * @param userIdentifier Target user
       * @param note Short description explaining purpose of the branch
       * @param nextUnusedSlotMethod Method for choosing the next unused user branch slot (defaults to the value from
       *   this class's instance)
       * @returns The database connection URL string
       */
      createBranchAndConnect: async (
        userIdentifier: UserIdentifier,
        note?: string,
        nextUnusedSlotMethod?: BrancherDBClientOptions['nextUnusedSlotMethod'],
      ): Promise<string> => {
        const newBranch = await this.user.createBranch(
          userIdentifier,
          note,
          nextUnusedSlotMethod,
        );
        const newBranchIdentifier = new BranchIdentifier({ id: newBranch.id });
        const uri =
          await this.branch.$raw.getConnectionURL(newBranchIdentifier);
        return uri;
      },

      /**
       * Gets the database connection URL for a user's branch at a specified slot
       *
       * @param userIdentifier Target user
       * @param slot Integer corresponding to the target slot
       * @returns {string} The database connection URL string
       */
      getConnectionURL: async (
        userIdentifier: UserIdentifier,
        slot: number,
      ): Promise<string> => {
        this.user.getBranches(userIdentifier);

        const targetBranch = await this.user.getBranch(userIdentifier, slot);
        if (!targetBranch) {
          throw new Error(`Could not find branch at slot ${slot}`);
        }

        const uri = await this.branch.$raw.getConnectionURL(
          new BranchIdentifier({ id: targetBranch.id }),
        );

        return uri;
      },

      /**
       * Deletes a user's database branch at a specified slot
       *
       * @param userIdentifier Target user
       * @param slot Integer corresponding to the target slot
       */
      deleteBranch: async (userIdentifier: UserIdentifier, slot: number) => {
        this.user.getBranches(userIdentifier);

        const targetBranch = await this.user.getBranch(userIdentifier, slot);
        if (!targetBranch) {
          throw new Error(`Could not find branch at slot ${slot}`);
        }

        return await this.branch.$raw.delete(
          new BranchIdentifier({ id: targetBranch.id }),
        );
      },
    };
  }
}
