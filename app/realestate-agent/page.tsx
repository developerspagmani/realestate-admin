'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AgentRoot() {
    const router = useRouter();

    useEffect(() => {
        router.push('/realestate-agent/dashboard');
    }, [router]);

    return null;
}
