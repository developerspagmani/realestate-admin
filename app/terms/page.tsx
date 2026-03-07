'use client';

import Link from "next/link";

export default function TermsPage() {
    return (
        <div className="bg-black text-white min-vh-100 font-inter p-5">
            <div className="container max-w-800 pt-5">
                <Link href="/" className="btn-outline-red mb-5 py-2 px-4 shadow-sm small fw-700">Back to Home</Link>
                <h1 className="display-4 fw-900 text-white mb-5 mt-5">Terms of <span className="text-red">Service</span></h1>
                <div className="glass-card p-5 opacity-80 small lh-lg">
                    <p className="mb-4">Last Updated: March 2026</p>
                    <p>By accessing or using the Virpanix platform ("Protocol"), you agree to be bound by these Terms of Service. If you are entering into this on behalf of a corporation, you represent you have the authority to bind that entity to the protocol specifications.</p>
                    <h4 className="fw-900 text-white mt-5">1. Authorized Use</h4>
                    <p>You may only use the platform for real estate portfolio management and marketing for legitimate property holdings. Unauthorized scrapping or data infiltration is prohibited.</p>
                    <h4 className="fw-900 text-white mt-5">2. Module Subscriptions</h4>
                    <p>Each module (WhatsApp API, SEO Engine, etc.) may have specific usage limits based on your subscription tier as defined in your plan specifications.</p>
                    <h4 className="fw-900 text-white mt-5">3. Ownership of Data</h4>
                    <p>You retain full ownership of all property metadata and lead information. We provide the intelligence layer to process this data for your exclusive benefit.</p>
                </div>
            </div>
            <style jsx>{`
        .max-w-800 { max-width: 800px; }
        .fw-900 { font-weight: 900; }
        .glass-card {
           background: rgba(255, 255, 255, 0.02);
           backdrop-filter: blur(12px);
           border: 1px solid rgba(255, 255, 255, 0.05);
           border-radius: 2rem;
        }
      `}</style>
        </div>
    );
}
