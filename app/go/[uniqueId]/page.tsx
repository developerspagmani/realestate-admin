'use client';

import PublicWidgetPage from '@/app/public/widgets/[uniqueId]/page';

/**
 * Go Link Standalone Portal
 * Redirects or renders the public widget in a full-page standalone mode.
 */
export default function GoLinkPage() {
    // We can just reuse the PublicWidgetPage component as it occupies the full screen naturally
    // but we can wrap it in any specific SEO or "Landing Page" containers if needed.
    return <PublicWidgetPage />;
}
