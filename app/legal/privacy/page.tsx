import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import PublicFontInter from '@/components/common/PublicFontInter';

export const metadata: Metadata = {
    title: 'Privacy Policy | Virpanix',
    description: 'Privacy policy and data handling practices for Virpanix.',
};

export default function PrivacyPolicy() {
    return (
        <div className="min-vh-100 bg-white text-dark py-5">
            <PublicFontInter />
            <div className="container" style={{ maxWidth: '800px' }}>
                <div className="mb-5 text-center">
                    <h1 className="fw-bold display-5 mb-3">Privacy Policy</h1>
                    <p className="text-muted">Last Updated: February 19, 2026</p>
                    <div className="d-flex justify-content-center gap-3 mt-4">
                        <Link href="/legal/terms" className="text-primary text-decoration-none small fw-bold">Terms of Service</Link>
                        <span className="text-muted">•</span>
                        <Link href="/legal/data-deletion" className="text-primary text-decoration-none small fw-bold">Data Deletion</Link>
                    </div>
                </div>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">1. Introduction</h2>
                    <p>Welcome to Virpanix Real Estate Platform ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, and protect information when you use our platform, specifically concerning our social media integration features.</p>
                </section>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">2. Information We Collect from Meta (Facebook/Instagram)</h2>
                    <p>When you choose to connect your Meta Business accounts to our platform, we collect the following limited information via the Meta Graph API:</p>
                    <ul className="list-group list-group-flush mb-3">
                        <li className="list-group-item bg-transparent px-0 border-0">
                            <strong>• Basic Profile Information:</strong> Your Facebook User ID, Name, and Profile Picture.
                        </li>
                        <li className="list-group-item bg-transparent px-0 border-0">
                            <strong>• Page Management Data:</strong> A list of Facebook Pages and Instagram Business Accounts associated with your account.
                        </li>
                        <li className="list-group-item bg-transparent px-0 border-0">
                            <strong>• Access Tokens:</strong> Secure OAuth tokens required to perform actions on your behalf (such as scheduling posts).
                        </li>
                        <li className="list-group-item bg-transparent px-0 border-0">
                            <strong>• Engagement Metrics:</strong> Aggregate data such as like counts, comment counts, and reach for posts managed through our platform.
                        </li>
                    </ul>
                </section>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">3. How We Use Your Social Data</h2>
                    <p>We use the data collected from Meta solely for the following purposes:</p>
                    <ul className="mb-3">
                        <li>Allowing you to schedule and publish real estate listings directly to Facebook and Instagram.</li>
                        <li>Providing you with a "Showcase Preview" of how your content will look on social platforms.</li>
                        <li>Displaying live performance analytics so you can track the success of your marketing campaigns.</li>
                        <li>Managing the connection status of your social media accounts.</li>
                    </ul>
                    <div className="alert alert-info border-0 rounded-4">
                        <strong>Important:</strong> We do not sell your personal data or social media tokens to third parties. We do not use your data for advertising purposes outside of your direct interactions with our platform.
                    </div>
                </section>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">4. Data Storage and Security</h2>
                    <p>Your social media access tokens are stored in an encrypted format within our secure database. We implement industry-standard security measures to prevent unauthorized access, alteration, or disclosure of your information.</p>
                </section>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">5. Your Rights and Data Deletion</h2>
                    <p>You have full control over your social media data. You can disconnect your accounts at any time through the "Connected Accounts" dashboard. Upon disconnection, we immediately revoke and delete your access tokens from our active systems.</p>
                    <p>For more detailed instructions on how to request complete data removal, please visit our <Link href="/legal/data-deletion" className="text-primary fw-bold">Data Deletion Instructions</Link> page.</p>
                </section>

                <section className="mb-5">
                    <h2 className="h4 fw-bold border-bottom pb-2 mb-3">6. Contact Us</h2>
                    <p>If you have questions about this Privacy Policy, please contact us at:</p>
                    <p className="fw-bold mb-0">Virpanix Support Team</p>
                    <p className="text-primary">legal@virpanix.com</p>
                </section>

                <div className="border-top pt-4 mt-5 d-flex justify-content-between align-items-center">
                    <Link href="/" className="btn btn-outline-secondary rounded-pill btn-sm px-4">
                        <i className="bi bi-arrow-left me-2"></i> Back to Home
                    </Link>
                    <p className="mb-0 small text-muted">© 2026 Virpanix. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
