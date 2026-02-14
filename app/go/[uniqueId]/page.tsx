import { redirect } from 'next/navigation';

export default async function GoLinkPage({ params }: { params: Promise<{ uniqueId: string }> }) {
    const resolvedParams = await params;
    // Redirect to the new multi-page standalone structure
    redirect(`/standalone/${resolvedParams.uniqueId}`);
}
