import { APIKeyProvision, BranchProvision } from "@/bot/interface.ts";
import { Collection, MongoClient } from "mongodb";

let cachedConnection: Promise<MongoClient> | null = null;
/**
 * Connect to DB, and cache the connection
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (!cachedConnection) {
    const mongoURL = process.env.MONGO_URL;
    if (!mongoURL) {
      throw new Error("Undefined MONGO_URL");
    }

    const mongoClient = new MongoClient(mongoURL);

    cachedConnection = mongoClient
      .connect()
      .then((client) => {
        console.log("[STARTUP] Successfully connected to MongoDB!");
        return client;
      })
      .catch((err) => {
        cachedConnection = null;
        throw err;
      });
  }

  return cachedConnection;
}

/**
 * Connect to the key provisions collection of database
 */
export async function getKeyProvisionCollection(): Promise<
  Collection<APIKeyProvision>
> {
  const client = await getMongoClient();
  return client.db("combinedDB").collection<APIKeyProvision>("keyProvisions");
}

/**
 * Connect to the branch collection of database
 */
export async function getBranchProvisionCollection(): Promise<
  Collection<BranchProvision>
> {
  const client = await getMongoClient();
  return client
    .db("combinedDB")
    .collection<BranchProvision>("branchProvisions");
}

/**
 * Connect to the authorized users collection of database
 */
export async function getAuthorizedUsersCollection(): Promise<
  Collection<BranchProvision>
> {
  const client = await getMongoClient();
  return client.db("combinedDB").collection<BranchProvision>("authorizedUsers");
}
