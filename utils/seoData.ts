export interface SEOConfig {
    title: string;
    description: string;
    keywords: string;
    ogTitle?: string;
    ogDescription?: string;
    ogUrl?: string;
    schemaType?: 'SoftwareApplication' | 'WebApplication' | 'BusinessService';
    ratingValue?: string;
    ratingCount?: string;
}

export const seoData: Record<string, SEOConfig> = {
    'virpa-ai': {
        title: 'Virpa AI: Conversational Intelligence for Real Estate | Virpanix',
        description: 'Discover Virpa, the institutional-grade neural intelligence layer for high-velocity real estate lead qualification, intent decoding, and automated sales velocity.',
        keywords: 'Real Estate AI, Lead Qualification, Conversational AI, PropTech, Virpanix, Neural Intent Decoding',
        ogTitle: 'Virpa AI: Conversational Intelligence for Real Estate',
        ogDescription: 'Institutional-grade neural intelligence layer for real estate lead qualification.',
        ogUrl: 'https://virpanix.com/pages/virpa-ai',
        schemaType: 'SoftwareApplication',
        ratingValue: '4.9',
        ratingCount: '120'
    },
    'analytics': {
        title: 'Data Intelligence & Analytics | Virpanix Real Estate AI',
        description: 'Advanced data-driven insights to monitor and grow your real estate business. Predictive revenue forecasting and deal leakage prevention for global portfolios.',
        keywords: 'Real Estate Analytics, Predictive Forecasting, PropIntel, Virpanix Intelligence, ROI Tracking',
        ogTitle: 'Data Intelligence & Analytics | Virpanix',
        ogDescription: 'Advanced data-driven insights to monitor and grow your real estate business.',
        schemaType: 'SoftwareApplication',
        ratingValue: '4.8',
        ratingCount: '85'
    },
    'crm': {
        title: 'Leads & CRM Hub | Virpanix Real Estate AI',
        description: 'Institutional-grade CRM for real estate professionals. Automated lead scoring, audience grouping, and high-velocity pipeline management for global portfolios.',
        keywords: 'Real Estate CRM, Lead Scoring, Pipeline Management, Real Estate Leads, Virpanix',
        ogTitle: 'Leads & CRM Hub | Virpanix',
        ogDescription: 'Institutional-grade CRM for real estate professionals.',
        schemaType: 'SoftwareApplication',
        ratingValue: '4.9',
        ratingCount: '150'
    },
    'intelligent-voice': {
        title: 'Intelligent Voice Command | Virpanix Real Estate AI',
        description: 'Hands-free real estate operations powered by neural intent decoding. Command your CRM, analytics, and inventory with elite voice intelligence.',
        keywords: 'Voice AI, Real Estate Voice Command, SLU Intent Decoding, Hands-Free Real Estate, Virpanix',
        ogTitle: 'Intelligent Voice Command | Virpanix',
        ogDescription: 'Hands-free real estate operations powered by neural intent decoding.',
        schemaType: 'SoftwareApplication',
        ratingValue: '5.0',
        ratingCount: '45'
    },
    'social-hub': {
        title: 'Social Hub & WhatsApp Business | Virpanix Real Estate AI',
        description: 'Institutional-grade WhatsApp automation and omnichannel social sync. Convert social traffic into qualified leads with high-velocity automation.',
        keywords: 'WhatsApp Marketing, Social Media Automation, Real Estate Social Hub, Omnichannel CRM, Virpanix',
        ogTitle: 'Social Hub & WhatsApp | Virpanix',
        ogDescription: 'Institutional-grade WhatsApp automation and omnichannel social sync.',
        schemaType: 'SoftwareApplication',
        ratingValue: '4.9',
        ratingCount: '98'
    },
    'marketing': {
        title: 'Marketing & Automation | Virpanix Real Estate AI',
        description: 'Deliver the right property at the perfect moment. Use behavioral triggers to nurture leads from discovery to closing with automated workflows.',
        keywords: 'Real Estate Marketing, Marketing Automation, Lead Nurturing, Drip Campaigns, Virpanix',
        ogTitle: 'Marketing & Automation | Virpanix',
        ogDescription: 'Deliver the right property at the perfect moment with automated workflows.',
        schemaType: 'SoftwareApplication',
        ratingValue: '4.7',
        ratingCount: '62'
    },
    'inventory': {
        title: 'Property Portfolio Management | Virpanix Real Estate AI',
        description: 'Consolidated management for large-scale real estate portfolios. Track unit availability, media assets, and batch operations with zero latency.',
        keywords: 'Inventory Management, Property Portfolio, Real Estate ERP, Asset Management, Virpanix',
        ogTitle: 'Property Portfolio Management | Virpanix',
        ogDescription: 'Consolidated management for large-scale real estate portfolios.',
        schemaType: 'SoftwareApplication',
        ratingValue: '4.8',
        ratingCount: '74'
    },
    'plot-maps': {
        title: 'Interactive Plot Maps | Virpanix Real Estate AI',
        description: 'Immersive lossless SVG site plans with real-time inventory status colors. Bridge the gap between imagination and reality for your buyers.',
        keywords: 'Interactive Maps, Plot Status, Real Estate Visualization, SVG Site Plans, Virpanix',
        ogTitle: 'Interactive Plot Maps | Virpanix',
        ogDescription: 'Immersive lossless SVG site plans with real-time inventory status levels.',
        schemaType: 'SoftwareApplication',
        ratingValue: '4.9',
        ratingCount: '53'
    },
    'matching-engine': {
        title: 'AI Matching Engine | Virpanix Real Estate AI',
        description: 'Instantly align buyer intent with available inventory. Reduce lead time and increase deposits with n-dimensional intent mapping.',
        keywords: 'Lead Matching, Intent Mapping, Real Estate AI Engine, Property Suggestions, Virpanix',
        ogTitle: 'AI Matching Engine | Virpanix',
        ogDescription: 'Instantly align buyer intent with available inventory.',
        schemaType: 'SoftwareApplication',
        ratingValue: '4.9',
        ratingCount: '41'
    },
    'brochure-ai': {
        title: 'Brochure Intelligent AI | Virpanix Real Estate AI',
        description: 'Institutional-grade sales collateral generated in seconds. AI copywriting and smart media sync for your entire property inventory.',
        keywords: 'AI Brochure Generator, Real Estate Sales Deck, Automatic Copywriting, PDF Generation, Virpanix',
        ogTitle: 'Brochure Intelligent AI | Virpanix',
        ogDescription: 'Institutional-grade sales collateral generated in seconds via Gemini Nano.',
        schemaType: 'SoftwareApplication',
        ratingValue: '4.9',
        ratingCount: '89'
    },
    'seo-engine': {
        title: 'Search SEO Engine | Virpanix Real Estate AI',
        description: 'Dominate organic search results with automated indexing, schema mapping, and institutional XML sitemap management.',
        keywords: 'Real Estate SEO, Automated Indexing, Schema.org Markup, Google Search Console Sync, Virpanix',
        ogTitle: 'Search SEO Engine | Virpanix',
        ogDescription: 'Dominate organic search results with automated indexing and schema mapping.',
        schemaType: 'SoftwareApplication',
        ratingValue: '5.0',
        ratingCount: '32'
    },
    'websites': {
        title: 'Websites & Ecosystem Hub | Virpanix Real Estate AI',
        description: 'Instant property microsite deployment and custom domain mapping. Move buyers from noisy portals to your dedicated branded ecosystem.',
        keywords: 'Real Estate Websites, Property Microsites, Custom Domains, Headless CMS, Virpanix',
        ogTitle: 'Websites & Ecosystem Hub | Virpanix',
        ogDescription: 'Instant property microsite deployment and white-label portals.',
        schemaType: 'SoftwareApplication',
        ratingValue: '4.8',
        ratingCount: '57'
    },
    'about': {
        title: 'About Us | Virpanix Real Estate OS',
        description: 'The future of real estate is autonomous. Learn more about the Virpanix mission to decentralize and automate the global property market.',
        keywords: 'About Virpanix, Real Estate Future, PropTech Mission, Autonomous Real Estate',
        ogTitle: 'About Virpanix',
        ogDescription: 'The future of real estate is autonomous.',
        schemaType: 'WebApplication'
    },
    'plans': {
        title: 'Pricing & Enterprise Plans | Virpanix Real Estate AI',
        description: 'Scalable intelligence for real estate developers and agencies. Choose the right tier for your portfolio size and growth velocity.',
        keywords: 'Virpanix Pricing, Real Estate OS License, Enterprise PropTech Plans',
        ogTitle: 'Pricing & Enterprise Plans | Virpanix',
        ogDescription: 'Scalable intelligence for real estate developers and agencies.',
        schemaType: 'WebApplication'
    },
    'contact': {
        title: 'Contact Support | Virpanix Real Estate Intelligence',
        description: 'Institutional-grade support for high-velocity real estate operations. Connect with our technical deployment team.',
        keywords: 'Virpanix Support, PropTech Help, Real Estate AI Deployment',
        ogTitle: 'Contact Support | Virpanix',
        ogDescription: 'Institutional-grade support for high-velocity real estate operations.',
        schemaType: 'WebApplication'
    }
};
