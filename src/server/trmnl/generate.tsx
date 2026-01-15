import { eq } from 'drizzle-orm';
import type { Context } from 'hono';
import React, { type FC } from 'react';
import { renderToString } from 'react-dom/server';
import { z } from 'zod';
import { db } from '@/server/db/index.ts';
import { canvasTokens, trmnlData } from '@/server/db/schema.ts';
import { ErrorDisplay } from '@/server/trmnl/screens/ErrorDisplay.tsx';
import { TodoListDisplay } from '@/server/trmnl/screens/TodoListDisplay.tsx';
import { verifyAccessToken } from '@/server/trmnl/token.ts';
import { encryptionUtilities } from '@/server/utilities/encryptionUtilities.ts';
import { fetchAssignmentData } from '@/server/utilities/fetchAssignmentData.ts';
import {
    createRequestLogger,
    performSafeContextFormBodyParse,
} from '@/server/utilities/honoUtilities.ts';
import { stringifyError, tryCatch } from '@/shared/utilities/tryCatch.ts';

const GenerateSchema = z.object({
    trmnl: z.object({
        user: z.object({
            name: z.string(),
            time_zone_iana: z.string(),
        }),
    }),
    user_uuid: z.uuid(),
});

export const renderAll = (
    Child: FC<{
        layout: 'full' | 'halfVertical' | 'halfHorizontal' | 'quadrant';
    }>,
) => {
    return {
        markup: renderToString(<Child layout='full' />),
        markup_half_horizontal: renderToString(
            <Child layout='halfHorizontal' />,
        ),
        markup_half_vertical: renderToString(<Child layout='halfVertical' />),
        markup_quadrant: renderToString(<Child layout='quadrant' />),
    } as const;
};

export const generate = async (c: Context) => {
    const logger = createRequestLogger(c);

    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
        logger.info('Missing Authorization header.');
        return c.text('Missing Authorization header.', 401);
    }

    const [tokenResult] = await verifyAccessToken(authHeader, db);
    if (!tokenResult) {
        logger.info('Invalid token.');
        return c.text('Invalid token.', 401);
    }

    // Parse the body as application/x-www-form-urlencoded
    const [formSuccess, form] = await performSafeContextFormBodyParse(c);
    if (!formSuccess) {
        logger.info('Invalid form body.');
        return c.text('Invalid form body.', 400);
    }
    const parsedBody = GenerateSchema.safeParse(form);
    if (!parsedBody.success) {
        logger.info('Invalid request body schema.', parsedBody.error);
        return c.text('Invalid request body schema.', 400);
    }
    const userId = parsedBody.data.user_uuid;

    // Get the consumer id from the trmnlId.
    const [trmnlDataQueryResult, trmnlDataQuery] = await tryCatch(
        db.select().from(trmnlData).where(eq(trmnlData.trmnlId, userId)),
    );
    if (!trmnlDataQueryResult) {
        logger.error(
            'Failed to query the db for trmnlData: %s',
            stringifyError(trmnlDataQuery),
        );
        return c.text('Internal server error.', 500);
    }
    if (trmnlDataQuery.length === 0) {
        logger.info('TrmnlData does not exist for userId: %s', userId);
        return c.text('Missing data.', 400);
    }
    const consumerId = trmnlDataQuery[0].consumerId;

    // If the consumer's name has changed, update it.
    if (parsedBody.data.trmnl.user.name !== trmnlDataQuery[0].name) {
        const [updateNameResult, updateName] = await tryCatch(
            db
                .update(trmnlData)
                .set({ name: parsedBody.data.trmnl.user.name })
                .where(eq(trmnlData.trmnlId, userId)),
        );
        if (!updateNameResult)
            logger.error(
                'Failed to update consumer name for trmnlId %s: %s',
                userId,
                stringifyError(updateName),
            );
    }

    // Get the canvas token from the database.
    const [canvasTokenSuccess, canvasToken] = await tryCatch(
        db
            .select()
            .from(canvasTokens)
            .where(eq(canvasTokens.consumerId, consumerId)),
    );
    if (!canvasTokenSuccess) {
        logger.error(
            'Failed to query the db for canvasToken: %s',
            stringifyError(canvasToken),
        );
        return c.text('Internal server error.', 500);
    }
    if (canvasToken.length === 0) {
        logger.info('No canvas token found for consumerId: %s', consumerId);
        return c.json(
            renderAll(() => (
                <ErrorDisplay errorMessage='Add a Canvas token and domain to see your assignments.' />
            )),
        );
    }
    const canvasData = canvasToken[0];

    const [decryptServerSuccess, decryptedServer] =
        encryptionUtilities.decryptString(canvasData.encryptedCanvasServer);
    if (!decryptServerSuccess) {
        logger.error(
            'Failed to decrypt canvas server for consumerId %s',
            consumerId,
        );
        return c.json(
            renderAll(() => (
                <ErrorDisplay errorMessage='Add a Canvas token and domain to see your assignments.' />
            )),
        );
    }

    const [decryptTokenSuccess, decryptedToken] =
        encryptionUtilities.decryptString(canvasData.encryptedCanvasToken);
    if (!decryptTokenSuccess) {
        logger.error(
            'Failed to decrypt canvas token for consumerId %s',
            consumerId,
        );
        return c.json(
            renderAll(() => (
                <ErrorDisplay errorMessage='Add a Canvas token and domain to see your assignments.' />
            )),
        );
    }

    // Get the canvas data
    const url = new URL(`https://${decryptedServer}`);

    const [canvasSuccess, canvasDataResult] = await fetchAssignmentData({
        baseUrl: url,
        token: decryptedToken,
    });

    if (!canvasSuccess) {
        logger.warn(
            'Failed to fetch canvas data: %s, %s',
            canvasDataResult.errorLocation,
            canvasDataResult.error,
        );
        return c.json(
            renderAll(() => (
                <ErrorDisplay
                    errorMessage={`Contact support. Failed to fetch canvas data: ${canvasDataResult.errorLocation}.`}
                />
            )),
        );
    }

    // Send data.
    const data: {
        courses: Record<
            number,
            {
                id: number;
                name: string;
            }
        >;
        assignments: Record<
            number,
            {
                id: number;
                courseId: number;
                name: string;
                description: string;
                dueAt: number | null;
            }
        >;
    } = {
        assignments: {},
        courses: {},
    };

    for (const [id, course] of canvasDataResult.courses.entries()) {
        data.courses[id] = {
            id: course.id,
            name: course.name,
        };
    }

    for (const [id, assignment] of canvasDataResult.assignments.entries()) {
        data.assignments[id] = {
            courseId: assignment.courseId,
            description: assignment.description,
            dueAt: assignment.dueAt ? assignment.dueAt.getTime() : null,
            id: assignment.id,
            name: assignment.name,
        };
    }

    return c.json({
        ...renderAll(({ layout }) => (
            <TodoListDisplay
                assignments={canvasDataResult.assignments}
                courses={canvasDataResult.courses}
                layout={layout}
                timezone={parsedBody.data.trmnl.user.time_zone_iana}
            />
        )),
        merge_variables: data,
    });
};
