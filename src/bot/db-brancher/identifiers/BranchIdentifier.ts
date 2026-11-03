import { OnlyOneRequired } from '@/utils/types';

export type BranchIdentifierFields = {
  id: string;
  name: string;
};

export function branch(identifier: OnlyOneRequired<BranchIdentifierFields>) {
  return new BranchIdentifier(identifier);
}

export class BranchIdentifier {
  #id: BranchIdentifierFields['id'] | undefined;
  #name: BranchIdentifierFields['name'] | undefined;

  constructor(identifier: OnlyOneRequired<BranchIdentifierFields>) {
    this.#id = identifier.id;
    this.#name = identifier.name;
  }

  async getId(
    getBranches: () => Promise<BranchIdentifierFields[]>,
  ): Promise<BranchIdentifierFields['id']> {
    if (this.#id) {
      return this.#id;
    } else if (this.#name) {
      const targetName = this.#name;
      const branchesList = await getBranches();
      const result = branchesList.find((b) => b.name === targetName)?.id;
      if (!result)
        throw new Error(`Could not find branch with name "${targetName}"`);
      return result;
    }
    throw new Error('Could not find ID of branch');
  }

  async getName(
    getBranches: () => Promise<BranchIdentifierFields[]>,
  ): Promise<BranchIdentifierFields['name']> {
    if (this.#name) {
      return this.#name;
    } else if (this.#id) {
      const targetId = this.#id;
      const branchesList = await getBranches();
      const result = branchesList.find((b) => b.id === targetId)?.name;
      if (!result) throw new Error(`Could not find branch with ID ${targetId}`);
      return result;
    }
    throw new Error('Could not find name of branch');
  }
}
