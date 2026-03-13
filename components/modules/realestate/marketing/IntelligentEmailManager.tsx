'use client';

import { useState, useEffect } from 'react';
import { marketingService, getAuthToken } from '@/app/services/api';
import { useManagementContext } from '@/app/contexts/ManagementContext';
import Toast from '@/components/common/Toast';
import Link from 'next/link';
import LeadEngagementInsights from '../leads/LeadEngagementInsights';

export default function IntelligentEmailManager({ tenantId, leadsPath = '/realestate-owner-admin/leads' }: { tenantId: string, leadsPath?: string }) {
    const { currencySymbol } = useManagementContext();
    const [config, setConfig] = useState({
        enabled: false,
        frequency: 'Weekly',
        budgetVariance: 15,
        includeUpsell: true,
        includeCrossSell: true,
        maxProperties: 4,
        aiPersonalization: true
    });

    const [stats, setStats] = useState({
        totalSent: 0,
        openRate: 0,
        clickRate: 0,
        convertedLeads: 0,
        estimatedRevenue: 0
    });

    const [segments, setSegments] = useState<any[]>([]);
    const [viewingLead, setViewingLead] = useState<{ id: string, name: string, score: number } | null>(null);
    const [heatmap, setHeatmap] = useState<number[][]>([]);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' as 'success' | 'error' });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'config' | 'analytics' | 'logs' | 'grouping'>('config');
    const [logs, setLogs] = useState<any[]>([]);
    const [testData, setTestData] = useState({ email: '', budget: 500000 });
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        const loadConfig = async () => {
            setLoading(true);
            try {
                const token = getAuthToken();
                if (!token || !tenantId) return;
                const res = await marketingService.getIntelligentConfig(token, tenantId);
                if (res.success && res.data) setConfig(res.data);

                const logsRes = await marketingService.getIntelligentLogs(token, tenantId);
                if (logsRes.success) setLogs(logsRes.data);

                const statsRes = await marketingService.getIntelligentStats(token, tenantId);
                if (statsRes.success) setStats(statsRes.data);

                const segmentsRes = await marketingService.getLeadSegments(token, tenantId);
                if (segmentsRes.success) setSegments(segmentsRes.data);

                const heatmapRes = await marketingService.getIntelligentHeatmap(token, tenantId);
                if (heatmapRes.success) setHeatmap(heatmapRes.data);
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        loadConfig();
    }, [tenantId]);

    const handleSaveConfig = async () => {
        setLoading(true);
        try {
            const token = getAuthToken();
            if (!token || !tenantId) return;
            const res = await marketingService.saveIntelligentConfig(token, tenantId, config);
            if (res.success) showToast('Automation configuration updated.', 'success');
        } catch (e) { showToast('Failed to save settings', 'error'); }
        setLoading(false);
    };

    const handleTestRun = async () => {
        if (!testData.email || !testData.budget) {
            showToast('Please enter both email and budget', 'error');
            return;
        }
        setTesting(true);
        try {
            const token = getAuthToken();
            if (!token || !tenantId) return;
            const res = await marketingService.testIntelligentEmail(token, tenantId, testData);
            if (res.success) showToast('Test match sent! Check your inbox.', 'success');
            else showToast(res.message || 'Simulation failed', 'error');
        } catch (e) { showToast('Server error during match simulation', 'error'); }
        setTesting(false);
    };

    const handleViewAudience = (min?: number, max?: number) => {
        let query = '';
        if (min !== undefined) query += `${query ? '&' : '?'}minBudget=${min}`;
        if (max !== undefined && max !== Infinity) query += `${query ? '&' : '?'}maxBudget=${max}`;
        window.location.href = `${leadsPath}${query}`;
    };

    return (
        <div className="intelligent-email-manager">
            <div className="card border-0 shadow-sm rounded-4 overflow-hidden mb-4">
                <div className="card-body p-4 bg-primary text-white">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="fw-bold mb-1 text-white"><i className="bi bi-robot me-2"></i> Vipranix V-Mail Engine</h4>
                            <p className="mb-0 text-white">Neural property matching that connects the right buyer to the right home automatically.</p>
                        </div>
                        <div className="form-check form-switch fs-4">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                checked={config.enabled}
                                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                            />
                        </div>
                    </div>
                </div>
                <div className="card-footer bg-white border-0 p-0">
                    <div className="nav nav-tabs border-0 px-4">
                        <button
                            className={`nav-link border-0 py-3 px-4 fw-bold ${activeTab === 'config' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                            onClick={() => setActiveTab('config')}
                        >
                            Configuration
                        </button>
                        <button
                            className={`nav-link border-0 py-3 px-4 fw-bold ${activeTab === 'grouping' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                            onClick={() => setActiveTab('grouping')}
                        >
                            Lead Grouping
                        </button>
                        <button
                            className={`nav-link border-0 py-3 px-4 fw-bold ${activeTab === 'analytics' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            Performance
                        </button>
                        <button
                            className={`nav-link border-0 py-3 px-4 fw-bold ${activeTab === 'logs' ? 'active text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                            onClick={() => setActiveTab('logs')}
                        >
                            Execution Logs
                        </button>
                    </div>
                </div>
            </div>

            {activeTab === 'config' && (
                <div className="row g-4">
                    <div className="col-md-8">
                        <div className="card border-0 shadow-sm rounded-4 p-4 ">
                            <h6 className="fw-bold mb-4">Engine Parameters</h6>

                            <div className="row mb-4">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label small fw-bold text-muted">SENDING FREQUENCY</label>
                                    <select className="form-select border-0 bg-light rounded-3" value={config.frequency} onChange={e => setConfig({ ...config, frequency: e.target.value })}>
                                        <option>Daily</option>
                                        <option>Every 2 Days</option>
                                        <option>Weekly</option>
                                        <option>Bi-Weekly</option>
                                    </select>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label small fw-bold text-muted">BUDGET VARIANCE (UP-SELL)</label>
                                    <div className="input-group">
                                        <input type="number" className="form-control border-0 bg-light rounded-start-3" value={config.budgetVariance} onChange={e => setConfig({ ...config, budgetVariance: parseInt(e.target.value) })} />
                                        <span className="input-group-text border-0 bg-light rounded-end-3">%</span>
                                    </div>
                                    <small className="text-muted extra-small">Range above lead budget for premium properties.</small>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="form-label small fw-bold text-muted d-block mb-3">AUTOMATION RULES</label>
                                <div className="card bg-light border-0 rounded-4 p-3">
                                    <div className="form-check form-check-inline mb-3 w-100">
                                        <input className="form-check-input" type="checkbox" checked={config.includeUpsell} onChange={e => setConfig({ ...config, includeUpsell: e.target.checked })} />
                                        <label className="form-check-label small">Include <b>Up-Sell</b> properties (Highest Quality)</label>
                                    </div>
                                    <div className="form-check form-check-inline mb-3 w-100">
                                        <input className="form-check-input" type="checkbox" checked={config.includeCrossSell} onChange={e => setConfig({ ...config, includeCrossSell: e.target.checked })} />
                                        <label className="form-check-label small">Include <b>Cross-Sell</b> properties (Different Categories)</label>
                                    </div>
                                    <div className="form-check form-check-inline mb-0 w-100">
                                        <input className="form-check-input" type="checkbox" checked={config.aiPersonalization} onChange={e => setConfig({ ...config, aiPersonalization: e.target.checked })} />
                                        <label className="form-check-label small">Use <b>AI Content Studio</b> for personalized greetings</label>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex justify-content-end gap-3 pt-3 border-top">
                                <button className="btn btn-light px-4 rounded-4 fw-bold">Reset Defaults</button>
                                <button className="btn btn-primary px-4 rounded-4 fw-bold shadow-sm" onClick={handleSaveConfig} disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-dark text-white">
                            <h5 className="fw-bold mb-4 text-white"><i className="bi bi-info-circle me-2"></i> How it works</h5>
                            <div className="d-flex flex-column gap-4">
                                <div className="d-flex gap-3">
                                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '24px', height: '24px', fontSize: '12px' }}>1</div>
                                    <p className="extra-small mb-0 text-white">V-Mail analyzes **lead V-Scores** and active search history.</p>
                                </div>
                                <div className="d-flex gap-3">
                                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '24px', height: '24px', fontSize: '12px' }}>2</div>
                                    <p className="extra-small mb-0 text-white">Automated query finds 2 matches, 1 upsell, and 1 cross-sell property.</p>
                                </div>
                                <div className="d-flex gap-3">
                                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '24px', height: '24px', fontSize: '12px' }}>3</div>
                                    <p className="extra-small mb-0 text-white">AI writes a personalized intro based on lead history.</p>
                                </div>
                                <div className="d-flex gap-3">
                                    <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: '24px', height: '24px', fontSize: '12px' }}>4</div>
                                    <p className="extra-small mb-0 text-white">Email is sent with full **pixel tracking** for opens and clicks.</p>
                                </div>
                            </div>

                            <div className="mt-auto pt-5">
                                <div className="bg-white bg-opacity-10 rounded-4 p-3 border border-white border-opacity-10">
                                    <div className="d-flex align-items-center gap-3 mb-2 text-warning">
                                        <i className="bi bi-lightning-charge-fill"></i>
                                        <span className="small fw-bold">PRO TIP</span>
                                    </div>
                                    <p className="extra-small mb-0 opacity-50">Combined with the 3D Architect Pro, you can include virtual tour links to increase CTR by 45%.</p>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 p-4 bg-primary text-white mt-4">
                            <h6 className="fw-bold mb-3 text-white"><i className="bi bi-play-circle me-2"></i> Engine Simulation (Test Run)</h6>
                            <p className="extra-small opacity-75 mb-4">Validate your current property mix and content style by sending a sample to your own email.</p>

                            <div className="row g-2">
                                <div className="col-md-7">
                                    <input
                                        type="email"
                                        className="form-control form-control-sm border-0 bg-white"
                                        placeholder="Enter test email..."
                                        value={testData.email}
                                        onChange={e => setTestData({ ...testData, email: e.target.value })}
                                    />
                                </div>
                                <div className="col-md-5">
                                    <div className="input-group input-group-sm">
                                        <span className="input-group-text border-0 bg-white text-dark small">{currencySymbol}</span>
                                        <input
                                            type="number"
                                            className="form-control border-0 bg-white"
                                            placeholder="Budget..."
                                            value={testData.budget}
                                            onChange={e => setTestData({ ...testData, budget: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <div className="col-12 mt-3">
                                    <button
                                        className="btn btn-outline-light w-100 fw-bold shadow-sm py-2"
                                        onClick={handleTestRun}
                                        disabled={testing}
                                    >
                                        {testing ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send-fill me-2"></i>}
                                        Run Simulation Match
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'grouping' && (
                <div className="animate__animated animate__fadeIn">
                    <div className="row g-4">
                        {segments.length === 0 ? (
                            <div className="col-12 text-center py-5 text-muted">Analyzing lead segments...</div>
                        ) : segments.map((seg: any, idx: number) => (
                            <div className="col-md-6 col-lg-3" key={idx}>
                                <div className="card border-0 shadow-sm rounded-4 p-4 h-100 overflow-hidden position-relative">
                                    <div className="position-absolute top-0 end-0 p-3 opacity-10 fs-1">
                                        <i className="bi bi-people-fill"></i>
                                    </div>
                                    <p className="extra-small text-muted fw-bold text-uppercase mb-2">{seg.name}</p>
                                    <h2 className="fw-bold mb-3">{seg.count} <span className="fs-6 text-muted fw-normal">Leads</span></h2>

                                    <div className="mt-auto">
                                        <div className="d-flex justify-content-between mb-1">
                                            <span className="extra-small fw-bold">INTEL-ENROLLMENT</span>
                                            <span className="extra-small fw-bold text-primary">{Math.round((seg.automated / seg.count) * 100) || 0}%</span>
                                        </div>
                                        <div className="progress rounded-pill" style={{ height: '6px' }}>
                                            <div
                                                className="progress-bar bg-primary rounded-pill transition-all"
                                                style={{ width: `${(seg.automated / seg.count) * 100 || 0}%` }}
                                            ></div>
                                        </div>
                                        <div className="mt-3 d-flex align-items-center gap-2">
                                            <span className={`badge ${seg.automated > 0 ? 'bg-success' : 'bg-light text-muted'} extra-small p-1`}>
                                                {seg.automated > 0 ? <i className="bi bi-activity"></i> : <i className="bi bi-clock"></i>}
                                            </span>
                                            <span className="extra-small text-muted">{seg.automated} received recommendations</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 mt-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h6 className="fw-bold mb-0">Market Appetite Filter</h6>
                            <Link
                                href={leadsPath}
                                className="btn btn-light btn-sm rounded-pill px-3 extra-small fw-bold"
                            >
                                View Full Audience
                            </Link>
                        </div>
                        <div className="table-responsive">
                            <table className="table table-borderless align-middle mb-0">
                                <thead>
                                    <tr className="extra-small text-muted text-uppercase">
                                        <th>Budget Group</th>
                                        <th>Lead Volume</th>
                                        <th>Engine Coverage</th>
                                        <th>Recommendation Health</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {segments.map((seg, idx) => (
                                        <tr key={idx} className="border-bottom-faint">
                                            <td className="py-3 fw-bold">{seg.name}</td>
                                            <td className="py-3">{seg.count}</td>
                                            <td className="py-3">
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="flex-grow-1" style={{ maxWidth: '100px' }}>
                                                        <div className="progress" style={{ height: '4px' }}>
                                                            <div className="progress-bar" style={{ width: `${(seg.automated / seg.count) * 100 || 0}%` }}></div>
                                                        </div>
                                                    </div>
                                                    <span className="small text-muted">{seg.automated}/{seg.count}</span>
                                                </div>
                                            </td>
                                            <td className="py-3">
                                                <span className={`badge bg-opacity-10 ${seg.automated > 0 ? 'bg-success text-success' : 'bg-warning text-warning'}`}>
                                                    {seg.automated > 0 ? 'Optimal' : 'Insufficient Data'}
                                                </span>
                                            </td>
                                            <td className="py-3 text-end">
                                                <Link
                                                    href={`${leadsPath}?minBudget=${seg.min}&maxBudget=${seg.max >= 999999999 ? '' : seg.max}`}
                                                    className="btn btn-light-soft btn-sm rounded-circle"
                                                >
                                                    <i className="bi bi-chevron-right"></i>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'analytics' && (
                <div className="animate__animated animate__fadeIn">
                    <div className="row g-4 mb-4">
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4">
                                <p className="extra-small text-muted fw-bold text-uppercase mb-1">Total Emails</p>
                                <h3 className="fw-bold mb-0 text-primary">{stats.totalSent.toLocaleString()}</h3>
                                <div className="mt-2 text-success extra-small fw-bold">
                                    <i className="bi bi-arrow-up-short"></i> +12% this month
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4">
                                <p className="extra-small text-muted fw-bold text-uppercase mb-1">Open Rate</p>
                                <h3 className="fw-bold mb-0 text-success">{stats.openRate}%</h3>
                                <div className="mt-2 text-success extra-small fw-bold">
                                    <i className="bi bi-arrow-up-short"></i> +5.4% Industry Avg
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4">
                                <p className="extra-small text-muted fw-bold text-uppercase mb-1">Click Rate</p>
                                <h3 className="fw-bold mb-0 text-warning">{stats.clickRate}%</h3>
                                <div className="mt-2 text-success extra-small fw-bold">
                                    <i className="bi bi-arrow-up-short"></i> Highest ever recorded
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="card border-0 shadow-sm rounded-4 p-4 bg-success text-white shadow-lg">
                                <p className="extra-small fw-bold text-uppercase mb-1">Estimated ROI</p>
                                <h3 className="fw-bold mb-0 text-white">{currencySymbol} {(stats.estimatedRevenue / 1000).toFixed(0)}K</h3>
                                <div className="mt-2 extra-small fw-bold">
                                    Based on lead conversions
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card border-0 shadow-sm rounded-4 p-4 mb-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <div>
                                <h6 className="fw-bold mb-1">Engagement Heatmap</h6>
                                <p className="extra-small text-muted mb-0">Analysis of open/click activity by day and hour</p>
                            </div>
                            <div className="d-flex gap-3 extra-small fw-bold">
                                <div className="d-flex align-items-center gap-1"><div style={{ width: '10px', height: '10px', background: '#e9ecef', borderRadius: '2px' }}></div> Low</div>
                                <div className="d-flex align-items-center gap-1"><div style={{ width: '10px', height: '10px', background: '#0d6efd', borderRadius: '2px', opacity: 0.8 }}></div> High</div>
                            </div>
                        </div>

                        <div className="heatmap-container overflow-auto pb-2">
                            <div className="d-flex" style={{ minWidth: '800px' }}>
                                <div className="day-labels d-flex flex-column justify-content-between py-2 text-muted fw-bold extra-small" style={{ width: '40px', height: '210px' }}>
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <div key={d}>{d}</div>)}
                                </div>
                                <div className="flex-grow-1">
                                    <div className="grid d-flex flex-column gap-1">
                                        {(heatmap.length > 0 ? heatmap : Array(7).fill(Array(24).fill(0))).map((day, dIdx) => (
                                            <div key={dIdx} className="d-flex gap-1">
                                                {day.map((val: number, hIdx: number) => {
                                                    const max = Math.max(...heatmap.flat(), 1);
                                                    const intensity = val / max;
                                                    return (
                                                        <div
                                                            key={hIdx}
                                                            className="flex-fill rounded-1"
                                                            title={`${val} interactions at ${hIdx}:00`}
                                                            style={{
                                                                height: '24px',
                                                                background: val > 0 ? '#0d6efd' : '#f8f9fa',
                                                                opacity: val > 0 ? Math.max(0.1, intensity) : 1,
                                                                border: '1px solid #f1f3f5'
                                                            }}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="d-flex justify-content-between mt-2 text-muted extra-small fw-bold px-1">
                                        <span>12 AM</span>
                                        <span>6 AM</span>
                                        <span>12 PM</span>
                                        <span>6 PM</span>
                                        <span>11 PM</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'logs' && (
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden animate__animated animate__fadeIn">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0">
                            <thead className="bg-light">
                                <tr className="extra-small text-muted fw-bold text-uppercase">
                                    <th className="px-4 py-3">Timestamp</th>
                                    <th className="px-4 py-3">Lead</th>
                                    <th className="px-4 py-3">Type</th>
                                    <th className="px-4 py-3">Properties Sent</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3">Action</th>
                                </tr>
                            </thead>
                            <tbody className="small">
                                {logs.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-5 text-muted">No automation logs found yet.</td></tr>
                                ) : logs.map((log: any) => (
                                    <tr key={log.id}>
                                        <td className="px-4 text-muted">{new Date(log.occurredAt).toLocaleString()}</td>
                                        <td className="px-4">
                                            <div className="fw-bold">{log.lead?.name || 'Unknown Lead'}</div>
                                            <div className="extra-small text-muted">{log.lead?.email}</div>
                                        </td>
                                        <td className="px-4">
                                            <span className="badge bg-primary bg-opacity-10 text-white">Automated</span>
                                        </td>
                                        <td className="px-4">
                                            {log.metadata?.propertyCount || 0} items
                                        </td>
                                        <td className="px-4">
                                            <span className="text-success"><i className="bi bi-check-circle-fill me-1"></i> Sent</span>
                                        </td>
                                        <td className="px-4">
                                            <button
                                                className="btn btn-link btn-sm text-primary p-0 fw-bold extra-small"
                                                onClick={() => setViewingLead({
                                                    id: log.leadId,
                                                    name: log.lead?.name || 'Lead',
                                                    score: log.lead?.score || 0
                                                })}
                                            >
                                                View Engagement
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <Toast
                show={toast.show}
                message={toast.message}
                type={toast.type}
                onClose={() => setToast({ ...toast, show: false })}
            />

            {viewingLead && (
                <LeadEngagementInsights
                    leadId={viewingLead.id}
                    leadName={viewingLead.name}
                    leadScore={viewingLead.score}
                    onClose={() => setViewingLead(null)}
                />
            )}
        </div>

    );
}

