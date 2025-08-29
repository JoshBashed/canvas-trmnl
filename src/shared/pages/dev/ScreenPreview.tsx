import React, { type FC, useEffect, useState } from 'react';
import { z } from 'zod';
import { Page } from '@/shared/components/Page.tsx';
import { TRMNLPreview } from '@/shared/components/TRMNLPreview.tsx';
import {
    performSafeJsonParse,
    performSafeRequest,
} from '@/shared/utilities/fetchUtilities.ts';

const DEV_POLLING_PATH = '/dev/long-polling/';
const DEV_GENERATE_PATH = '/dev/generate/';

const GenerateResponseSchema = z.object({
    markup: z.string(),
    markup_half_horizontal: z.string(),
    markup_half_vertical: z.string(),
    markup_quadrant: z.string(),
});

const CREATE_DATE = (offset: number) =>
    new Date(Date.now() + offset * 1000).toISOString();

const STATIC_DATA = {
    assignments: {
        '301': {
            courseId: 201,
            description:
                "<p>Write a 300-word reflection on what you've learned in Unit 1. Be honest and detailed.</p>",
            dueAt: CREATE_DATE(60 * 24 * 2),
            id: 301,
            name: 'Unit 1 Reflection',
        },
        '302': {
            courseId: 201,
            description: '',
            dueAt: CREATE_DATE(60 * 24),
            id: 302,
            name: 'Unit 2 Quiz',
        },
        '303': {
            courseId: 202,
            description:
                '<p><strong>Submit your mockups</strong> for the mobile version of your UI redesign project. Use <em>Figma</em> or <em>Sketch</em>.</p>\n<ul>\n  <li>Minimum 3 screens</li>\n  <li>Link to the prototype</li>\n  <li>Optional: design rationale</li>\n</ul>',
            dueAt: CREATE_DATE(60 * 24),
            id: 303,
            name: 'Design Mockup Submission',
        },
        '304': {
            courseId: 202,
            description: '',
            dueAt: null,
            id: 304,
            name: 'Typography Research',
        },
        '305': {
            courseId: 203,
            description:
                '<p>Compile all your best work into a single portfolio PDF. Include:</p>\n<ol>\n  <li>Cover page with name and course</li>\n  <li>Each project with a title, short description, and visuals</li>\n  <li>Link to online version (if any)</li>\n</ol>',
            dueAt: CREATE_DATE(60 * 24 * 3),
            id: 305,
            name: 'Final Portfolio',
        },
        '306': {
            courseId: 204,
            description:
                'Just list what you read and a short comment (1-2 sentences).',
            dueAt: CREATE_DATE(-60 * 24 * 60),
            id: 306,
            name: 'Reading Log Week 5',
        },
        '307': {
            courseId: 204,
            description:
                '<p>Respond to one of the prompts listed in our online forum. Be respectful and support your ideas with examples.</p>',
            dueAt: CREATE_DATE(-60 * 24 * 1),
            id: 307,
            name: 'Class Discussion Post',
        },
        '308': {
            courseId: 204,
            description:
                '<p>Write a short "tweet" about the week\'s topic.</p>',
            dueAt: CREATE_DATE(-60 * 24 * 1),
            id: 308,
            name: 'Weekly News Reflection',
        },
    },
    courses: {
        '201': { id: 201, name: 'English Literature B (A. Smith)' },
        '202': { id: 202, name: 'User Interface Design (R. Lin)' },
        '203': { id: 203, name: 'Digital Art & Portfolio (M. Reyes)' },
        '204': { id: 204, name: 'Current Issues Seminar (L. Tran)' },
    },
} as const;

export const ScreenPreview: FC = () => {
    const [cachedHTML, setCachedHTML] = useState<{
        full: string;
        halfHorizontal: string;
        halfVertical: string;
        quadrant: string;
    } | null>(null);
    const [requiresRefresh, setRequiresRefresh] = useState(true);
    useEffect(() => {
        if (requiresRefresh) return;
        let inFetch = false;
        const interval = setInterval(async () => {
            if (inFetch) return;
            inFetch = true;
            const [responseResult, response] =
                await performSafeRequest(DEV_POLLING_PATH);
            if (!responseResult || response.status !== 204) {
                setRequiresRefresh(true);
                inFetch = false;
                return;
            }
            inFetch = false;
        }, 200);
        return () => clearInterval(interval);
    }, [requiresRefresh]);
    useEffect(() => {
        if (!requiresRefresh) return;
        let inFetch = false;
        const interval = setInterval(async () => {
            if (inFetch) return;
            inFetch = true;
            const [responseResult, response] = await performSafeRequest(
                DEV_GENERATE_PATH,
                {
                    body: JSON.stringify(STATIC_DATA),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    method: 'POST',
                },
            );
            if (!responseResult) {
                inFetch = false;
                return;
            }
            const [jsonResult, json] = await performSafeJsonParse(
                await response.text(),
            );
            if (!jsonResult) {
                inFetch = false;
                return;
            }
            const dataResult = GenerateResponseSchema.safeParse(json);
            if (!dataResult.success) {
                inFetch = false;
                return;
            }
            const data = dataResult.data;
            setRequiresRefresh(false);
            setCachedHTML({
                full: data.markup,
                halfHorizontal: data.markup_half_horizontal,
                halfVertical: data.markup_half_vertical,
                quadrant: data.markup_quadrant,
            });
            inFetch = false;
        }, 200);
        return () => clearInterval(interval);
    }, [requiresRefresh]);

    return (
        <Page
            description='Preview various screens.'
            enableSSR={false}
            title='Screen Preview'
        >
            <div className='flex flex-col items-center p-4 sm:p-8 md:p-16'>
                <div className='flex flex-col gap-8'>
                    <h1 className='font-bold text-3xl'>Screen Preview</h1>
                    <div className='flex w-full items-center justify-center'>
                        <TRMNLPreview html={cachedHTML} />
                    </div>
                </div>
            </div>
        </Page>
    );
};
