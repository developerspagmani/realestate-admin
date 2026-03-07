'use client';

import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div className="bg-black text-white min-vh-100 font-inter p-5">
            <div className="container max-w-800 pt-5">
                <Link href="/" className="btn-outline-red mb-5 py-2 px-4 shadow-sm small fw-700">Back to Home</Link>
                <h1 className="display-4 fw-900 text-white mb-5 mt-5">Privacy <span className="text-red">Protocol</span></h1>
                <div className="glass-card p-5 opacity-80 small lh-lg">
                    <p className="mb-4">Effective Date: March 2026</p>
                    <p>This Privacy Protocol describes how Virpanix ("we", "us", or "our") collects, uses, and shares information about you. We are committed to institutional-grade data security and absolute multi-tenant isolation.</p>
                    <h4 className="fw-900 text-white mt-5">1. Data Collection</h4>
                    <p>We collect information you provide directly to us (registration, social API connections, property data) and through automated telemetry to optimize terminal performance.</p>
                    <h4 className="fw-900 text-white mt-5">2. Security Integration</h4>
                    <p>All property-level data is encrypted at rest and in transit. Lead data is isolated at the tenant layer; no cross-tenant data leakage is possible by architectural design.</p>
                    <h4 className="fw-900 text-white mt-5">3. Third-Party Sync</h4>
                    <p>When you synchronize Meta Ads or WhatsApp API, we only process data necessary for the campaign functionality and lead attribution reporting.</p>
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
