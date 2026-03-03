/**
 * Cache Tags Constants
 * Used for granular revalidation across the application.
 */
export const CacheTags = {
    BOOKINGS: 'bookings',
    PROPERTIES: 'properties',
    UNITS: 'units',
    USERS: 'users',
    LEADS: 'leads',
    AGENTS: 'agents',
    DASHBOARD: 'dashboard',
    TENANTS: 'tenants',
} as const;

/**
 * Cache Manager Utility
 * Provides a clean interface for cache invalidation.
 */
export const cacheManager = {
    /**
     * Invalidates a specific tag by calling the server-side revalidation endpoint.
     * @param tag The tag name from CacheTags
     */
    async invalidate(tag: string | string[]) {
        const tags = Array.isArray(tag) ? tag : [tag];

        try {
            // We use the absolute path to our internal API route
            const response = await fetch('/api/revalidate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tags }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Cache invalidation failed for [${tags.join(', ')}]:`, errorData.message || response.statusText);
                return { success: false, error: response.statusText };
            }

            console.log(`Cache successfully invalidated for tags: ${tags.join(', ')}`);
            return { success: true };
        } catch (error) {
            console.error(`Network error during cache invalidation for [${tags.join(', ')}]:`, error);
            return { success: false, error: (error as Error).message };
        }
    }
};
