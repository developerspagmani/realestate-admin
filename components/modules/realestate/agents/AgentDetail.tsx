'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { agentService, getAuthToken } from '@/app/services/api';
import { Agent } from '@/types';
import MainLayout from '@/components/MainLayout';
import Loader from '@/components/common/Loader';
import Image from 'next/image';
import Link from 'next/link';

interface PropertyAssignment {
    id: string;
    agentId: string;
    propertyId: string;
    commissionRate: number;
    isPrimary: boolean;
    property?: any;
}

interface LeadAssignment {
    id: string;
    agentId: string;
    leadId: string;
    status: number;
    isPrimary: boolean;
    lead?: any;
}

interface AgentDetailProps {
    mode: 'owner' | 'admin';
}

export default function AgentDetail({ mode }: AgentDetailProps) {
    const params = useParams();
    const router = useRouter();
    const agentId = params.id as string;
    const [agent, setAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState(true);
    const [properties, setProperties] = useState<PropertyAssignment[]>([]);
    const [leads, setLeads] = useState<LeadAssignment[]>([]);

    useEffect(() => {
        const loadAgentData = async () => {
            const token = getAuthToken();
            if (!token || !agentId) return;

            setLoading(true);
            try {
                // We need to get the specific agent. 
                // Since there might not be a direct "getAgentById" that returns everything, 
                // we might need to fetch from the list and find it, or use the detail endpoints.

                const [agentsRes, propRes, leadsRes] = await Promise.all([
                    agentService.getAgents(token, {}),
                    agentService.getAssignments(token, agentId),
                    agentService.getAgentLeads(token, agentId)
                ]);

                if (agentsRes.success && agentsRes.data) {
                    const found = agentsRes.data.agents.find((a: Agent) => a.id === agentId);
                    if (found) setAgent(found);
                }

                if (propRes.success) {
                    setProperties(propRes.data || []);
                }
                if (leadsRes.success) {
                    setLeads(leadsRes.data || []);
                }
            } catch (error) {
                console.error('Failed to load agent details', error);
            } finally {
                setLoading(false);
            }
        };

        loadAgentData();
    }, [agentId]);

    const backUrl = mode === 'admin' ? '/realestate-admin/agents' : '/realestate-owner-admin/agents';

    if (loading) {
        return (
            <MainLayout activePage="agents">
                <div className="container-fluid p-5 text-center">
                    <Loader message="Loading agent profile..." />
                </div>
            </MainLayout>
        );
    }

    if (!agent) {
        return (
            <MainLayout activePage="agents">
                <div className="container-fluid p-5 text-center">
                    <h5 className="text-muted">Agent not found</h5>
                    <Link href={backUrl} className="btn btn-primary mt-3">Back to Agents</Link>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout activePage="agents">
            <div className="container-fluid p-4">
                <div className="mb-4">
                    <Link href={backUrl} className="btn btn-link text-decoration-none p-0 text-muted mb-3 d-flex align-items-center gap-2">
                        <i className="bi bi-arrow-left"></i> Back to Agents
                    </Link>
                    <div className="d-flex justify-content-between align-items-end">
                        <div className="d-flex align-items-center">
                            <div className="avatar bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-4 shadow-sm" style={{ width: '100px', height: '100px', fontSize: '2.5rem' }}>
                                {agent.user?.firstName?.[0]}{agent.user?.lastName?.[0]}
                            </div>
                            <div>
                                <h1 className="fw-bold mb-1 text-dark">{agent.user?.firstName} {agent.user?.lastName}</h1>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                    <span className="badge bg-primary-subtle text-primary rounded-4 px-3">Agent ID: {agent.id.substring(0, 8)}</span>
                                    <span className={`badge rounded-4 ${agent.status === 1 ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                                        {agent.status === 1 ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div className="d-flex gap-4 text-muted">
                                    <span><i className="bi bi-envelope me-1"></i> {agent.user?.email}</span>
                                    <span><i className="bi bi-telephone me-1"></i> {agent.user?.phone}</span>
                                </div>
                            </div>
                        </div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-outline-primary rounded-3 px-4" onClick={() => router.push(`${backUrl}?edit=${agent.id}`)}>
                                <i className="bi bi-pencil me-2"></i> Edit Account
                            </button>
                        </div>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Left Column: Info & Stats */}
                    <div className="col-lg-4">
                        <div className="card border-0 shadow-sm rounded-4 mb-4">
                            <div className="card-body p-4">
                                <h6 className="fw-bold mb-4 border-bottom pb-2">Profile Information</h6>
                                <div className="mb-4">
                                    <label className="small text-muted text-uppercase mb-1 fw-bold d-block">Specialization</label>
                                    <div className="p-3 bg-light rounded-3 fw-medium">{agent.specialization || 'General Agent'}</div>
                                </div>
                                <div className="mb-4">
                                    <label className="small text-muted text-uppercase mb-1 fw-bold d-block">Commission Rate</label>
                                    <div className="p-3 bg-success-subtle text-success rounded-3 fw-bold fs-4">{agent.commissionRate}%</div>
                                </div>
                                <div>
                                    <label className="small text-muted text-uppercase mb-1 fw-bold d-block">Member Since</label>
                                    <div className="p-3 bg-light rounded-3 fw-medium">{new Date(agent.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 bg-primary text-white">
                            <div className="card-body p-4">
                                <h6 className="text-white fw-bold mb-4 border-bottom border-white border-opacity-25 pb-2">Performance Metrics</h6>
                                <div className="row text-center g-0">
                                    <div className="col-6 border-end border-white border-opacity-25">
                                        <div className="display-6 fw-bold mb-0">{agent.totalLeads}</div>
                                        <div className="small text-white text-opacity-75 text-uppercase fw-bold">Leads</div>
                                    </div>
                                    <div className="col-6">
                                        <div className="display-6 fw-bold mb-0">{agent.totalDeals}</div>
                                        <div className="small text-white text-opacity-75 text-uppercase fw-bold">Deals</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Assigned Items */}
                    <div className="col-lg-8">
                        {/* Properties */}
                        <div className="card border-0 shadow-sm rounded-4 mb-4">
                            <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Assigned Properties ({properties.length})</h5>
                                <Link href={`${backUrl}?assign=properties&agentId=${agent.id}`} className="btn btn-sm btn-primary rounded-4 px-3">
                                    <i className="bi bi-plus"></i> Manage
                                </Link>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light small text-uppercase">
                                            <tr>
                                                <th className="ps-4">Property</th>
                                                <th>Location</th>
                                                <th className="text-center">Rate</th>
                                                <th className="pe-4 text-end">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {properties.length === 0 ? (
                                                <tr><td colSpan={4} className="text-center py-5 text-muted">No properties assigned</td></tr>
                                            ) : (
                                                properties.map(assign => (
                                                    <tr key={assign.id}>
                                                        <td className="ps-4 py-3">
                                                            <div className="d-flex align-items-center">
                                                                <div className="rounded-3 bg-light me-3 position-relative overflow-hidden" style={{ width: '48px', height: '48px' }}>
                                                                    {assign.property?.mainImage?.url ? (
                                                                        <Image src={assign.property.mainImage.url} alt="" fill className="object-fit-cover" />
                                                                    ) : <i className="bi bi-building text-muted m-auto"></i>}
                                                                </div>
                                                                <div className="fw-bold">{assign.property?.title}</div>
                                                            </div>
                                                        </td>
                                                        <td>{assign.property?.city}, {assign.property?.state}</td>
                                                        <td className="text-center"><span className="badge bg-success-subtle text-success">{assign.commissionRate}%</span></td>
                                                        <td className="pe-4 text-end">
                                                            {assign.isPrimary ? <span className="small fw-bold text-primary">PRIMARY</span> : <span className="small text-muted">AGENT</span>}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Leads */}
                        <div className="card border-0 shadow-sm rounded-4">
                            <div className="card-header bg-white p-4 border-0 d-flex justify-content-between align-items-center">
                                <h5 className="fw-bold mb-0">Assigned Leads ({leads.length})</h5>
                                <Link href={`${backUrl}?assign=leads&agentId=${agent.id}`} className="btn btn-sm btn-primary rounded-4 px-3">
                                    <i className="bi bi-plus"></i> Manage
                                </Link>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light small text-uppercase">
                                            <tr>
                                                <th className="ps-4">Lead</th>
                                                <th>Contact</th>
                                                <th>Status</th>
                                                <th className="pe-4 text-end">Type</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leads.length === 0 ? (
                                                <tr><td colSpan={4} className="text-center py-5 text-muted">No leads assigned</td></tr>
                                            ) : (
                                                leads.map(assign => (
                                                    <tr key={assign.id}>
                                                        <td className="ps-4 py-3">
                                                            <div className="d-flex align-items-center">
                                                                <div className="rounded-circle bg-primary-subtle text-primary me-3 d-flex align-items-center justify-content-center fw-bold" style={{ width: '36px', height: '36px' }}>
                                                                    {assign.lead?.name?.[0]}
                                                                </div>
                                                                <div className="fw-bold">{assign.lead?.name}</div>
                                                            </div>
                                                        </td>
                                                        <td className="small text-muted">{assign.lead?.email}</td>
                                                        <td>
                                                            <span className={`badge bg-${assign.status === 1 ? 'success' : 'secondary'}-subtle text-${assign.status === 1 ? 'success' : 'secondary'}`}>
                                                                {assign.status === 1 ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </td>
                                                        <td className="pe-4 text-end text-muted small">
                                                            {assign.isPrimary ? 'Primary' : 'Support'}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
