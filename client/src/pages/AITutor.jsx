import { Suspense, lazy } from 'react';
import { CenteredPageSkeleton } from '../components/ui/LoadingState';

const AIChatbot = lazy(() => import('../components/AIChatbot'));

function AssistantLoader() {
    return <CenteredPageSkeleton />;
}

export default function AITutor() {
    return (
        <Suspense fallback={<AssistantLoader />}>
            <AIChatbot />
        </Suspense>
    );
}
