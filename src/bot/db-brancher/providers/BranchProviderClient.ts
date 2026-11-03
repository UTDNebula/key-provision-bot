import {
  BranchIdentifier,
  BranchIdentifierFields,
} from '@/identifiers/BranchIdentifier';

export default abstract class BranchProviderClient<
  BranchType extends BranchIdentifierFields,
> {
  /**
   * Fetches all the branches
   *
   * @returns The list of cached or fetched branches
   */
  abstract getAll(): Promise<BranchType[]>;

  /**
   * Creates a database branch
   *
   * @param branchIdentifier Target branch
   */
  abstract create(branchName: string): Promise<BranchType>;

  /**
   * Deletes a database branch
   *
   * @param branchIdentifier Target branch
   */
  abstract delete(branchIdentifier: BranchIdentifier): Promise<void>;

  /**
   * Resets/rotates the connection string for a database branch
   *
   * @param branchIdentifier Target branch
   */
  abstract resetConnectionURL(
    branchIdentifier: BranchIdentifier,
  ): Promise<void>;

  /**
   * Gets the database connection URL for a specific branch
   *
   * @param branchIdentifier Target branch
   * @param pooled Whether to use connection pooling (defaults to `true`). [More information on connection
   *   pooling](https://neon.com/docs/connect/connection-pooling)
   * @returns {string} The database connection URL string
   */
  abstract getConnectionURL(
    branchIdentifier: BranchIdentifier,
    pooled?: boolean,
  ): Promise<string>;
}
