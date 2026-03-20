import { useState, useEffect } from 'react';
import { Property } from '@/types';

/**
 * Hook to manage the Intelligent Matching Engine for popups.
 * It tracks user history and matches it against current available properties.
 */
export function useIntelligentPopup(properties: Property[] | undefined) {
    const [matchedProperty, setMatchedProperty] = useState<Property | null>(null);

    useEffect(() => {
        console.log('Intelligent Engine - Evaluating...', { 
            propCount: properties?.length, 
            historyKey: 'visited_properties' 
        });
        
        if (!properties || properties.length === 0) {
            console.log('Intelligent Engine - No properties provided to hook.');
            return;
        }

        try {
            const visitedStr = localStorage.getItem('visited_properties') || '[]';
            const visitedIds = JSON.parse(visitedStr);
            console.log('Intelligent Engine - Visit history:', visitedIds);

            if (Array.isArray(visitedIds) && visitedIds.length > 0) {
                // Find the first property in properties that exists in our history (most recent first)
                // We prioritize the one at index 0 as it's the absolute latest view
                const match = properties.find(p => p.id === visitedIds[0]) ||
                    properties.find(p => visitedIds.includes(p.id)) ||
                    properties.find(p => p.slug === visitedIds[0]) ||
                    properties.find(p => visitedIds.includes(p.slug));

                if (match) {
                    console.log('%c Intelligent Matching - Success! Found match: ' + match.name, 'background: #8e44ad; color: white; padding: 2px 5px; border-radius: 3px;');
                    setMatchedProperty(match);
                } else {
                    console.log('Intelligent Engine - No property in list matches the visit history.');
                }
            } else {
                console.log('Intelligent Engine - Visit history is empty.');
            }
        } catch (e) {
            console.error('Intelligent matching failed:', e);
        }
    }, [properties]);

    return { matchedProperty };
}

/**
 * Utility to track property views in localStorage for the Intelligent Engine.
 */
export const trackPropertyView = (propertyId: string) => {
    console.log('Intelligent Matching - Global tracking called for:', propertyId);
    if (typeof window === 'undefined' || !localStorage) return;
    try {
        const visitedStr = localStorage.getItem('visited_properties') || '[]';
        let visitedArr = JSON.parse(visitedStr);
        if (!Array.isArray(visitedArr)) visitedArr = [];
        // Place new ID at front, remove duplicates, limit to 10
        visitedArr = [propertyId, ...visitedArr.filter((id: string) => id !== propertyId)].slice(0, 10);
        localStorage.setItem('visited_properties', JSON.stringify(visitedArr));
        console.log('Intelligent Matching - History updated:', visitedArr);
    } catch (err) {
        console.error('Intelligent Matching - Tracker failed:', err);
    }
};
