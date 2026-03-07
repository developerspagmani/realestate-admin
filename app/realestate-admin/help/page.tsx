'use client';

import React, { useState } from 'react';
import MainLayout from '@/components/MainLayout';

const HELP_MODULES = [
    {
        id: 'analytics',
        title: 'Analytics & Intelligence',
        icon: 'bi-graph-up-arrow',
        color: 'primary',
        description: 'Advanced data-driven insights to monitor and grow your real estate business.',
        impact: 'Drive a 35% reduction in CAC (Customer Acquisition Cost) by identifying high-value lead sources and eliminating deal leakage with AI-driven risk mitigation. Turn raw data into a predictive revenue engine.',
        sections: [
            {
                name: 'Deal Intelligence',
                content: 'Analyzes lost deals to identify leakage reasons like price, location, or budget. It calculates weighted impact based on lead quality and sales stage.'
            },
            {
                name: 'Deal Prevention',
                content: 'Proactively identifies at-risk deals using AI risk scoring. It monitors activity silence and engagement signals to prompt manager intervention.'
            },
            {
                name: 'Forecasting',
                content: 'Predicts future revenue by analyzing historical trends, seasonal fluctuations, and your current pipeline health.'
            },
            {
                name: 'Property Intelligence (PropIntel)',
                content: 'Analyzes listing performance to categorize properties as "Invisible" or "Dead-end". Provides AI advice on price and description optimization.'
            }
        ]
    },
    {
        id: 'crm',
        title: 'Leads & CRM',
        icon: 'bi-person-badge',
        color: 'success',
        description: 'Centralized management for your entire sales pipeline and customer interactions.',
        impact: 'Unlock a 45% surge in agent productivity and ensure 100% lead follow-up compliance. Centralize your pipeline to transform every interaction into a potential closing with zero manual friction.',
        sections: [
            {
                name: 'Lead Management',
                content: 'Capture leads from websites, widgets, and offline sources. Track status from "New" to "Converted" using Kanban or Table views.'
            },
            {
                name: 'Lead Scoring',
                content: 'Automatically ranks leads from 1-100 based on their interaction frequency, budget, and intent signals.'
            },
            {
                name: 'Audience Grouping',
                content: 'Segment leads into dynamic groups for targeted marketing based on their property preferences or budget ranges.'
            }
        ]
    },
    {
        id: 'marketing',
        title: 'Marketing Hub',
        icon: 'bi-megaphone',
        color: 'primary',
        description: 'Powerful tools for email campaigns, automation, and audience growth.',
        impact: 'Achieve a 3x increase in lifetime customer value using surgical automation. Deliver the right property at the perfect moment through behavioral-triggered nurture sequences that convert leads into buyers.',
        sections: [
            {
                name: 'Campaign Designer',
                content: 'Build professional email blasts using drag-and-drop templates. Track real-time open and click rates.'
            },
            {
                name: 'Automation Workflows',
                content: 'Create "set-and-forget" sequences that nurture leads automatically when they join a group or change status.'
            },
            {
                name: 'Lead Forms',
                content: 'Design custom forms to capture specific data points. These forms sync directly with your CRM and Widgets.'
            }
        ]
    },
    {
        id: 'websites',
        title: 'Website Builder',
        icon: 'bi-window-sidebar',
        color: 'info',
        description: 'Launch branded real estate landing pages and property microsites instantly.',
        impact: 'Establish a dominant digital footprint with SEO-optimized project hubs that boost inbound lead quality by 50%. Lower your reliance on third-party portals and own your audience directly.',
        sections: [
            {
                name: 'Instant Layouts',
                content: 'Switch between "Listing Layout" for property details and "Branded Builder" for custom landing pages.'
            },
            {
                name: 'Domain Mapping',
                content: 'Connect your own .com or premium domains to any site created in the platform for a professional look.'
            },
            {
                name: 'SEO & Tracking',
                content: 'Add Google Analytics, Facebook Pixels, and custom meta tags directly through the dashboard.'
            }
        ]
    },
    {
        id: 'widgets',
        title: 'Widgets & Embeds',
        icon: 'bi-code-slash',
        color: 'warning',
        description: 'Embed your property data into any external website seamlessly.',
        impact: 'Weaponize your inventory by distributing it across a global network of affiliate sites. Generate a 200% increase in referral traffic and capture leads at every touchpoint on the web.',
        sections: [
            {
                name: 'Universal Script',
                content: 'A single line of JavaScript that works on WordPress, Wix, or custom HTML sites to display your inventory.'
            },
            {
                name: 'Live Customizer',
                content: 'Change colors, fonts, and property filters in real-time from the admin without touching code.'
            }
        ]
    },
    {
        id: 'integrations',
        title: 'External Integrations',
        icon: 'bi-puzzle',
        color: 'dark',
        description: 'Connect Virpanix to your existing digital ecosystem.',
        impact: 'Eradicate data silos and accelerate closing velocity by 25%. Sync your sales data with ERPs and communication tools to provide a seamless, unified experience for your team and buyers.',
        sections: [
            {
                name: 'WordPress Plugin',
                content: 'Sync properties and capture leads directly within your WordPress environment using our secure API bridge.'
            },
            {
                name: 'API Management',
                content: 'Generate and revoke site-specific API keys. Use Sandbox mode for testing new site connections safely.'
            }
        ]
    },
    {
        id: 'matching',
        title: 'Matching Engine',
        icon: 'bi-layer-backward',
        color: 'danger',
        description: 'Intelligent inventory matching based on buyer intent.',
        impact: "Convert 'just looking' into 'ready to buy' by instantly aligning inventory with deep buyer intent. Slash time-to-sale by 60% by showing leads exactly what they want before they even ask.",
        sections: [
            {
                name: 'Intent Matching',
                content: 'Matches leads to properties automatically based on location, budget, and specific amenities.'
            },
            {
                name: 'Note System',
                content: 'Add internal operational notes to matches to track manual intervention and deal progress.'
            }
        ]
    },
    {
        id: 'inventory',
        title: 'Property Portfolio',
        icon: 'bi-building',
        color: 'info',
        description: 'Comprehensive management of your property portfolio and digital assets.',
        impact: 'Optimize your Portfolio Velocity with real-time inventory precision. Prevent double-bookings, manage dynamic pricing, and build ironclad buyer trust through project transparency.',
        sections: [
            {
                name: 'Consolidated Management',
                content: 'Track projects, buildings, and land parcels with full specifications, location data, and technical requirements.'
            },
            {
                name: 'Media Gallery Hub',
                content: 'Centralized repository for high-resolution photos, 3D tours, floor plans, and legal documents mapped to units.'
            },
            {
                name: 'Batch Operations',
                content: 'Rapidly import inventory via CSV and export comprehensive portfolio data for external reporting and analysis.'
            }
        ]
    },
    {
        id: 'seo-engine',
        title: 'Search Engine Optimization',
        icon: 'bi-search-heart',
        color: 'dark',
        description: 'Advanced technical SEO and organic visibility management.',
        impact: 'Dominating search results is the highest ROI marketing activity. Use the indexing engine to ensure your projects appear in Google results within minutes, cutting your dependency on paid ads by up to 60%.',
        sections: [
            {
                name: 'Technical Architecture',
                content: 'Server-side rendering (SSR) for lightning-fast crawls, automated JSON-LD structured data for Google Rich Snippets, and dynamic XML Sitemap generation for every property and project hub.'
            },
            {
                name: 'Multi-Tenant SEO',
                content: 'Centralized control to manage SEO across all sub-portals, ensuring consistent site-wide metadata strategies and global canonical URL management to prevent content cannibalization.'
            },
            {
                name: 'Enterprise Indexing',
                content: 'Aggressive instant indexing pings proactively notify search engines of new property launches and status changes across the entire platform ecosystem.'
            },
            {
                name: 'SEO Best Practices',
                content: 'Always use descriptive slugs (e.g., /luxury-villa-in-downton-city), ensure main property photos have ALT text, and provide detailed neighborhood descriptions to capture long-tail search intent.'
            }
        ]
    },
    {
        id: 'plot-maps',
        title: 'Interactive Plot Maps',
        icon: 'bi-map',
        color: 'success',
        description: 'Visual SVG-based township and project navigation for buyers.',
        impact: 'Increase buyer engagement by 70% with immersive site plan navigation. Provide instant clarity on availability and location premium with real-time visual inventory status.',
        sections: [
            {
                name: 'SVG Interactivity',
                content: 'High-performance pan, zoom, and click interface for complex township layouts and building floor plans.'
            },
            {
                name: 'Live Status Sync',
                content: 'Dynamic color-coding (Available, Reserved, Sold) that updates instantly as deals progress in the CRM.'
            },
            {
                name: 'Instant Unit Detail',
                content: 'One-click access to specific unit pricing, area, and reservation options directly from the map interface.'
            }
        ]
    },
    {
        id: 'operations',
        title: 'Operations & Bookings',
        icon: 'bi-calendar-check',
        color: 'success',
        description: 'Streamline daily operations, appointment scheduling, and unit reservations.',
        impact: 'Transform administrative bottlenecks into operational excellence. Reduce site-visit coordination time by 80% and increase site-to-sale conversion rates via digital-first booking workflows.',
        sections: [
            {
                name: 'Booking Engine',
                content: 'Real-time reservation system for customer site visits and temporary unit holds during negotiation.'
            },
            {
                name: 'Task Management',
                content: 'Internal workflow tool to assign maintenance, follow-ups, and legal tasks to your team members.'
            },
            {
                name: 'Lease Tracking',
                content: 'Monitor rental agreements, tenant onboarding, and automated renewal reminders for rental properties.'
            }
        ]
    },
    {
        id: 'team',
        title: 'Team & Access',
        icon: 'bi-people',
        color: 'warning',
        description: 'Manage roles, permissions, and performance for your entire workforce.',
        impact: 'Build a high-performance culture with real-time performance visibility. Identify peak sales behaviors, automate commission tracking, and scale top-tier talent across your organization.',
        sections: [
            {
                name: 'Agent Performance',
                content: 'Track sales targets, commission tiers, and conversion rates across your entire sales force.'
            },
            {
                name: 'Granular Permissions',
                content: 'Secure your data with role-based access control (RBAC) specifically tailored for Real Estate workflows.'
            }
        ]
    },
    {
        id: 'brochure-ai',
        title: 'Brochure Intelligent',
        icon: 'bi-file-earmark-pdf',
        color: 'dark',
        description: 'AI-powered generation of professional property sales brochures.',
        impact: 'Slash marketing production costs by 95% and shorten sales cycles. Generate elite, print-ready property brochures in seconds using Gemini Nano AI to convert Technical specs into persuasive narratives.',
        sections: [
            {
                name: 'AI Copywriting',
                content: 'Advanced neural networks transform raw property data into professional, high-conversion sales copy automatically.'
            },
            {
                name: 'Smart Media Sync',
                content: 'Instant integration of high-resolution property galleries, amenities, and floor plans into standard brochure layouts.'
            },
            {
                name: 'Interactive Export',
                content: 'Generate PDF flyers with auto-injected QR codes that link directly to live property landing pages for instant lead capture.'
            }
        ]
    },
    {
        id: 'ai-tools',
        title: 'Advanced AI Tools',
        icon: 'bi-robot',
        color: 'primary',
        description: 'Cutting-edge Generative AI features to give you a competitive edge.',
        impact: 'Disrupt traditional marketing costs with Gemini Nano AI. Generate professional sales collateral in seconds—not days—achieving a 95% reduction in production overhead while maintaining elite brand standards.',
        sections: [
            {
                name: 'Smart Insights',
                content: 'Automated advice on property pricing based on market sentiment and historical neighborhood performance.'
            },
            {
                name: 'Lead Scoring AI',
                content: 'Predictive modeling to identify high-intent buyers based on behavioral patterns and engagement metrics.'
            }
        ]
    }
];

export default function HelpPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeModule, setActiveModule] = useState<string | null>(null);

    const filteredModules = HELP_MODULES.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.sections.some(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <MainLayout activePage="help">
            <div className="container-fluid py-5">
                <div className="text-center mb-5">
                    <h1 className="fw-extrabold display-4 mb-2 text-dark">Knowledge Base</h1>
                    <p className="text-muted lead">Comprehensive documentation for the Virpanix Platform</p>

                    <div className="col-md-6 mx-auto mt-4">
                        <div className="input-group input-group-lg shadow-sm rounded-4 overflow-hidden border">
                            <span className="input-group-text bg-white border-0"><i className="bi bi-search text-muted"></i></span>
                            <input
                                type="text"
                                className="form-control border-0 py-3"
                                placeholder="Search our documentation..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="row g-4 align-items-start">
                    <div className="col-lg-3 sticky-top" style={{ top: '20px', zIndex: 10 }}>
                        <div className="card border-0 shadow-sm rounded-4 bg-dark text-white p-4 mb-4">
                            <h5 className="fw-bold mb-3">Quick Support</h5>
                            <p className="small opacity-75 mb-4">Are you an administrator needing deep technical support or custom feature configuration?</p>
                            <button
                                className="btn btn-primary rounded-pill w-100 fw-bold py-2 shadow-sm border-white border-1"
                                onClick={() => window.location.href = 'mailto:support@virpanix.com'}
                            >
                                <i className="bi bi-envelope-fill me-2"></i> Admin Support
                            </button>
                            <div className="mt-3 extra-small opacity-75 text-center">
                                <i className="bi bi-info-circle me-1 text-white"></i> Or use the global <strong>Support Ticket</strong>.
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 p-4">
                            <h6 className="fw-bold text-uppercase small text-muted mb-3">Sections</h6>
                            <div className="overflow-auto custom-scrollbar" style={{ maxHeight: 'calc(100vh - 450px)' }}>
                                <nav className="nav flex-column gap-2 pe-2">
                                    {HELP_MODULES.map(m => (
                                        <button
                                            key={m.id}
                                            className={`nav-link border-0 text-start rounded-3 px-3 py-2 transition-all ${activeModule === m.id ? 'bg-light text-primary fw-bold' : 'text-muted bg-transparent hover-bg-light'}`}
                                            onClick={() => {
                                                setActiveModule(m.id);
                                                document.getElementById(m.id)?.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                        >
                                            <i className={`bi ${m.icon} me-2`}></i> {m.title}
                                        </button>
                                    ))}
                                </nav>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-9">
                        {filteredModules.length === 0 ? (
                            <div className="text-center py-5">
                                <i className="bi bi-search display-3 text-muted opacity-25"></i>
                                <h4 className="mt-3 text-muted">No documents match your search</h4>
                            </div>
                        ) : (
                            filteredModules.map((module) => (
                                <div key={module.id} id={module.id} className="card border-0 shadow-sm rounded-4 mb-5 overflow-hidden animate-fade-in shadow-hover">
                                    <div className={`card-header bg-${module.color} bg-opacity-10 border-0 p-4`}>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`bg-${module.color} text-white rounded-circle p-3 d-flex align-items-center justify-content-center shadow-sm`} style={{ width: '56px', height: '56px' }}>
                                                <i className={`bi ${module.icon} fs-3`}></i>
                                            </div>
                                            <div>
                                                <h3 className="fw-bold mb-1 mt-0">{module.title}</h3>
                                                <p className="text-muted small mb-0">{module.description}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-body p-4 p-lg-5">
                                        {(module as any).impact && (
                                            <div className="mb-5 p-4 rounded-4 bg-success bg-opacity-10 border-start border-4 border-success animate-fade-in shadow-sm">
                                                <div className="d-flex align-items-center gap-2 mb-2 text-success">
                                                    <i className="bi bi-graph-up-arrow fs-5 fw-bold"></i>
                                                    <h6 className="fw-bold mb-0 text-uppercase small">Global Growth & Enterprise ROI Impact</h6>
                                                </div>
                                                <p className="text-dark mb-0 lh-lg">{(module as any).impact}</p>
                                            </div>
                                        )}
                                        <div className="row g-4">
                                            {module.sections.map((section, idx) => (
                                                <div key={idx} className="col-md-6 text-dark">
                                                    <div className="p-4 border rounded-4 h-100 hover-border-primary transition-all bg-white">
                                                        <h5 className="fw-bold mb-3">{section.name}</h5>
                                                        <p className="text-muted small mb-0 lh-lg">{section.content}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="card-footer bg-light border-0 px-4 py-3 text-end">
                                        <button className="btn btn-link btn-sm text-decoration-none fw-bold" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                                            Top <i className="bi bi-arrow-up-short"></i>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .fw-extrabold { font-weight: 800; }
                .hover-bg-light:hover { background-color: #f8f9fa !important; }
                .transition-all { transition: all 0.2s ease-in-out; }
                .hover-border-primary:hover { border-color: var(--bs-primary) !important; transform: translateY(-3px); }
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                .shadow-hover { transition: box-shadow 0.3s ease; }
                .shadow-hover:hover { box-shadow: 0 1rem 3rem rgba(0,0,0,.1) !important; }
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 10px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #aaa; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </MainLayout >
    );
}
