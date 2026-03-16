export type QualificationStatus = 'SQL' | 'MQL' | 'New';

export interface QualificationResult {
    status: QualificationStatus;
    reason: string;
    badges: string[];
    auraColor: string;
    vibe?: 'Hot' | 'Warm' | 'Cold' | 'VIP';
}

export const analyzeLeadBehavior = (lead: any): QualificationResult => {
    const score = lead.leadScore || 0;
    const interactions = (lead.interactions || []) as any[];
    const budget = lead.budget || 0;
    const status = lead.status;
    const now = new Date();

    // Calculate Recency
    const lastInteraction = interactions.length > 0 
        ? new Date(Math.max(...interactions.map(i => new Date(i.createdAt).getTime())))
        : new Date(lead.createdAt);
    const hoursSinceLastAction = (now.getTime() - lastInteraction.getTime()) / (1000 * 3600);
    const daysSinceLastAction = hoursSinceLastAction / 24;

    // 1. High-Intent Triggers
    const hasDirectContact = interactions.some(i => ['WHATSAPP_CLICK', 'PHONE_CLICK'].includes(i.type));
    const hasHighIntentForm = interactions.some(i => ['BOOKING_REQUEST', 'UNIT_BOOKING_START', 'POPUP_SUBMIT', 'POPUP_CLICK'].includes(i.type));
    
    // 2. Momentum Trigger (3+ actions in last 24 hours)
    const recentActions = interactions.filter(i => {
        const actionDate = new Date(i.createdAt);
        return (now.getTime() - actionDate.getTime()) / (1000 * 3600) <= 24;
    }).length;
    const hasMomentum = recentActions >= 3;

    // 3. Deep Research (Same property views)
    const propertyViews = interactions.filter(i => i.type === 'PROPERTY_VIEW');
    const propertyIds = propertyViews.map(i => i.metadata?.propertyId).filter(Boolean);
    const maxRepeats = propertyIds.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);
    const isDeepResearcher = Object.values(maxRepeats).some(count => (count as number) >= 3);

    // SQL LOGIC (Sales Qualified)
    // Threshold reduced to 85 for better coverage, or high momentum/intent
    const isSQL = status === 'qualified' || 
                  (score >= 85 && daysSinceLastAction <= 7) || 
                  (hasHighIntentForm) ||
                  (hasDirectContact && score > 50) ||
                  (hasMomentum && score > 60);

    if (isSQL) {
        let badges = ['Ready to Close'];
        if (hasMomentum) badges.push('High Momentum');
        if (hasDirectContact) badges.push('Immediate Intent');
        if (isDeepResearcher) badges.push('Product Focused');
        if (budget > 10000000) badges.push('VIP Whale'); // Example 1Cr+ budget

        return {
            status: 'SQL',
            reason: hasMomentum ? 'Surge in recent activity' : hasDirectContact ? 'Direct contact initiated' : 'High engagement score',
            badges: badges,
            auraColor: daysSinceLastAction > 5 ? 'rgba(255, 165, 0, 0.2)' : 'rgba(255, 71, 87, 0.2)', // Orange if cooling, Red if hot
            vibe: budget > 10000000 ? 'VIP' : 'Hot'
        };
    }

    // MQL LOGIC (Marketing Qualified)
    const isMQL = score >= 40 || interactions.length >= 3 || isDeepResearcher;

    if (isMQL) {
        return {
            status: 'MQL',
            reason: isDeepResearcher ? 'Dedicated research behavior' : 'Steady interest progression',
            badges: ['Active Explorer', 'Engaged'],
            auraColor: 'rgba(30, 215, 96, 0.2)',
            vibe: 'Warm'
        };
    }

    // NEW / DISCOVERY
    return {
        status: 'New',
        reason: 'Initial awareness stage',
        badges: ['Discovery'],
        auraColor: 'transparent',
        vibe: daysSinceLastAction > 30 ? 'Cold' : 'Warm'
    };
};
