import { relations } from 'drizzle-orm';
import {
    boolean,
    integer,
    json,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

export const consumers = pgTable('consumers', {
    id: uuid().primaryKey().defaultRandom(),
    createdAt: timestamp().notNull().defaultNow(),
});

export const consumersRelations = relations(consumers, ({ one }) => ({
    trmnlData: one(trmnlData),
    canvasToken: one(canvasTokens),
    settings: one(settings),
}));

export const trmnlData = pgTable('trmnlData', {
    id: uuid().primaryKey().defaultRandom(),
    consumerId: uuid()
        .unique()
        .notNull()
        .references(() => consumers.id, { onDelete: 'cascade' }),
    trmnlId: uuid().unique().notNull(),
    name: varchar().notNull(),
    email: varchar().notNull(),
    settingsId: integer().notNull(),
});

export const trmnlDataRelations = relations(trmnlData, ({ one }) => ({
    consumer: one(consumers, {
        fields: [trmnlData.consumerId],
        references: [consumers.id],
    }),
}));

export const trmnlAuthorizationTokens = pgTable('trmnlAuthorizationTokens', {
    id: uuid().primaryKey().defaultRandom(),
    used: boolean().notNull().default(false),
    token: text().unique().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
});

export const canvasTokens = pgTable('canvasTokens', {
    id: uuid().primaryKey().defaultRandom(),
    consumerId: uuid()
        .unique()
        .notNull()
        .references(() => consumers.id, { onDelete: 'cascade' }),
    canvasServer: text().notNull(),
    canvasToken: text().notNull(),
});

export const canvasTokensRelations = relations(canvasTokens, ({ one }) => ({
    consumer: one(consumers, {
        fields: [canvasTokens.consumerId],
        references: [consumers.id],
    }),
}));

export const settings = pgTable('settings', {
    id: uuid().primaryKey().defaultRandom(),
    consumerId: uuid()
        .unique()
        .notNull()
        .references(() => consumers.id, { onDelete: 'cascade' }),
    setting: json().notNull(),
});

export const settingsRelations = relations(settings, ({ one }) => ({
    consumer: one(consumers, {
        fields: [settings.consumerId],
        references: [consumers.id],
    }),
}));
