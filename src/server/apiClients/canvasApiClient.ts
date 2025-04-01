import {
    createSearchParams,
    performSafeJsonParse,
    performSafeRequest,
} from '@/shared/utilities/fetchUtilities.ts';
import { z } from 'zod';

export interface CanvasConfig {
    token: string;
    baseUrl: URL;
}

// Courses

const CanvasCourseSchema = z.object({
    id: z.number(),
    name: z.string(),
});
const CanvasCoursesSchema = z.array(CanvasCourseSchema);
export interface CoursesRequest {
    enrollmentRole?: 'teacher' | 'student' | 'ta' | 'observer' | 'designer';
}
export type CanvasCoursesResponse = z.infer<typeof CanvasCoursesSchema>;
export type CanvasCoursesErrors =
    | 'requestError'
    | 'jsonParseError'
    | 'schemaValidationError';

export const fetchCourses = async (
    config: CanvasConfig,
    request: CoursesRequest,
): Promise<[true, CanvasCoursesResponse] | [false, CanvasCoursesErrors]> => {
    // Create the URL.
    const url = new URL('/api/v1/courses', config.baseUrl);
    url.search = createSearchParams({
        enrollment_role: request.enrollmentRole,
    }).toString();

    // Make the request.
    const [responseSuccess, response] = await performSafeRequest(
        url.toString(),
        {
            headers: {
                Authorization: `Bearer ${config.token}`,
            },
        },
    );
    if (!responseSuccess) {
        return [false, 'requestError'];
    }

    // Parse the response.
    const [jsonSuccess, json] = await performSafeJsonParse(
        await response.text(),
    );
    if (!jsonSuccess) {
        return [false, 'jsonParseError'];
    }

    // Validate the response.
    const result = CanvasCoursesSchema.safeParse(json);
    if (!result.success) {
        return [false, 'schemaValidationError'];
    }

    return [true, result.data];
};

// Assignments

const CanvasCourseAssignmentSchema = z
    .object({
        id: z.number(),
        name: z.string(),
        description: z.string().nullable(),
        due_at: z.coerce.date().nullable(),
    })
    .transform((data) => ({
        id: data.id,
        name: data.name,
        description: data.description ?? '',
        dueAt: data.due_at,
    }));
const CanvasCourseAssignmentsSchema = z.array(CanvasCourseAssignmentSchema);
export interface AssignmentsRequest {
    courseId: number;
    orderBy?: 'position' | 'name' | 'due_at';
    bucket?:
        | 'past'
        | 'overdue'
        | 'undated'
        | 'ungraded'
        | 'unsubmitted'
        | 'upcoming'
        | 'future';
}
export type CanvasCourseAssignmentsResponse = z.infer<
    typeof CanvasCourseAssignmentsSchema
>;
export type CanvasCourseAssignmentsErrors =
    | 'requestError'
    | 'jsonParseError'
    | 'schemaValidationError';

export const fetchCourseAssignments = async (
    config: CanvasConfig,
    request: AssignmentsRequest,
): Promise<
    | [true, CanvasCourseAssignmentsResponse]
    | [false, CanvasCourseAssignmentsErrors]
> => {
    // Create the URL.
    const url = new URL(
        `/api/v1/courses/${encodeURIComponent(request.courseId)}/assignments`,
        config.baseUrl,
    );
    url.search = createSearchParams({
        order_by: request.orderBy,
        bucket: request.bucket,
    }).toString();

    // Make the request.
    const [responseSuccess, response] = await performSafeRequest(
        url.toString(),
        {
            headers: {
                Authorization: `Bearer ${config.token}`,
            },
        },
    );
    if (!responseSuccess) {
        return [false, 'requestError'];
    }

    // Parse the response.
    const [jsonSuccess, json] = await performSafeJsonParse(
        await response.text(),
    );
    if (!jsonSuccess) {
        return [false, 'jsonParseError'];
    }

    // Validate the response.
    const result = CanvasCourseAssignmentsSchema.safeParse(json);
    if (!result.success) {
        console.log(result.error);
        return [false, 'schemaValidationError'];
    }

    return [true, result.data];
};
