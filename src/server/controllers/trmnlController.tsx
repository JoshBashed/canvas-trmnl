import { TrmnlDisplay, TrmnlDisplayError } from '@/server/TrmnlDisplay.tsx';
import {
    type CanvasConfig,
    type CanvasCourseAssignmentsErrors,
    type CanvasCoursesErrors,
    fetchCourseAssignments,
    fetchCourses,
} from '@/server/apiClients/canvasApiClient.ts';
import { db } from '@/server/db/index.ts';
import {
    canvasTokens,
    consumers,
    trmnlAuthorizationTokens,
    trmnlData,
} from '@/server/db/schema.ts';
import {
    preformSafeContextBodyParse,
    preformSafeContextJsonParse,
} from '@/server/utilities/honoUtilities.ts';
import { createLogger } from '@/shared/utilities/loggingUtilities.ts';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { z } from 'zod';

const logger = createLogger('@/server/trmnlController');

const getAssignmentsForCanvasConfig = async (
    canvasObject: CanvasConfig,
): Promise<
    | [
          true,
          {
              courses: Map<
                  number,
                  {
                      id: number;
                      name: string;
                  }
              >;
              assignments: Map<
                  number,
                  {
                      id: number;
                      courseId: number;
                      name: string;
                      description: string;
                      dueAt: Date | null;
                  }
              >;
          },
      ]
    | [
          false,
          (
              | {
                    errorLocation: 'fetchCourses';
                    error: CanvasCoursesErrors;
                }
              | {
                    errorLocation: 'fetchCourseAssignments';
                    courseId: number;
                    error: CanvasCourseAssignmentsErrors;
                }
          ),
      ]
> => {
    const [coursesSuccess, courses] = await fetchCourses(canvasObject, {});
    if (!coursesSuccess) {
        return [
            false,
            {
                errorLocation: 'fetchCourses',
                error: courses,
            },
        ];
    }

    const coursesData = new Map<number, { id: number; name: string }>();
    for (const course of courses) {
        coursesData.set(course.id, { id: course.id, name: course.name });
    }

    const assignmentsData = new Map<
        number,
        {
            id: number;
            courseId: number;
            name: string;
            description: string;
            dueAt: Date | null;
        }
    >();
    for await (const [courseId] of coursesData) {
        const [assignmentsSuccess, assignments] = await fetchCourseAssignments(
            canvasObject,
            {
                courseId,
                orderBy: 'due_at',
                bucket: 'unsubmitted',
            },
        );
        if (!assignmentsSuccess) {
            return [
                false,
                {
                    errorLocation: 'fetchCourseAssignments',
                    courseId,
                    error: assignments,
                },
            ];
        }

        for (const assignment of assignments) {
            assignmentsData.set(assignment.id, {
                id: assignment.id,
                courseId,
                name: assignment.name,
                description: assignment.description,
                dueAt: assignment.dueAt,
            });
        }
    }

    return [
        true,
        {
            courses: coursesData,
            assignments: assignmentsData,
        },
    ];
};

const verifyAccessToken = async (
    accessToken: string,
    database: typeof db,
): Promise<[true, string] | [false, undefined]> => {
    const db = database;
    const authHeader = accessToken.trim();

    // Strip the "Bearer " prefix from the auth header.
    const token = authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length)
        : authHeader;

    // Check if the token is valid.
    const [querySuccess, query]:
        | [true, Array<typeof trmnlAuthorizationTokens.$inferSelect>]
        | [false, undefined] = await db
        .select()
        .from(trmnlAuthorizationTokens)
        .where(eq(trmnlAuthorizationTokens.token, token))
        .execute()
        .then(
            (result) =>
                [true, result] as [
                    true,
                    Array<typeof trmnlAuthorizationTokens.$inferSelect>,
                ],
        )
        .catch(() => [false, undefined] as const);

    if (!querySuccess) {
        logger.warn(
            'Failed to query the database for token %s',
            `${token.slice(0, 4)}...`,
        );
        return [false, undefined];
    }

    if (query.length === 0) {
        logger.info('Ignored request with invalid token.');
        return [false, undefined];
    }

    // Token is valid.
    return [true, token];
};

export const createTrmnlRoutes = (): Hono => {
    const app = new Hono();

    app.get('/help/', async (c) => {
        return c.redirect('/app/help/');
    });

    app.get('/oauth/new/', async (c) => {
        // Get the `code` query parameter from the request.
        const code = c.req.query('code');
        if (!code) {
            return c.text('Missing code.', 400);
        }

        const callbackUrl = c.req.query('installation_callback_url');
        if (!callbackUrl) {
            return c.text('Missing installation_callback_url.', 400);
        }

        return c.redirect(
            `/app/oauth/create/?code=${encodeURIComponent(code)}&callback_url=${encodeURIComponent(callbackUrl)}`,
        );
    });

    app.get('/settings/', async (c) => {
        // Get the `uuid` query parameter from the request.
        const code = c.req.query('uuid');
        if (!code) {
            return c.text('Missing uuid.', 400);
        }

        return c.redirect(`/app/manage/${encodeURIComponent(code)}/`);
    });

    const WebhookInstallSchema = z
        .object({
            user: z.object({
                name: z.string(),
                email: z.string().email(),
                first_name: z.string(),
                last_name: z.string(),
                locale: z.string(),
                time_zone: z.string(),
                time_zone_iana: z.string(),
                utc_offset: z.number(),
                plugin_setting_id: z.number(),
                uuid: z.string().uuid(),
            }),
        })
        .transform((data) => ({
            name: data.user.name,
            email: data.user.email,
            firstName: data.user.first_name,
            lastName: data.user.last_name,
            locale: data.user.locale,
            timeZone: data.user.time_zone,
            timeZoneIana: data.user.time_zone_iana,
            utcOffset: data.user.utc_offset,
            pluginSettingId: data.user.plugin_setting_id,
            uuid: data.user.uuid,
        }));
    app.post('/webhook/install/', async (c) => {
        // Get the auth header from the request.
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            logger.info(
                'Ignored request to /webhook/install/ without auth header.',
            );
            return c.text('Missing Authorization header.', 400);
        }

        const [validToken, token] = await verifyAccessToken(authHeader, db);
        if (!validToken) {
            logger.info(
                'Ignored request to /webhook/install/ with invalid token.',
            );
            return c.text('Invalid token.', 401);
        }

        // Parse the request body.
        const [jsonSuccess, json] = await preformSafeContextJsonParse(c);
        if (!jsonSuccess) {
            logger.info(
                'Ignored request to /webhook/install/ with invalid JSON.',
            );
            return c.text('Invalid JSON.', 400);
        }

        // Validate the request body.
        const parseResult = WebhookInstallSchema.safeParse(json);
        if (!parseResult.success) {
            logger.info(
                'Ignored request to /webhook/install/ with invalid schema: %s',
                parseResult.error,
            );
            return c.text(`Invalid schema: ${parseResult.error}`, 400);
        }

        // Check if the consumer already exists.
        const data = parseResult.data;

        // Ensure the consumer is not already in the database.
        const [consumerQuerySuccess, consumerQuery]:
            | [true, Array<typeof trmnlData.$inferSelect>]
            | [false, undefined] = await db
            .select()
            .from(trmnlData)
            .where(eq(trmnlData.trmnlId, data.uuid))
            .execute()
            .then(
                (result) =>
                    [true, result] as [
                        true,
                        Array<typeof trmnlData.$inferSelect>,
                    ],
            )
            .catch(() => [false, undefined] as const);
        if (!consumerQuerySuccess) {
            logger.info('Failed to query the database for consumer %s', data);
            return c.text('Failed to query the database.', 500);
        }

        if (consumerQuery && consumerQuery.length > 0) {
            logger.info(
                'Ignored request to /webhook/install/ with existing consumer.',
            );
            return c.text('Consumer already exists.', 400);
        }

        // Transaction to insert the consumer and settings.
        const insertSuccess = await db
            .transaction(async (tx) => {
                // Create a new consumer.
                const consumer = await tx
                    .insert(consumers)
                    .values({})
                    .returning()
                    .then((result) => result[0])
                    .catch(() => undefined);
                if (!consumer) {
                    logger.info(
                        'Failed to insert the consumer into the database.',
                    );
                    return tx.rollback();
                }

                // Insert the consumer data.
                const consumerData = await tx
                    .insert(trmnlData)
                    .values({
                        consumerId: consumer.id,
                        trmnlId: data.uuid,
                        name: data.name,
                        email: data.email,
                        settingsId: data.pluginSettingId,
                    })
                    .returning()
                    .then((result) => result[0])
                    .catch(() => undefined);
                if (!consumerData) {
                    logger.info(
                        'Failed to insert the consumer data into the database.',
                    );
                    return tx.rollback();
                }
            })
            .then(() => true)
            .catch((error) => {
                logger.error(
                    'Failed to insert the consumer into the database: %s',
                    error,
                );
                return false;
            });

        if (!insertSuccess) {
            logger.info('Failed to insert the consumer into the database.');
            return c.text('Failed to insert the consumer.', 500);
        }

        // Mark the token as used.
        const updateSuccess = await db
            .update(trmnlAuthorizationTokens)
            .set({ used: true })
            .where(eq(trmnlAuthorizationTokens.token, token))
            .execute()
            .then(() => true)
            .catch(() => false);
        if (!updateSuccess) {
            logger.info(
                'Failed to update the token in the database while handling install webhook.',
            );
            return c.text('Failed to update the token.', 500);
        }

        // Return a success response.
        logger.info('Successfully installed the consumer %s', data.uuid);
        return c.text('Success.', 200);
    });

    const WebhookUninstallSchema = z
        .object({
            user_uuid: z.string().uuid(),
        })
        .transform((data) => ({
            userUuid: data.user_uuid,
        }));
    app.post('/webhook/uninstall/', async (c) => {
        // Get the auth header from the request.
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            logger.info(
                'Ignored request to /webhook/uninstall/ without auth header.',
            );
            return c.text('Missing Authorization header.', 400);
        }

        // Check if the token is valid.
        const [validToken, token] = await verifyAccessToken(authHeader, db);
        if (!validToken) {
            logger.info(
                'Ignored request to /webhook/uninstall/ with invalid token.',
            );
            return c.text('Invalid token.', 401);
        }

        // Parse the request body.
        const [jsonSuccess, json] = await preformSafeContextJsonParse(c);
        if (!jsonSuccess) {
            logger.info(
                'Ignored request to /webhook/uninstall/ with invalid JSON.',
            );
            return c.text('Invalid JSON.', 400);
        }

        // Validate the request body.
        const parseResult = WebhookUninstallSchema.safeParse(json);
        if (!parseResult.success) {
            logger.info(
                'Ignored request to /webhook/uninstall/ with invalid schema: %s',
                parseResult.error,
            );
            return c.text(`Invalid schema: ${parseResult.error}`, 400);
        }

        // The uuid.
        const uuid = parseResult.data.userUuid;

        // Get the consumer id from the trmnlId.
        const [consumerQuerySuccess, consumerQuery]:
            | [true, Array<typeof trmnlData.$inferSelect>]
            | [false, undefined] = await db
            .select()
            .from(trmnlData)
            .where(eq(trmnlData.trmnlId, uuid))
            .execute()
            .then(
                (result) =>
                    [true, result] as [
                        true,
                        Array<typeof trmnlData.$inferSelect>,
                    ],
            )
            .catch(() => [false, undefined] as const);

        if (!consumerQuerySuccess) {
            logger.info('Failed to query the database for consumer %s', uuid);
            return c.text('Failed to query the database.', 500);
        }

        if (consumerQuery.length === 0) {
            logger.info(
                'Ignored request to /webhook/uninstall/ with invalid consumer.',
            );
            return c.text('Invalid consumer.', 400);
        }

        const consumerId = consumerQuery[0].consumerId;

        // Delete the consumer and cascade.
        const deleteSuccess = await db
            .delete(consumers)
            .where(eq(consumers.id, consumerId))
            .execute()
            .then(() => true)
            .catch(() => false);
        if (!deleteSuccess) {
            logger.info(
                'Failed to delete the consumer from the database while handling uninstall webhook.',
            );
            return c.text('Failed to delete the consumer.', 500);
        }

        // Delete the access token.
        const deleteTokenSuccess = await db
            .delete(trmnlAuthorizationTokens)
            .where(eq(trmnlAuthorizationTokens.token, token))
            .execute()
            .then(() => true)
            .catch(() => false);
        if (!deleteTokenSuccess) {
            logger.info(
                'Failed to delete the token from the database while handling uninstall webhook.',
            );
            return c.text('Failed to delete the token.', 500);
        }

        // Return a success response.
        logger.info('Successfully uninstalled the consumer %s', uuid);
        return c.text('Success.', 200);
    });

    const GenerateSchema = z
        .object({
            user_uuid: z.string().uuid(),
        })
        .transform((data) => ({
            userUuid: data.user_uuid,
        }));
    app.post('/generate/', async (c) => {
        // Get the auth header from the request.
        const authHeader = c.req.header('Authorization');
        if (!authHeader) {
            logger.info('Ignored request to /generate/ without auth header.');
            return c.text('Missing Authorization header.', 400);
        }

        // Strip the "Bearer " prefix from the auth header.
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice('Bearer '.length)
            : authHeader;

        // Check if the token is valid.
        const [querySuccess, query]:
            | [true, Array<typeof trmnlAuthorizationTokens.$inferSelect>]
            | [false, undefined] = await db
            .select()
            .from(trmnlAuthorizationTokens)
            .where(eq(trmnlAuthorizationTokens.token, token))
            .execute()
            .then(
                (result) =>
                    [true, result] as [
                        true,
                        Array<typeof trmnlAuthorizationTokens.$inferSelect>,
                    ],
            )
            .catch(() => [false, undefined] as const);

        if (!querySuccess) {
            logger.info(
                'Failed to query the database for token %s',
                `${token.slice(0, 4)}...`,
            );
            return c.text('Failed to query the database.', 500);
        }

        if (query.length === 0) {
            logger.info('Ignored request to /generate/ with invalid token.');
            return c.text('Invalid token.', 401);
        }

        // Parse the body as application/x-www-form-urlencoded
        const [formSuccess, form] = await preformSafeContextBodyParse(c);
        if (!formSuccess) {
            logger.info('Ignored request to /generate/ with invalid form.');
            return c.text('Invalid form.', 400);
        }

        // Validate the request body.
        const parseResult = GenerateSchema.safeParse(form);
        if (!parseResult.success) {
            logger.info(
                'Ignored request to /generate/ with invalid schema: %s',
                parseResult.error,
            );
            return c.text(`Invalid schema: ${parseResult.error}`, 400);
        }

        // The uuid.
        const uuid = parseResult.data.userUuid;

        // Get the consumer id from the trmnlId.
        const [consumerQuerySuccess, consumerQuery]:
            | [true, Array<typeof trmnlData.$inferSelect>]
            | [false, undefined] = await db
            .select()
            .from(trmnlData)
            .where(eq(trmnlData.trmnlId, uuid))
            .execute()
            .then(
                (result) =>
                    [true, result] as [
                        true,
                        Array<typeof trmnlData.$inferSelect>,
                    ],
            )
            .catch((error) => {
                logger.error(
                    'Failed to query the database for consumer while handling generate request: %s',
                    error instanceof Error ? error.message : error,
                );
                return [false, undefined] as const;
            });

        if (!consumerQuerySuccess) {
            logger.info('Failed to query the database for consumer %s', uuid);
            return c.text('Failed to query the database.', 500);
        }

        if (consumerQuery.length === 0) {
            logger.info('Ignored request to /generate/ with invalid consumer.');
            return c.text('Invalid consumer.', 400);
        }

        const consumerId = consumerQuery[0].consumerId;

        // Get the canvas token from the database.
        const [canvasQuerySuccess, canvasQuery]:
            | [true, Array<typeof canvasTokens.$inferSelect>]
            | [false, undefined] = await db
            .select()
            .from(canvasTokens)
            .where(eq(canvasTokens.consumerId, consumerId))
            .execute()
            .then(
                (result) =>
                    [true, result] as [
                        true,
                        Array<typeof canvasTokens.$inferSelect>,
                    ],
            )
            .catch(() => [false, undefined] as const);
        if (!canvasQuerySuccess) {
            logger.info(
                'Failed to query the database for canvas token %s',
                `${token.slice(0, 4)}...`,
            );
            return c.text('Failed to query the database.', 500);
        }

        if (canvasQuery.length === 0) {
            logger.info(
                'Returning error markup for /generate/ with no canvas token.',
            );
            return c.json({
                markup: renderToString(
                    <TrmnlDisplayError errorMessage='plugin is not configured :(' />,
                ),
            });
        }
        const canvasData = canvasQuery[0];

        // Get the canvas data
        const url = new URL(`https://${canvasData.canvasServer}`);

        const [canvasSuccess, canvasDataResult] =
            await getAssignmentsForCanvasConfig({
                baseUrl: url,
                token: canvasData.canvasToken,
            });

        if (!canvasSuccess) {
            logger.info(
                'Returning error markup for /generate/ with canvas error.',
            );
            return c.json({
                markup: renderToString(
                    <TrmnlDisplayError
                        errorMessage={`canvas error: ${canvasDataResult.error}`}
                    />,
                ),
            });
        }

        return c.json({
            markup: renderToString(
                <TrmnlDisplay
                    courses={canvasDataResult.courses}
                    assignments={canvasDataResult.assignments}
                />,
            ),
        });
    });

    return app;
};
