import { appEnv } from '@/server/appEnv.ts';
import { jobMain } from '@/server/job.ts';
import { serverMain } from '@/server/server.tsx';

if (appEnv.mode === 'server') {
    serverMain();
} else {
    jobMain();
}
