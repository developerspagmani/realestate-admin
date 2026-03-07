import { Suspense } from 'react';
import Loader from '@/components/common/Loader';
import IntelligentVoiceManager from '@/components/modules/realestate/intelligent-voice/IntelligentVoiceManager';

export default function IntelligentVoicePage() {
    return (
        <Suspense fallback={<div className="p-5 text-center"><Loader size="md" message="Initializing Voice Protocol..." /></div>}>
            <IntelligentVoiceManager />
        </Suspense>
    );
}
