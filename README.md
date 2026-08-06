# Discord Bot / API Key Provisioning

Discord bot that automatically provisions Nebula API keys for users.

## Design Overview

Each key is tied to a Discord user. When a user requests a key, the key is provisioned and stored as a record associated with that Discord user.

If a project uses a key, that project has a Discord member who is the "representative" for the key.

This design helps us track ownership and requests info. If a key is abused or needs to be revoked, we can reach out to the person responsible and follow up directly.

## How It Works

1. A Discord user runs `/request-key`.
2. The bot shows a modal to collect project name and description.
3. The bot checks whether that user already has an existing provisioned key.
4. If not, the bot creates a new key, encrypts it, and saves it linked to the user.
5. The bot DMs the user their key.

## Run

Make sure your environment variables are set, then run:

```bash
npm run install
npm run discord
```

## Contribution

Contribution is welcome!
