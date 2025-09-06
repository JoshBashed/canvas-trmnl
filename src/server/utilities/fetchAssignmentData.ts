import {
    type CanvasConfig,
    type CanvasCourseAssignmentsErrors,
    type CanvasCoursesErrors,
    fetchCourseAssignments,
    fetchCourses,
} from '@/server/apiClients/canvasApiClient.ts';

export interface AssignmentData {
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
}

export const fetchAssignmentData = async (
    canvasObject: CanvasConfig,
): Promise<
    | [true, AssignmentData]
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
    const [coursesSuccess, courses] = await fetchCourses(canvasObject, {
        enrollmentState: 'active',
        state: ['available'],
    });
    if (!coursesSuccess) {
        return [
            false,
            {
                error: courses,
                errorLocation: 'fetchCourses',
            },
        ];
    }

    const coursesData = new Map<number, { id: number; name: string }>();
    for (const course of courses) {
        if (!course.name) continue;
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
                bucket: 'unsubmitted',
                courseId,
                orderBy: 'due_at',
            },
        );
        if (!assignmentsSuccess) {
            return [
                false,
                {
                    courseId,
                    error: assignments,
                    errorLocation: 'fetchCourseAssignments',
                },
            ];
        }

        for (const assignment of assignments) {
            assignmentsData.set(assignment.id, {
                courseId,
                description: assignment.description,
                dueAt: assignment.dueAt,
                id: assignment.id,
                name: assignment.name,
            });
        }
    }

    return [
        true,
        {
            assignments: assignmentsData,
            courses: coursesData,
        },
    ];
};
