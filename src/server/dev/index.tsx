import { Hono } from 'hono';
import React from 'react';
import { z } from 'zod';
import { renderAll } from '@/server/trmnl/generate.tsx';
import { TodoListDisplay } from '@/server/trmnl/screens/TodoListDisplay.tsx';
import { performSafeContextJsonParse } from '@/server/utilities/honoUtilities.ts';

const LONG_POLLING_TIMEOUT = 5000;

const GenerateSchema = z.object({
    assignments: z.record(
        z.string(),
        z.object({
            courseId: z.number(),
            description: z.string(),
            dueAt: z.iso.datetime().nullable(),
            id: z.number(),
            name: z.string(),
        }),
    ),
    courses: z.record(
        z.string(),
        z.object({
            id: z.number(),
            name: z.string(),
        }),
    ),
});
type Generate = z.infer<typeof GenerateSchema>;
type GenerateAssignment = Generate['assignments'][number];
type GenerateCourse = Generate['courses'][number];

export const createDevRoutes = (): Hono => {
    const app = new Hono();

    app.get('/long-polling/', async (c) => {
        await new Promise((resolve) =>
            setTimeout(resolve, LONG_POLLING_TIMEOUT),
        );
        return c.body(null, 204);
    });

    app.post('/generate/', async (c) => {
        // Parse the body
        const [bodyResult, body] = await performSafeContextJsonParse(c);
        if (!bodyResult) return c.body(null, 400);
        const dataResult = GenerateSchema.safeParse(body);
        if (!dataResult.success) return c.body(null, 400);
        const data = dataResult.data;

        const assignments = new Map<
            number,
            Omit<GenerateAssignment, 'dueAt'> & {
                dueAt: Date | null;
            }
        >();
        for (const [_id, assignment] of Object.entries(data.assignments)) {
            assignments.set(assignment.id, {
                courseId: assignment.courseId,
                description: assignment.description,
                dueAt: assignment.dueAt ? new Date(assignment.dueAt) : null,
                id: assignment.id,
                name: assignment.name,
            });
        }
        const courses = new Map<number, GenerateCourse>();
        for (const [id, course] of Object.entries(data.courses)) {
            courses.set(Number(id), course);
        }

        return c.json(
            renderAll(({ layout }) => (
                <TodoListDisplay
                    assignments={assignments}
                    courses={courses}
                    layout={layout}
                />
            )),
        );
    });

    return app;
};
