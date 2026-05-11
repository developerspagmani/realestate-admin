'use client';

import { useState, useEffect } from 'react';
import { tenantService, propertyService, getAuthToken } from '@/app/services/api';
import ChatbotWidget from './ChatbotWidget';
import { useAuthContext } from '@/app/contexts/AuthContext';
import Toast from '@/components/common/Toast';
import Loader from '@/components/common/Loader';

interface ChatbotConfigManagerProps {
    propertyId?: string; // Optional now, for global mode it's empty
    onClose: () => void;
}

export default function ChatbotConfigManager({ propertyId, onClose }: ChatbotConfigManagerProps) {
    const { user } = useAuthContext();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'general' | 'flow' | 'personality' | 'leads' | 'sales'>('general');
    const [properties, setProperties] = useState<any[]>([]);
    const [tenant, setTenant] = useState<any>(null);

    const [config, setConfig] = useState<any>({
        enabled: true,
        aiEnabled: false,
        primaryColor: '#0d6efd',
        welcomeMessage: "Looking for a new home?",
        welcomeSubtext: "I can find the perfect properties in seconds based on your specific requirements.",
        configVersion: '1.0',
        aiName: 'Virpa',
        aiPersonality: 'Professional, helpful, and slightly enthusiastic.',
        aiGuidelines: 'Only provide information based on property context. Keep responses concise.',
        leadCaptureMode: 'both', // 'email', 'mobile', 'both'
        flow: ['LOCATION', 'CITY', 'BUDGET'],
        upsellEnabled: true,
        crossSellEnabled: true,
        recommendationLogic: 'price-match',
        budgetRanges: [
            { label: 'Low (< $1k)', min: 0, max: 1000 },
            { label: 'Mid ($1k - $5k)', min: 1000, max: 5000 },
            { label: 'High ($5k - $10k)', min: 5000, max: 10000 },
            { label: 'Luxury (> $10k)', min: 10000 }
        ]
    });

    const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'error' }>({
        show: false,
        message: '',
        type: 'success'
    });

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    useEffect(() => {
        loadData();
    }, [propertyId, user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const token = getAuthToken();
            if (!token || !user?.tenantId) return;

            // Load Tenant Settings for Global Config
            const res = await tenantService.getTenantById(token, user.tenantId);
            if (res.success && res.data) {
                setTenant(res.data);
                const globalConfig = res.data.settings?.chatbotConfig;
                if (globalConfig) {
                    setConfig((prev: any) => ({ ...prev, ...globalConfig }));
                }
            }

            // Load some properties for the preview (even in global mode)
            const propRes = await propertyService.getProperties(token, { limit: '5' });
            if (propRes.success) {
                setProperties(propRes.data?.properties || propRes.data || []);
            }

        } catch (error) {
            console.error('Failed to load configuration data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const token = getAuthToken();
            if (!token || !user?.tenantId) return;

            // Save to Tenant settings
            const updatedSettings = {
                ...(tenant?.settings || {}),
                chatbotConfig: config
            };

            const res = await tenantService.updateTenant(token, user.tenantId, {
                settings: updatedSettings
            });

            if (res.success) {
                // Refresh local tenant state
                setTenant({ ...tenant, settings: updatedSettings });
                showToast('Global chatbot configuration saved successfully!');
            } else {
                showToast(res.message || 'Failed to update configuration', 'error');
            }
        } catch (error) {
            console.error('Failed to save config:', error);
            showToast('Error saving configuration.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Loader message="Loading conversational AI configuration..." />;

    return (
        <div className="row g-4">
            <div className="col-lg-7">
                <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
                    <div className="card-header bg-white border-bottom p-4">
                        <div className="d-flex justify-content-between align-items-center">
                            <div>
                                <h5 className="fw-bold mb-1">Global AI Assistant Settings</h5>
                                <p className="text-muted small mb-0">Configure the default experience for all visitors across your platform.</p>
                            </div>
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-primary rounded-4 px-4 shadow-sm"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? 'Saving...' : 'Publish Globally'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="card-body p-0">
                        <ul className="nav nav-tabs nav-fill border-0 bg-light p-1">
                            {['general', 'personality', 'flow', 'leads', 'sales'].map((tab) => (
                                <li className="nav-item" key={tab}>
                                    <button
                                        className={`nav-link border-0 rounded-3 py-2 text-capitalize ${activeTab === tab ? 'bg-white shadow-sm text-primary fw-bold' : 'text-muted'}`}
                                        onClick={() => setActiveTab(tab as any)}
                                    >
                                        <i className={`bi ${tab === 'general' ? 'bi-sliders' : tab === 'personality' ? 'bi-person-badge' : tab === 'flow' ? 'bi-diagram-3' : tab === 'leads' ? 'bi-person-plus' : 'bi-graph-up'} me-2`}></i>
                                        {tab}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="p-4" style={{ minHeight: '500px' }}>
                            {activeTab === 'general' && (
                                <div className="animate-fade-in">
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small">Bot Theme Color</label>
                                        <div className="d-flex gap-3 align-items-center">
                                            <input
                                                type="color"
                                                className="form-control form-control-color border-0 p-0"
                                                value={config.primaryColor}
                                                onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                                            />
                                            <span className="font-monospace small text-muted">{config.primaryColor}</span>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small">Welcome Title</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-3"
                                            value={config.welcomeMessage}
                                            onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                                            placeholder="e.g. Looking for a new home?"
                                        />
                                    </div>
                                    <div className="mb-4">
                                        <label className="form-label fw-bold small">Welcome Subtext</label>
                                        <textarea
                                            className="form-control rounded-3"
                                            rows={3}
                                            value={config.welcomeSubtext}
                                            onChange={(e) => setConfig({ ...config, welcomeSubtext: e.target.value })}
                                            placeholder="e.g. I can find the perfect properties in seconds..."
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'personality' && (
                                <div className="animate-fade-in">
                                    <h6 className="fw-bold mb-3">AI Personality & Persona</h6>
                                    <p className="text-muted small mb-4">Define how your AI assistant should sound and behave during conversations.</p>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold small">Assistant Name</label>
                                        <div className="input-group shadow-sm rounded-3 overflow-hidden">
                                            <span className="input-group-text bg-white border-end-0"><i className="bi bi-robot text-primary"></i></span>
                                            <input
                                                type="text"
                                                className="form-control border-start-0 ps-0 py-2"
                                                value={config.aiName || 'Virpa'}
                                                onChange={(e) => setConfig({ ...config, aiName: e.target.value })}
                                                placeholder="e.g. Virpa"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <label className="form-label fw-bold small">Tone & Personality</label>
                                        <select 
                                            className="form-select rounded-3 mb-3 shadow-sm border-light"
                                            value={config.aiPersonality}
                                            onChange={(e) => setConfig({ ...config, aiPersonality: e.target.value })}
                                        >
                                            <option value="Professional, helpful, and slightly enthusiastic.">Professional & Enthusiastic (Recommended)</option>
                                            <option value="Direct, formal, and strictly factual.">Formal & Direct</option>
                                            <option value="Friendly, casual, and using warm language.">Casual & Friendly</option>
                                            <option value="Luxury-focused, sophisticated, and exclusive.">Luxury & Elite</option>
                                        </select>
                                        
                                        <label className="form-label fw-bold extra-small text-muted mb-2">Behavioral Guidelines</label>
                                        <textarea
                                            className="form-control rounded-4 shadow-sm border-light"
                                            rows={5}
                                            value={config.aiGuidelines}
                                            onChange={(e) => setConfig({ ...config, aiGuidelines: e.target.value })}
                                            placeholder="Enter specific behavioral guidelines (e.g., 'Never mention competitors', 'Always suggest a phone call')..."
                                            style={{ fontSize: '13px' }}
                                        />
                                    </div>

                                    <div className="card border-0 bg-primary-soft rounded-4 p-3 border-start border-primary border-4">
                                        <div className="d-flex align-items-center gap-2 mb-2 text-primary fw-bold small">
                                            <i className="bi bi-stars"></i> Pro Intelligence Tip
                                        </div>
                                        <p className="extra-small text-muted mb-0 lh-base">
                                            Keep instructions focused on business goals. For example: <span className="text-dark fw-semibold">"Always mention current 0% commission offers"</span> will help the AI drive more conversions.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'flow' && (
                                <div className="animate-fade-in">
                                    <h6 className="fw-bold mb-3">Default Conversation Steps</h6>

                                    <div className="card border-0 bg-primary-soft rounded-4 mb-4 p-3 border-start border-primary border-4">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div>
                                                <h6 className="fw-bold mb-1 text-primary"><i className="bi bi-robot me-2"></i> Neural AI Mode (Gemini 1.5)</h6>
                                                <p className="extra-small text-muted mb-0 pe-5">Enable conversational AI to answer free-text questions about your properties instead of using a static question flow.</p>
                                            </div>
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                                                    checked={config.aiEnabled}
                                                    onChange={(e) => setConfig({ ...config, aiEnabled: e.target.checked })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {!config.aiEnabled ? (
                                        <div className="animate-fade-in">
                                            <p className="text-muted small mb-4">Choose the questions the bot should ask by default to qualify leads.</p>

                                            {[
                                                { id: 'LOCATION', label: 'Preferred Location/Neighborhood', icon: 'bi-geo-alt' },
                                                { id: 'CITY', label: 'City Selection', icon: 'bi-building' },
                                                { id: 'BUDGET', label: 'Budget Range', icon: 'bi-cash-coin' },
                                                { id: 'BEDROOMS', label: 'Number of Bedrooms', icon: 'bi-door-closed' },
                                                { id: 'TYPE', label: 'Property Type (Apartment, Villa, etc)', icon: 'bi-house-heart' }
                                            ].map((step) => (
                                                <div key={step.id} className="d-flex align-items-center justify-content-between p-3 border rounded-4 mb-2 bg-white hover-shadow-sm transition-all">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="bg-light rounded-circle p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                                            <i className={`bi ${step.icon} text-primary`}></i>
                                                        </div>
                                                        <span className="fw-semibold small">{step.label}</span>
                                                    </div>
                                                    <div className="form-check form-switch">
                                                        <input
                                                            className="form-check-input"
                                                            type="checkbox"
                                                            style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                                                            checked={config.flow.includes(step.id)}
                                                            onChange={(e) => {
                                                                const newFlow = e.target.checked
                                                                    ? [...config.flow, step.id]
                                                                    : config.flow.filter((f: string) => f !== step.id);
                                                                setConfig({ ...config, flow: newFlow });
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}

                                            {config.flow.includes('BUDGET') && (
                                                <div className="mt-4 p-4 border rounded-4 bg-white animate-fade-in">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h6 className="fw-bold mb-0">Customize Budget Ranges</h6>
                                                        <button
                                                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                                            onClick={() => {
                                                                const newRanges = [...(config.budgetRanges || [])];
                                                                newRanges.push({ label: 'New Range', min: 0, max: 1000 });
                                                                setConfig({ ...config, budgetRanges: newRanges });
                                                            }}
                                                        >
                                                            <i className="bi bi-plus-lg me-1"></i> Add Range
                                                        </button>
                                                    </div>
                                                    <div className="row g-2">
                                                        {(config.budgetRanges || []).map((range: any, idx: number) => (
                                                            <div key={idx} className="col-12 p-3 bg-light rounded-3 mb-2">
                                                                <div className="row g-2 align-items-center">
                                                                    <div className="col-md-5">
                                                                        <label className="extra-small fw-bold text-muted mb-1">Label</label>
                                                                        <input
                                                                            type="text"
                                                                            className="form-control form-control-sm rounded-2"
                                                                            value={range.label}
                                                                            onChange={(e) => {
                                                                                const newRanges = [...config.budgetRanges];
                                                                                newRanges[idx].label = e.target.value;
                                                                                setConfig({ ...config, budgetRanges: newRanges });
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <label className="extra-small fw-bold text-muted mb-1">Min Price</label>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control form-control-sm rounded-2"
                                                                            value={range.min}
                                                                            onChange={(e) => {
                                                                                const newRanges = [...config.budgetRanges];
                                                                                newRanges[idx].min = Number(e.target.value);
                                                                                setConfig({ ...config, budgetRanges: newRanges });
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <label className="extra-small fw-bold text-muted mb-1">Max Price</label>
                                                                        <input
                                                                            type="number"
                                                                            className="form-control form-control-sm rounded-2"
                                                                            value={range.max}
                                                                            onChange={(e) => {
                                                                                const newRanges = [...config.budgetRanges];
                                                                                newRanges[idx].max = Number(e.target.value);
                                                                                setConfig({ ...config, budgetRanges: newRanges });
                                                                            }}
                                                                        />
                                                                    </div>
                                                                    <div className="col-md-1 d-flex align-items-end justify-content-center">
                                                                        <button
                                                                            className="btn btn-sm btn-outline-danger border-0 rounded-circle"
                                                                            onClick={() => {
                                                                                const newRanges = config.budgetRanges.filter((_: any, i: number) => i !== idx);
                                                                                setConfig({ ...config, budgetRanges: newRanges });
                                                                            }}
                                                                        >
                                                                            <i className="bi bi-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-5 animate-fade-in">
                                            <div className="bg-light rounded-circle p-4 d-inline-flex mb-3 shadow-sm border border-white">
                                                <i className="bi bi-cpu display-4 text-primary"></i>
                                            </div>
                                            <h6 className="fw-bold text-dark">Neural Core Active (Gemini 1.5 Flash)</h6>
                                            <p className="text-muted small px-5 mx-auto" style={{ maxWidth: '400px' }}>
                                                The assistant will now use generative AI to handle conversations.
                                                It will automatically answer questions about your property portfolio using deep learning.
                                            </p>
                                            <div className="mt-2">
                                                <span className="badge bg-success-soft text-success rounded-pill px-3 py-2 extra-small fw-bold border border-success border-opacity-10">
                                                    <i className="bi bi-check-circle-fill me-1"></i> READY TO CHAT
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'leads' && (
                                <div className="animate-fade-in">
                                    <h6 className="fw-bold mb-3">Global Lead Capture Settings</h6>
                                    <p className="text-muted small mb-4">Control what information is required across the system.</p>

                                    <div className="row g-3">
                                        {[
                                            { id: 'email', label: 'Email Only', desc: 'Higher quality leads, standard friction.' },
                                            { id: 'mobile', label: 'Mobile Only', desc: 'Best for WhatsApp marketing and quick follow-ups.' },
                                            { id: 'both', label: 'Both Email & Mobile', desc: 'Maximum data, highest friction.' }
                                        ].map((mode) => (
                                            <div key={mode.id} className="col-md-4">
                                                <div
                                                    className={`card h-100 border-2 rounded-4 cursor-pointer transition-all ${config.leadCaptureMode === mode.id ? 'border-primary bg-primary-soft' : 'border-light bg-light opacity-75'}`}
                                                    onClick={() => setConfig({ ...config, leadCaptureMode: mode.id })}
                                                >
                                                    <div className="card-body p-3 text-center">
                                                        <div className={`mb-2 fs-4 ${config.leadCaptureMode === mode.id ? 'text-primary' : 'text-muted'}`}>
                                                            <i className={`bi ${mode.id === 'email' ? 'bi-envelope' : mode.id === 'mobile' ? 'bi-phone' : 'bi-person-badge'}`}></i>
                                                        </div>
                                                        <h6 className="fw-bold small mb-1">{mode.label}</h6>
                                                        <p className="extra-small text-muted mb-0 lh-sm">{mode.desc}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-5 p-4 rounded-4 bg-light border border-dashed text-center">
                                        <i className="bi bi-shield-lock display-6 text-muted mb-3 d-block"></i>
                                        <h6 className="fw-bold small">Enterprise Lead Routing</h6>
                                        <p className="extra-small text-muted mb-0 px-5">Captured leads are automatically synchronized with your central CRM and assigned based on availability.</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'sales' && (
                                <div className="animate-fade-in">
                                    <h6 className="fw-bold mb-3">Sales & Conversion Engine</h6>
                                    <p className="text-muted small mb-4">Enable intelligent features across all properties to maximize portfolio performance.</p>

                                    <div className="list-group list-group-flush">
                                        <div className="list-group-item px-0 py-3 bg-transparent">
                                            <div className="d-flex justify-content-between">
                                                <div className="pe-4">
                                                    <h6 className="fw-bold small mb-1">Portfolio-wide Upselling</h6>
                                                    <p className="extra-small text-muted mb-0">Suggest premium units across the entire portfolio if they match user intent better.</p>
                                                </div>
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={config.upsellEnabled}
                                                        onChange={(e) => setConfig({ ...config, upsellEnabled: e.target.checked })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="list-group-item px-0 py-3 bg-transparent">
                                            <div className="d-flex justify-content-between">
                                                <div className="pe-4">
                                                    <h6 className="fw-bold small mb-1">Global Cross-Sell Recommendations</h6>
                                                    <p className="extra-small text-muted mb-0">Include centralized services (Maintenance, Legal, Financing) in all chat results.</p>
                                                </div>
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        checked={config.crossSellEnabled}
                                                        onChange={(e) => setConfig({ ...config, crossSellEnabled: e.target.checked })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <label className="form-label fw-bold small">Master Recommendation Logic</label>
                                        <select
                                            className="form-select rounded-3 small"
                                            value={config.recommendationLogic}
                                            onChange={(e) => setConfig({ ...config, recommendationLogic: e.target.value })}
                                        >
                                            <option value="price-match">Price-First (Cheapest matches)</option>
                                            <option value="newest">Fresh Entries (Newly listed properties)</option>
                                            <option value="featured">Featured First (Maximize impressions on VIP units)</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="col-lg-5">
                <div className="position-sticky" style={{ top: '24px' }}>
                    <div className="d-flex align-items-center gap-2 mb-3">
                        <span className="badge bg-primary-soft text-primary rounded-4 px-3 py-2 extra-small fw-bold">MASTER PREVIEW</span>
                        <span className="extra-small text-muted">Global configuration simulator</span>
                    </div>

                    <div className="iphone-frame shadow-2xl rounded-[3rem] border-[8px] border-dark bg-white overflow-hidden mx-auto" style={{ width: '320px', height: '640px', border: '12px solid #1e293b' }}>
                        <div className="iphone-screen h-100 position-relative bg-light">
                            <div className="bg-dark p-2 text-white d-flex justify-content-center" style={{ fontSize: '10px' }}>
                                <span>9:41 AM</span>
                            </div>

                            <div className="p-0 h-100">
                                <ChatbotWidget
                                    key={JSON.stringify(config)}
                                    theme={{ primaryColor: config.primaryColor }}
                                    properties={properties}
                                    onFilterResults={() => { }}
                                    onClose={() => { }}
                                    onSelectProperty={() => { }}
                                    onCreateLead={async () => { }}
                                    customWelcomeTitle={config.welcomeMessage}
                                    customWelcomeSubtext={config.welcomeSubtext}
                                    leadCaptureMode={config.leadCaptureMode}
                                    flow={config.flow}
                                    upsellEnabled={config.upsellEnabled}
                                    crossSellEnabled={config.crossSellEnabled}
                                    recommendationLogic={config.recommendationLogic}
                                    budgetRanges={config.budgetRanges}
                                    aiName={config.aiName}
                                    aiEnabled={config.aiEnabled}
                                    tenantId={user?.tenantId}
                                    previewMode={true}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .extra-small { font-size: 11px; }
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.08); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.08); }
                .cursor-pointer { cursor: pointer; }
                .transition-all { transition: all 0.3s ease; }
                .hover-shadow-sm:hover { transform: translateY(-2px); box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075); }
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                /* iPhone Simulator Styles */
                .iphone-frame {
                    position: relative;
                    border: 12px solid #1e293b;
                    border-radius: 3rem;
                    background: #fff;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    overflow: hidden;
                    transition: transform 0.3s ease;
                }
                .iphone-frame:hover {
                    transform: scale(1.01);
                }
                .iphone-screen {
                    height: 100%;
                    background: #f8fafc;
                    display: flex;
                    flex-direction: column;
                }
                .iphone-frame::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 40%;
                    height: 25px;
                    background: #1e293b;
                    border-bottom-left-radius: 1rem;
                    border-bottom-right-radius: 1rem;
                    z-index: 10;
                }
            `}</style>

            {toast.show && (
                <Toast
                    show={toast.show}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                />
            )}
        </div>
    );
}
