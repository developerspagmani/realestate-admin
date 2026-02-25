'use client';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { userService, getAuthToken } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import Loader from '@/components/common/Loader';

export default function AgentProfile() {
    const { user } = useAuthContext();
    const [profile, setProfile] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        bio: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (!user) return;

        setProfile({
            firstName: user.firstName || user.name.split(' ')[0] || '',
            lastName: user.lastName || user.name.split(' ').slice(1).join(' ') || '',
            email: user.email || '',
            phone: user.phone || '',
            bio: ''
        });
        setLoading(false);
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getAuthToken();
        if (!token) return;

        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await userService.updateProfile(token, {
                firstName: profile.firstName,
                lastName: profile.lastName,
                phone: profile.phone,
                name: `${profile.firstName} ${profile.lastName}`.trim()
            });

            if (res.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
            } else {
                setMessage({ type: 'danger', text: res.message || 'Failed to update profile' });
            }
        } catch (error) {
            console.error('Update error', error);
            setMessage({ type: 'danger', text: 'An error occurred while updating profile' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <MainLayout activePage="profile">
            <div className="container-fluid py-4">
                <div className="row justify-content-center">
                    <div className="col-lg-8">
                        <div className="mb-4">
                            <h4 className="fw-bold mb-1">My Profile</h4>
                            <p className="text-muted">Manage your personal information and contact details.</p>
                        </div>

                        {message.text && (
                            <div className={`alert alert-${message.type} border-0 rounded-4 mb-4 shadow-sm`}>
                                {message.text}
                            </div>
                        )}

                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                            <div className="card-body p-4 p-md-5">
                                <form onSubmit={handleSubmit}>
                                    <div className="row g-4">
                                        <div className="col-md-6">
                                            <label className="form-label small text-uppercase fw-bold text-muted">First Name</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg border-0 bg-light"
                                                value={profile.firstName}
                                                onChange={e => setProfile({ ...profile, firstName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label small text-uppercase fw-bold text-muted">Last Name</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-lg border-0 bg-light"
                                                value={profile.lastName}
                                                onChange={e => setProfile({ ...profile, lastName: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small text-uppercase fw-bold text-muted">Email Address</label>
                                            <input
                                                type="email"
                                                className="form-control form-control-lg border-0 bg-light opacity-75"
                                                value={profile.email}
                                                readOnly
                                                disabled
                                            />
                                            <div className="form-text small">Email cannot be changed once verification is complete.</div>
                                        </div>
                                        <div className="col-md-12">
                                            <label className="form-label small text-uppercase fw-bold text-muted">Phone Number</label>
                                            <input
                                                type="tel"
                                                className="form-control form-control-lg border-0 bg-light"
                                                value={profile.phone}
                                                onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-12 mt-5 text-end">
                                            <button type="submit" className="btn btn-primary px-5 py-3 rounded-4 fw-bold shadow-sm" disabled={saving || loading}>
                                                {saving ? (
                                                    <Loader size="sm" message="Saving..." />
                                                ) : 'Save Changes'}
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
