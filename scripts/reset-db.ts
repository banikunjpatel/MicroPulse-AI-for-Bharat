import postgres from "postgres";

const connectionString = process.env.DATABASE_URL!;

async function main() {
  const client = postgres(connectionString, { max: 1 });

  console.log("Creating tables...");

  try {
    // Create user table
    await client`
      CREATE TABLE "user" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "email" text NOT NULL UNIQUE,
        "email_verified" boolean DEFAULT false NOT NULL,
        "image" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;

    // Create session table
    await client`
      CREATE TABLE "session" (
        "id" text PRIMARY KEY NOT NULL,
        "expires_at" timestamp NOT NULL,
        "token" text NOT NULL UNIQUE,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "ip_address" text,
        "user_agent" text,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
      )
    `;

    await client`CREATE INDEX "session_userId_idx" ON "session" ("user_id")`;

    // Create account table
    await client`
      CREATE TABLE "account" (
        "id" text PRIMARY KEY NOT NULL,
        "account_id" text NOT NULL,
        "provider_id" text NOT NULL,
        "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
        "access_token" text,
        "refresh_token" text,
        "id_token" text,
        "access_token_expires_at" timestamp,
        "refresh_token_expires_at" timestamp,
        "scope" text,
        "password" text,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;

    await client`CREATE INDEX "account_userId_idx" ON "account" ("user_id")`;

    // Create verification table
    await client`
      CREATE TABLE "verification" (
        "id" text PRIMARY KEY NOT NULL,
        "identifier" text NOT NULL,
        "value" text NOT NULL,
        "expires_at" timestamp NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;

    await client`CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier")`;

    console.log("All tables created successfully!");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.end();
  }
}

main();
