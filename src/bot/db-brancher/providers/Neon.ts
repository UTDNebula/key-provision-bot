import env from '../../__tests__/env';
import { createNeonClient, NeonClient } from '@neon/sdk';
import { Branch, NeonError } from '@neon/sdk';
import BranchProviderClient from './BranchProviderClient';
import { BranchIdentifier } from '@/identifiers/BranchIdentifier';

export type NeonProviderClientConfig = {
  apiKey: string;
  projectId: string;
  apiURL?: string;
  neonClient?: NeonClient;
};

export default class NeonProviderClient extends BranchProviderClient<Branch> {
  projectId: string;
  neonClient: NeonClient;
  config: NeonProviderClientConfig;

  constructor(config: NeonProviderClientConfig) {
    super();

    this.projectId = config.projectId;
    this.neonClient =
      config.neonClient ?? createNeonClient({ apiKey: config.apiKey });

    this.config = config;
    this.config.apiURL ??= 'https://console.neon.tech/api/v2';
  }

  async getAll(): Promise<Branch[]> {
    // // It appears there's a bug with the Neon Management SDK. The following should work but it crashes, hence why we're manually fetching from the Neon API
    // const { all } = neon.branches.list({ projectId: this.projectId });
    // const { data } = await all();

    const params = new URLSearchParams({
      project_id: this.projectId,
    });

    const res = await fetch(
      `${this.config.apiURL}/projects/${this.projectId}/branches?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
      },
    );

    if (!res.ok) {
      const error = await res.json();
      throw new NeonError(error.message, 'api');
    }

    const data = await res.json();
    const branches = data.branches as Branch[];
    return branches;
  }

  async create(branchName: string): Promise<Branch> {
    const { data: newBranch, error: createError } =
      await this.neonClient.branches.create({
        projectId: this.projectId,
        name: branchName,
      });
    if (createError) throw createError;
    return newBranch;
  }

  async delete(branchIdentifier: BranchIdentifier): Promise<void> {
    const branchId = await branchIdentifier.getId(this.getAll);
    const { error: deleteError } = await this.neonClient.branches.delete({
      projectId: this.projectId,
      branchId: branchId,
    });
    if (deleteError) throw deleteError;
  }

  async resetConnectionURL(branchIdentifier: BranchIdentifier) {
    const branchId = await branchIdentifier.getId(this.getAll);
    const { error: resetPasswordError } =
      await this.neonClient.postgres.roles.resetPassword({
        projectId: this.projectId,
        branchId: branchId,
        roleName: 'neondb_owner',
      });
    if (resetPasswordError) {
      console.error(
        `There was an error resetting to a unique password for the branch with ID ${branchId}:`,
        resetPasswordError,
      );
      console.warn(
        'This connection string will have the same password as the default branch, which is more unsecure.',
      );
    }
  }

  async getConnectionURL(
    branchIdentifier: BranchIdentifier,
    pooled: boolean,
  ): Promise<string> {
    const branchId = await branchIdentifier.getId(this.getAll);
    const { data: uri } = await this.neonClient.postgres.connectionString({
      projectId: this.projectId,
      databaseName: 'neondb',
      roleName: 'neondb_owner',
      branchId: branchId,
      pooled: pooled,
    });

    if (!uri) {
      throw new Error(
        `Failed to fetch connection string for the branch with ID ${branchId}`,
      );
    }

    return uri;
  }
}
