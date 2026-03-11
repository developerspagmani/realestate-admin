'use client';
import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import BrochureTemplate from './BrochureTemplate';
import { Property, Amenity, MediaItem } from '@/types';
import { CustomContact, SelectedImages, BrochureToggles } from './templates/types';

interface BrochureManagerProps {
    property: Property | null;
    properties?: Property[]; // Optional: List of properties to allow selection
    mode: 'admin' | 'owner';
    companyInfo?: { name?: string };
    show?: boolean;
    onClose?: () => void;
    onPropertyChange?: (propertyId: string) => void;
    allAmenities?: Amenity[];
    allMedia?: MediaItem[];
    isEmbedded?: boolean;
    fetching?: boolean;
}

export default function BrochureManager({ property, properties = [], mode, companyInfo, show, onClose, onPropertyChange, allAmenities = [], allMedia = [], isEmbedded = false, fetching = false }: BrochureManagerProps) {
    const [generating, setGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [fontStyle, setFontStyle] = useState("'Outfit', sans-serif");
    const [design, setDesign] = useState<'modern' | 'luxury' | 'classic' | 'elegant_landscape' | 'premium_landscape' | 'artistic'>('modern');
    const [accentColor, setAccentColor] = useState('#6366f1');
    const [textColor, setTextColor] = useState('#333333');
    const [currency, setCurrency] = useState('$');
    const [aiTagline, setAiTagline] = useState<string>('');
    const [aiDescription, setAiDescription] = useState<string>('');
    const [isAiLoading, setIsAiLoading] = useState(false);

    // Advanced Features State
    const [customContact, setCustomContact] = useState<CustomContact>({
        name: mode === 'owner' ? companyInfo?.name || 'RealEstate Agent' : 'Premium Estates',
        phone: '+1 (555) 000-0000',
        email: 'info@realestate.com',
        website: typeof window !== 'undefined' ? window.location.host : 'www.realestate.com'
    });

    const [selectedImages, setSelectedImages] = useState<SelectedImages>({
        cover: '',
        bg1: '',
        bg2: '',
        bg3: ''
    });

    const [toggles, setToggles] = useState<BrochureToggles>({
        showPrice: true,
        showAmenities: true,
        showQRCode: true,
        showStats: true
    });

    const [activeTab, setActiveTab] = useState<'design' | 'content' | 'images'>('design');
    const [lastPropId, setLastPropId] = useState<string | null>(null);

    // Reset state when property changes to avoid stale data
    React.useEffect(() => {
        if (property && property.id !== lastPropId) {
            setLastPropId(property.id);
            setAiTagline('');
            setAiDescription('');
            setSelectedImages({
                cover: property.mainImage?.url || '',
                bg1: '',
                bg2: '',
                bg3: ''
            });

            // Automatically trigger AI content for new property
            if (!isAiLoading) generateAiContent();
        }
    }, [property, lastPropId, isAiLoading]);

    const getMediaUrl = (idOrUrl: string) => {
        if (!idOrUrl) return '';
        if (typeof idOrUrl !== 'string') return '';
        if (idOrUrl.startsWith('http')) return idOrUrl;
        const media = allMedia.find(m => m.id === idOrUrl);
        return media ? media.url : '';
    };

    const generateAiContent = React.useCallback(async () => {
        if (!property) return;
        setIsAiLoading(true);
        try {
            const taglinePrompt = `Generate a one-sentence luxury tagline for a real estate brochure for "${property.name}" in ${property.city}.`;
            const descPrompt = `Write a short, professional description (2-3 sentences) for a real estate brochure about this property: ${property.name}, a ${property.propertyType} in ${property.city}. Focus on premium lifestyle and location.`;

            // 1. Try Chrome Built-in AI (Gemini Nano) - Latest API
            if (typeof window !== 'undefined' && (window as any).ai?.languageModel) {
                const capabilities = await (window as any).ai.languageModel.capabilities();
                if (capabilities.available !== 'no') {
                    const session = await (window as any).ai.languageModel.create();

                    const tagline = await session.prompt(taglinePrompt);
                    setAiTagline(tagline);

                    const description = await session.prompt(descPrompt);
                    setAiDescription(description);

                    session.destroy();
                    setIsAiLoading(false);
                    return;
                }
            }

            // 2. Try Chrome Built-in AI (Legacy/Origin Trial API)
            if (typeof window !== 'undefined' && (window as any).ai?.createTextSession) {
                const session = await (window as any).ai.createTextSession();
                const tagline = await session.prompt(taglinePrompt);
                setAiTagline(tagline);
                const description = await session.prompt(descPrompt);
                setAiDescription(description);
                setIsAiLoading(false);
                return;
            }

            // Fallback: If no browser AI is available, use localized templates
            await new Promise(resolve => setTimeout(resolve, 800));
            setAiTagline(`Experience unparalleled elegance at ${property.name}, where luxury meets location.`);
            setAiDescription(`${property.name} offers a rare combination of modern luxury and strategic location. This ${property.propertyType} has been meticulously designed to provide the ultimate comfort and sophisticated living experience in ${property.city}.`);
        } catch (err) {
            console.error("Gemini Nano AI Generation failed:", err);
            setAiTagline(`${property.name}: Premium Living in ${property.city}`);
            setAiDescription(property.description || "Sophisticated property featuring high-end finishes and prime location.");
        } finally {
            setIsAiLoading(false);
        }
    }, [property, setAiTagline, setAiDescription, setIsAiLoading]);

    const handleDownload = async () => {
        if (!property) return;
        setGenerating(true);
        setProgress(10);

        try {
            const element = document.getElementById('brochure-capture-area');
            if (!element) throw new Error('Capture area not found');

            const pages = element.querySelectorAll('.brochure-page');
            const isLandscapeMode = design.includes('landscape');
            const pdf = new jsPDF(isLandscapeMode ? 'l' : 'p', 'mm', 'a4', true);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            for (let i = 0; i < pages.length; i++) {
                setProgress(20 + (i * 20));
                const page = pages[i] as HTMLElement;

                const canvas = await html2canvas(page, {
                    scale: 2, // High resolution
                    useCORS: true,
                    logging: false,
                    backgroundColor: null,
                    imageTimeout: 15000,
                });

                const imgData = canvas.toDataURL('image/jpeg', 0.95);

                if (i > 0) pdf.addPage('a4', isLandscapeMode ? 'l' : 'p');
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            }

            setProgress(90);
            pdf.save(`${(property.name || 'Property').replace(/\s+/g, '_')}_Brochure.pdf`);
            setProgress(100);

            if (onClose) setTimeout(onClose, 500);
        } catch (error) {
            console.error('PDF Generation failed:', error);
            alert('Failed to generate brochure. Please try again.');
        } finally {
            setGenerating(false);
            setProgress(0);
        }
    };

    if (!show) return null;

    const renderSidebar = () => (
        <div className={`sidebar-config h-100 d-flex flex-column ${isEmbedded ? 'bg-white' : 'bg-light p-4'}`} style={{ minWidth: '350px' }}>
            {!isEmbedded && <h6 className="fw-bold text-uppercase text-muted small mb-4">Brochure Configuration</h6>}

            {/* Property Selector */}
            <div className={`mb-4 ${isEmbedded ? 'p-4 border-bottom bg-light' : ''}`}>
                <label className="form-label fw-bold small text-muted text-uppercase mb-2" style={{ fontSize: '10px' }}>1. Target Property</label>
                {properties.length > 0 ? (
                    <select
                        className="form-select border-0 shadow-sm rounded-3 fw-bold"
                        value={property?.id || ''}
                        onChange={(e) => onPropertyChange && onPropertyChange(e.target.value)}
                        disabled={generating}
                    >
                        <option value="" disabled>Select a property...</option>
                        {properties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                ) : (
                    <div className="form-control bg-white text-muted border-0 shadow-sm">{property?.name || 'No Property Selected'}</div>
                )}
            </div>

            {/* Custom Tabs */}
            <div className={`flex-grow-1 overflow-auto ${isEmbedded ? 'p-4' : ''}`}>
                <div className="d-flex gap-1 mb-4 bg-light p-1 rounded-3">
                    <button className={`btn btn-sm flex-fill rounded-2 border-0 fw-bold ${activeTab === 'design' ? 'bg-white shadow-sm' : 'text-muted'}`} onClick={() => setActiveTab('design')}>Design</button>
                    <button className={`btn btn-sm flex-fill rounded-2 border-0 fw-bold ${activeTab === 'content' ? 'bg-white shadow-sm' : 'text-muted'}`} onClick={() => setActiveTab('content')}>Content</button>
                    <button className={`btn btn-sm flex-fill rounded-2 border-0 fw-bold ${activeTab === 'images' ? 'bg-white shadow-sm' : 'text-muted'}`} onClick={() => setActiveTab('images')}>Media</button>
                </div>

                {activeTab === 'design' && (
                    <div className="animate-in">
                        <div className="mb-4">
                            <label className="form-label fw-bold small">Font Personality</label>
                            <select className="form-select bg-white border-0 shadow-sm rounded-3" value={fontStyle} onChange={(e) => setFontStyle(e.target.value)} disabled={generating}>
                                <option value="'Outfit', sans-serif">Modern & Trendy (Outfit)</option>
                                <option value="'Playfair Display', serif">Ultra Luxury (Playfair)</option>
                                <option value="'Inter', sans-serif">Professional (Inter)</option>
                                <option value="'Montserrat', sans-serif">Elegant (Montserrat)</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small">Template Style</label>
                            <div className="d-flex flex-column gap-2">
                                {[
                                    { id: 'modern', name: 'Modern Flow', desc: 'Clean, light, vertical' },
                                    { id: 'luxury', name: 'Luxury Prestige', desc: 'Dark mode, high contrast' },
                                    { id: 'artistic', name: 'Artistic Zen', desc: 'Minimalist, center-focused' },
                                    { id: 'elegant_landscape', name: 'Elegant Landscape', desc: 'Wide format, artistic' },
                                    { id: 'premium_landscape', name: 'Premium Royale', desc: 'Dark landscape, immersive' },
                                ].map(item => (
                                    <label key={item.id} className={`btn text-start border-0 shadow-sm rounded-4 bg-white d-flex align-items-center gap-3 p-3 transition-all ${design === item.id ? 'ring-2 ring-primary' : ''}`} style={{ outline: design === item.id ? '2px solid var(--bs-primary)' : 'none' }}>
                                        <input type="radio" name="design" className="form-check-input mt-0" checked={design === item.id} onChange={() => setDesign(item.id as any)} />
                                        <div className="flex-grow-1">
                                            <div className="fw-bold small">{item.name}</div>
                                            <div className="text-muted" style={{ fontSize: '10px' }}>{item.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="mb-4 d-flex gap-4">
                            <div className="flex-fill">
                                <label className="form-label fw-bold small">Signature Color</label>
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    {[
                                        { name: 'Indigo', color: '#6366f1' },
                                        { name: 'Gold', color: '#d4af37' },
                                        { name: 'Rose', color: '#e11d48' },
                                        { name: 'Emerald', color: '#10b981' },
                                        { name: 'Slate', color: '#334155' }
                                    ].map(p => (
                                        <button key={p.color} className={`btn btn-sm p-0 rounded-circle border-2 ${accentColor === p.color ? 'border-primary' : 'border-transparent'}`} onClick={() => setAccentColor(p.color)} title={p.name} style={{ width: '28px', height: '28px', background: p.color }} />
                                    ))}
                                    <br />
                                    <div className='d-flex align-items-center gap-2'>
                                        <input type="color" className="form-control form-control-color border-0 p-0 rounded-circle" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} style={{ width: '38px', height: '38px' }} />
                                        <span className='text-muted small'>Custom</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-fill">
                                <label className="form-label fw-bold small">Text Color</label>
                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    {[
                                        { name: 'Dark', color: '#333333' },
                                        { name: 'White', color: '#ffffff' },
                                        { name: 'Muted', color: '#666666' }
                                    ].map(p => (
                                        <button key={p.color} className={`btn btn-sm p-0 rounded-circle border-2 ${textColor === p.color ? 'border-primary' : 'border-transparent'}`} onClick={() => setTextColor(p.color)} title={p.name} style={{ width: '28px', height: '28px', background: p.color, border: p.color === '#ffffff' ? '1px solid #ddd !important' : '' }} />
                                    ))}
                                    <br />
                                    <div className='d-flex align-items-center gap-2'>
                                        <input type="color" className="form-control form-control-color border-0 p-0 rounded-circle" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: '38px', height: '38px' }} />
                                        <span className='text-muted small'>Custom</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small">Currency Preference</label>
                            <div className="d-flex flex-wrap gap-2">
                                {[
                                    { label: '$ USD', value: '$' },
                                    { label: '€ EUR', value: '€' },
                                    { label: '£ GBP', value: '£' },
                                    { label: '₹ INR', value: '₹' },
                                    { label: '¥ JPY', value: '¥' },
                                    { label: 'AED', value: 'AED' },
                                ].map(c => (
                                    <button 
                                        key={c.value} 
                                        className={`btn btn-sm rounded-pill fw-bold border ${currency === c.value ? 'btn-primary border-primary' : 'bg-white border-light text-muted'}`}
                                        onClick={() => setCurrency(c.value)}
                                        style={{ fontSize: '11px', padding: '6px 15px' }}
                                    >
                                        {c.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'content' && (
                    <div className="animate-in">
                        <div className="mb-4 bg-dark bg-opacity-10 p-4 rounded-4 border border-opacity-10">
                            <label className="form-label fw-bold small text-primary d-flex align-items-center gap-2 mb-3">
                                <i className="bi bi-robot"></i> AI Engine (Chrome Nano)
                            </label>
                            <button className="btn btn-primary w-100 rounded-pill fw-bold btn-sm mb-3 shadow-sm" onClick={generateAiContent} disabled={isAiLoading || !property}>
                                {isAiLoading ? <span className="spinner-border spinner-border-sm me-2"></span> : '✨ Rewrite All Content'}
                            </button>
                            <div className="mb-3">
                                <label className="form-label fw-bold extra-small text-muted text-uppercase">Signature Tagline</label>
                                <textarea className="form-control form-control-sm border-0 shadow-none bg-white rounded-3 mt-1" rows={4} value={aiTagline} onChange={(e) => setAiTagline(e.target.value)} style={{ fontSize: '11px' }} placeholder="AI will generate this..." />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small mb-2">Advance Toggles</label>
                            <div className="d-flex flex-column gap-2 bg-light p-3 rounded-4">
                                <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0">
                                    <label className="form-check-label small fw-medium">Display Price</label>
                                    <input className="form-check-input" type="checkbox" checked={toggles.showPrice} onChange={e => setToggles({ ...toggles, showPrice: e.target.checked })} />
                                </div>
                                <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0">
                                    <label className="form-check-label small fw-medium">Display Amenities</label>
                                    <input className="form-check-input" type="checkbox" checked={toggles.showAmenities} onChange={e => setToggles({ ...toggles, showAmenities: e.target.checked })} />
                                </div>
                                <div className="form-check form-switch d-flex justify-content-between align-items-center ps-0">
                                    <label className="form-check-label small fw-medium">Display QR Code</label>
                                    <input className="form-check-input" type="checkbox" checked={toggles.showQRCode} onChange={e => setToggles({ ...toggles, showQRCode: e.target.checked })} />
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small mb-2">Contact Info</label>
                            <div className="d-flex flex-column gap-2">
                                <input type="text" className="form-control form-control-sm bg-light border-0 shadow-none rounded-3" placeholder="Contact Name" value={customContact.name} onChange={e => setCustomContact({ ...customContact, name: e.target.value })} />
                                <input type="text" className="form-control form-control-sm bg-light border-0 shadow-none rounded-3" placeholder="Phone" value={customContact.phone} onChange={e => setCustomContact({ ...customContact, phone: e.target.value })} />
                                <input type="email" className="form-control form-control-sm bg-light border-0 shadow-none rounded-3" placeholder="Email" value={customContact.email} onChange={e => setCustomContact({ ...customContact, email: e.target.value })} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'images' && (
                    <div className="animate-in">
                        <div className="alert alert-info border-0 rounded-4 small p-3">
                            <i className="bi bi-info-circle me-2 font-bold"></i> Select the most premium images to be used across the brochure pages.
                        </div>
                        <div className="mb-4">
                            <label className="form-label fw-bold small">Cover Feature</label>
                            <div className="row g-2 overflow-auto scroll-hide flex-nowrap pb-2">
                                {property !== null && (property.gallery || []).map((img, i: number) => {
                                    const url = getMediaUrl(typeof img === 'string' ? img : (img as any).url);
                                    return (
                                        <div key={i} className="col-4" style={{ minWidth: '100px' }}>
                                            <div
                                                className={`rounded-3 cursor-pointer border-2 transition-all ${selectedImages.cover === url ? 'border-primary' : 'border-transparent'}`}
                                                onClick={() => setSelectedImages({ ...selectedImages, cover: url })}
                                                style={{ height: '70px', background: `url(${url}) center/cover` }}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small">Atmosphere Backgrounds</label>
                            <div className="d-flex flex-column gap-3">
                                {['bg1', 'bg2', 'bg3'].map((key, idx) => (
                                    <div key={key} className="bg-light p-2 rounded-4">
                                        <div className="extra-small fw-bold text-muted text-uppercase mb-2 ms-1">Page {idx + 1} Background</div>
                                        <div className="row g-2 overflow-auto scroll-hide flex-nowrap pb-1">
                                            {property !== null && (property.gallery || []).map((img, i: number) => {
                                                const url = getMediaUrl(typeof img === 'string' ? img : (img as any).url);
                                                return (
                                                    <div key={i} className="col-4" style={{ minWidth: '80px' }}>
                                                        <div
                                                            className={`rounded-3 cursor-pointer border-2 ${selectedImages[key as keyof typeof selectedImages] === url ? 'border-primary' : 'border-transparent'}`}
                                                            onClick={() => setSelectedImages({ ...selectedImages, [key]: url })}
                                                            style={{ height: '50px', background: `url(${url}) center/cover` }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className={`mt-auto ${isEmbedded ? 'p-4 border-top' : ''}`}>
                {generating ? (
                    <div className="py-2 text-center bg-success bg-opacity-10 rounded-4 p-3 border border-success border-opacity-10">
                        <div className="progress mb-3 rounded-pill" style={{ height: '8px' }}>
                            <div className="progress-bar progress-bar-striped progress-bar-animated bg-success" role="progressbar" style={{ width: `${progress}%` }} />
                        </div>
                        <p className="small fw-bold text-success mb-0">Crafting Masterpiece... {progress}%</p>
                    </div>
                ) : (
                    <button className="btn btn-dark btn-lg w-100 rounded-4 py-3 fw-bold shadow-lg transition-all hover-scale" onClick={handleDownload} disabled={!property}>
                        <i className="bi bi-lightning-fill text-warning me-2"></i> Generate Brochure
                    </button>
                )}
            </div>

            <style jsx>{`
                .extra-small { font-size: 10px; }
                .cursor-pointer { cursor: pointer; }
                .hover-scale:hover { transform: scale(1.02); }
                .scroll-hide::-webkit-scrollbar { display: none; }
                .scroll-hide { -ms-overflow-style: none; scrollbar-width: none; }
                .animate-in { animation: fadeIn 0.3s ease-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );

    const renderContent = () => (
        <div id="brochure-intelligent-content" className="row g-0 h-100">
            {/* Sidebar Configuration */}
            <div className="col-md-4 col-lg-3 border-end h-100 overflow-hidden" style={{ minWidth: '350px' }}>
                {renderSidebar()}
            </div>

            {/* Preview Area - Neural Proofing System */}
            <div id="brochure-viewer-portal" className="col-md-8 col-lg-9 d-flex flex-column align-items-center h-100 overflow-auto py-5 px-3"
                style={{
                    background: '#f1f5f9',
                    backgroundImage: 'linear-gradient(45deg, #f8fafc 25%, transparent 25%), linear-gradient(-45deg, #f8fafc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f8fafc 75%), linear-gradient(-45deg, transparent 75%, #f8fafc 75%)',
                    backgroundSize: '40px 40px',
                    position: 'relative',
                    minHeight: '600px',
                    zIndex: 5
                }}>

                {/* Visual Link Diagnostic */}
                <div className="position-absolute top-0 end-0 m-4 d-flex gap-2 z-3 pt-2">
                    <div className={`p-2 rounded-4 shadow-lg border d-flex align-items-center gap-2 ${property ? 'bg-white border-success' : 'bg-white border-warning'}`} style={{ minWidth: '180px' }}>
                        <div className={`rounded-circle ${property ? 'bg-success animate-ping' : 'bg-warning'}`} style={{ width: '10px', height: '10px' }}></div>
                        <div className="text-dark small fw-bold text-truncate" style={{ maxWidth: '120px' }}>{property ? property.name : 'NO DATA LINKED'}</div>
                    </div>
                </div>

                {!property ? (
                    <div className="my-auto text-muted text-center animate-in p-5 bg-white rounded-5 shadow-2xl border" style={{ maxWidth: '500px' }}>
                        <div className="mb-4 bg-primary bg-opacity-10 display-4 p-4 rounded-circle d-inline-block shadow-sm">
                            <i className="bi bi-cpu text-primary"></i>
                        </div>
                        <h4 className="fw-bold text-dark">Neural Proofing Engine</h4>
                        <p className="text-muted small">The visualization gateway is active. Please select a property from your portfolio to synchronize the high-fidelity proofing data.</p>
                        <div className="pt-3 mt-4 border-top opacity-50 small">System ID: BROCHURE_PRO_V3</div>
                    </div>
                ) : (
                    <div className="preview-viewport-v4 w-100 d-flex flex-column align-items-center position-relative h-100" style={{ minWidth: '800px' }}>

                        {(fetching || isAiLoading) && (
                            <div className="position-absolute top-0 start-50 translate-middle-x z-3 text-center bg-white p-4 rounded-4 shadow-2xl border mt-5"
                                style={{ minWidth: '300px', border: '2px solid rgba(var(--bs-primary-rgb), 0.1)' }}>
                                <div className="spinner-border text-primary border-4 mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
                                <div className="fw-bold text-dark">{fetching ? 'Synchronizing Data...' : 'AI Rewriting Content...'}</div>
                                <div className="text-muted small">Updating live proof dimensions</div>
                            </div>
                        )}

                        <div className="preview-status-header mb-5 sticky-top z-2 pt-2">
                            <div className="px-5 py-3 bg-dark text-white rounded-pill small fw-bold shadow-2xl d-flex align-items-center gap-3 border border-secondary"
                                style={{ letterSpacing: '2px', fontSize: '10px', backdropFilter: 'blur(10px)' }}>
                                <i className="bi bi-broadcast text-success"></i>
                                <span>LIVE VISUAL SYNCHRONIZATION</span>
                                <span className="text-white-50">|</span>
                                <span className="text-warning text-uppercase">{property.name}</span>
                            </div>
                        </div>

                        {/* FORCED VISIBILITY CONTAINER */}
                        <div className="brochure-proofing-field p-0 bg-white shadow-2xl border-4 border-white rounded-1"
                            style={{
                                width: design.includes('landscape') ? '297mm' : '210mm',
                                height: 'auto',
                                marginBottom: '150px',
                                minHeight: '600px',
                                transition: 'filter 0.4s ease',
                                filter: (fetching || isAiLoading) ? 'blur(10px)' : 'none',
                                overflow: 'visible',
                                boxSizing: 'content-box',
                                display: 'block'
                            }}>
                            <div className="brochure-scale-root" style={{
                                transform: `scale(${design.includes('landscape') ? 0.32 : 0.42})`, 
                                transformOrigin: 'top center',
                                width: design.includes('landscape') ? '297mm' : '210mm',
                                marginBottom: design.includes('landscape') ? '-140mm' : '-170mm',
                                background: '#fff',
                                boxShadow: '0 0 100px rgba(0,0,0,0.1)'
                            }}>
                                <BrochureTemplate
                                    property={property}
                                    mode={mode}
                                    companyInfo={companyInfo}
                                    fontStyle={fontStyle}
                                    design={design}
                                    accentColor={accentColor}
                                    textColor={textColor}
                                    currency={currency}
                                    allAmenities={allAmenities}
                                    allMedia={allMedia}
                                    aiTagline={aiTagline}
                                    aiDescription={aiDescription}
                                    isPreview={true}
                                    customContact={customContact}
                                    selectedImages={selectedImages}
                                    toggles={toggles}
                                />
                            </div>
                        </div>

                        <div className="text-muted extra-small fw-bold opacity-50 mt-auto mb-5 p-3 bg-white rounded-pill shadow-sm border text-uppercase" style={{ letterSpacing: '1px' }}>
                            <i className="bi bi-mouse-fill me-2 text-primary"></i> Scroll to explore proof
                        </div>
                    </div>
                )}
            </div>

            {/* Hidden capture area for PDF generation */}
            <div style={{ position: 'absolute', left: '-10000px', top: 0, opacity: 0, pointerEvents: 'none' }}>
                <BrochureTemplate
                    property={property}
                    mode={mode}
                    companyInfo={companyInfo}
                    fontStyle={fontStyle}
                    design={design}
                    accentColor={accentColor}
                    textColor={textColor}
                    currency={currency}
                    allAmenities={allAmenities}
                    allMedia={allMedia}
                    aiTagline={aiTagline}
                    aiDescription={aiDescription}
                    isPreview={false}
                    customContact={customContact}
                    selectedImages={selectedImages}
                    toggles={toggles}
                />
            </div>
        </div>
    );

    if (isEmbedded) {
        return renderContent();
    }

    return (
        <div
            className="modal show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 2000 }}
        >
            <div className="modal-dialog modal-fullscreen">
                <div className="modal-content border-0 overflow-hidden h-100">
                    <div className="modal-header bg-dark text-white px-4 py-3 border-0 flex-shrink-0">
                        <div className="d-flex align-items-center gap-3">
                            <i className="bi bi-magic fs-4 text-warning"></i>
                            <h5 className="modal-title fw-bold text-white mb-0">Brochure Intelligent AI</h5>
                        </div>
                        <button type="button" className="btn-close btn-close-white shadow-none" onClick={onClose} disabled={generating}></button>
                    </div>
                    <div className="modal-body p-0 overflow-hidden h-100">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}
