import { relations } from 'drizzle-orm';
import {
    boolean,
    integer,
    json,
    pgTable,
    text,
    timestamp,
    uuid,
    varchar,
} from 'drizzle-orm/pg-core';

export const consumers = pgTable('consumers', {
    createdAt: timestamp().notNull().defaultNow(),
    id: uuid().primaryKey().defaultRandom(),
});

export const consumersRelations = relations(consumers, ({ one }) => ({
    canvasToken: one(canvasTokens),
    settings: one(settings),
    trmnlData: one(trmnlData),
}));

export const trmnlData = pgTable('trmnlData', {
    consumerId: uuid()
        .unique()
        .notNull()
        .references(() => consumers.id, { onDelete: 'cascade' }),
    email: varchar().notNull(),
    id: uuid().primaryKey().defaultRandom(),
    name: varchar().notNull(),
    settingsId: integer().notNull(),
    trmnlId: uuid().unique().notNull(),
});

export const trmnlDataRelations = relations(trmnlData, ({ one }) => ({
    consumer: one(consumers, {
        fields: [trmnlData.consumerId],
        references: [consumers.id],
    }),
}));

export const trmnlAuthorizationTokens = pgTable('trmnlAuthorizationTokens', {
    createdAt: timestamp().notNull().defaultNow(),
    id: uuid().primaryKey().defaultRandom(),
    token: text().unique().notNull(),
    used: boolean().notNull().default(false),
});

export const canvasTokens = pgTable('canvasTokens', {
    consumerId: uuid()
        .unique()
        .notNull()
        .references(() => consumers.id, { onDelete: 'cascade' }),
    encryptedCanvasServer: text().notNull(),
    encryptedCanvasToken: text().notNull(),
    id: uuid().primaryKey().defaultRandom(),
});

export const canvasTokensRelations = relations(canvasTokens, ({ one }) => ({
    consumer: one(consumers, {
        fields: [canvasTokens.consumerId],
        references: [consumers.id],
    }),
}));

export const settings = pgTable('settings', {
    consumerId: uuid()
        .unique()
        .notNull()
        .references(() => consumers.id, { onDelete: 'cascade' }),
    id: uuid().primaryKey().defaultRandom(),
    setting: json().notNull(),
});

export const settingsRelations = relations(settings, ({ one }) => ({
    consumer: one(consumers, {
        fields: [settings.consumerId],
        references: [consumers.id],
    }),
}));
