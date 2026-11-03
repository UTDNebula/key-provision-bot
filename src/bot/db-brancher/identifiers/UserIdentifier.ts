import { OnlyOneRequired } from '@/utils/types';

export type UserIdentifierFields = {
  id: string;
  githubUsername: string;
};

export function user(identifier: OnlyOneRequired<UserIdentifierFields>) {
  return new UserIdentifier(identifier);
}

export class UserIdentifier {
  #id: UserIdentifierFields['id'] | undefined;
  #githubUsername: UserIdentifierFields['githubUsername'] | undefined;

  constructor(identifier: OnlyOneRequired<UserIdentifierFields>) {
    this.#id = identifier.id;
    this.#githubUsername = identifier.githubUsername;
  }

  async getId(): Promise<UserIdentifierFields['id']> {
    if (this.#id) {
      return this.#id;
    } else {
      // TODO: Search user database using user's GitHub username and return their id
      throw new Error(
        'Not implemented: Identifying a user with their GitHub username',
      );
    }
  }

  async getGitHubUsername(): Promise<UserIdentifierFields['githubUsername']> {
    if (this.#githubUsername) {
      return this.#githubUsername;
    } else {
      // TODO: Search user database using user's ID and return their GitHub username
      throw new Error('Not implemented: Identifying a user with their ID');
    }
  }
}
