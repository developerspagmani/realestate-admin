'use client';

import { useParams } from 'next/navigation';
import StandaloneWebsitePage from '@/components/modules/realestate/website/StandaloneWebsitePage';

export default function GoLinkPage() {
    const params = useParams();
    const uniqueId = params?.uniqueId || params?.slug || '';
    const slug = Array.isArray(uniqueId) ? uniqueId[0] : uniqueId;

    return <StandaloneWebsitePage slugOrDomain={slug} />;
}
