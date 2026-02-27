import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, index, integer, pgEnum } from "drizzle-orm/pg-core";

export const skuCategoryEnum = pgEnum("sku_category", [
  "beverages",
  "snacks",
  "dairy",
  "personal_care",
  "household",
  "other",
]);

export const skuStatusEnum = pgEnum("sku_status", [
  "active",
  "inactive",
  "no_history",
]);

export const skus = pgTable(
  "skus",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    category: skuCategoryEnum("category").notNull(),
    unitCostPaise: integer("unit_cost_paise").notNull(),
    leadTimeDays: integer("lead_time_days").notNull(),
    status: skuStatusEnum("status").default("no_history").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("skus_category_idx").on(table.category)]
);

export const inventory = pgTable(
  "inventory",
  {
    skuId: text("sku_id").notNull().references(() => skus.id, { onDelete: "cascade" }),
    pinCode: text("pin_code").notNull(),
    stockOnHand: integer("stock_on_hand").notNull().default(0),
    reorderPoint: integer("reorder_point").notNull().default(0),
    lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  },
  (table) => [
    index("inventory_sku_idx").on(table.skuId),
    index("inventory_pin_idx").on(table.pinCode),
  ]
);

export const pinCodeStatusEnum = pgEnum("pin_code_status", [
  "active",
  "inactive",
]);

export const pinCodes = pgTable(
  "pin_codes",
  {
    pinCode: text("pin_code").primaryKey(),
    areaName: text("area_name").notNull(),
    region: text("region").notNull(),
    storeCount: integer("store_count").notNull().default(0),
    status: pinCodeStatusEnum("status").default("active").notNull(),
  },
  (table) => [index("pin_codes_region_idx").on(table.region)]
);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  },
  (table) => [
    index("account_userId_idx").on(table.userId),
    index("account_providerId_accountId_idx").on(table.providerId, table.accountId),
  ]
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").defaultNow(),
    updatedAt: timestamp("updatedAt").defaultNow(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
