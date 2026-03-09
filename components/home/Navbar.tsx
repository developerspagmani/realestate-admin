'use client';

import Link from "next/link";
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { seoData } from '@/utils/seoData';

interface NavbarProps {
    scrolled: boolean;
    onMicClick?: () => void;
}

export default function Navbar({ scrolled, onMicClick }: NavbarProps) {
    const { isAuthenticated, getRedirectPath } = useAuthContext();
    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<any[]>([]);

    useEffect(() => {
        if (searchQuery.length > 1) {
            setIsSearching(true);
            const timer = setTimeout(() => {
                const results = Object.entries(seoData)
                    .filter(([key, data]) =>
                        data.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        data.description.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(([key, data]) => ({ key, ...data }));
                setSearchResults(results);
                setIsSearching(false);
            }, 600);
            return () => clearTimeout(timer);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    }, [searchQuery]);

    return (
        <nav className={`fixed-top w-100 transition-all glassy-navbar ${scrolled ? 'scrolled shadow-2xl' : ''}`} style={{ zIndex: 1000, height: '80px' }}>
            <div className="container h-100 d-flex justify-content-between align-items-center">
                <Link href="/" className="logo-link d-flex align-items-center gap-2 text-decoration-none p-2 p-md-3 bg-white rounded-0 shadow-sm border-bottom border-3 border-danger">
                    <img
                        src="/images/Virpanix-logo.svg"
                        alt="Virpanix Logo"
                        className="logo-img"
                        style={{
                            height: '45px',
                            width: 'auto',
                        }}
                    />
                </Link>

                <div className="d-flex align-items-center gap-2 gap-md-4 small tracking-tight fw-600">
                    <button
                        onClick={() => setSearchOpen(true)}
                        className="btn text-white opacity-50 hvr-red p-0 d-flex align-items-center"
                    >
                        <i className="bi bi-search fs-5"></i>
                    </button>

                    <div className="dropdown d-none d-lg-inline">
                        <a className="text-white opacity-50 text-decoration-none hvr-red dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Modules
                        </a>
                        <ul className="dropdown-menu dropdown-menu-dark bg-black/90 backdrop-blur-xl border-red/20 shadow-2xl p-3 rounded-4 custom-scrollbar" style={{ minWidth: '280px', maxHeight: '600px', overflowY: 'auto' }}>
                            <li><h6 className="dropdown-header text-red extra-small fw-800 uppercase tracking-widest px-2 mb-2">Core Intelligence</h6></li>
                            <li><Link href="/pages/virpa-ai" className="dropdown-item rounded-3 py-2 px-3 small">Virpa AI (Neural)</Link></li>
                            <li><Link href="/pages/analytics" className="dropdown-item rounded-3 py-2 px-3 small">Data Intelligence</Link></li>
                            <li><Link href="/pages/crm" className="dropdown-item rounded-3 py-2 px-3 small">Leads & CRM Hub</Link></li>
                            <li><Link href="/pages/intelligent-voice" className="dropdown-item rounded-3 py-2 px-3 small">Voice Command</Link></li>
                            <li><hr className="dropdown-divider border-white/5" /></li>
                            <li><h6 className="dropdown-header text-red extra-small fw-800 uppercase tracking-widest px-2 mb-2">Omnichannel</h6></li>
                            <li><Link href="/pages/social-hub" className="dropdown-item rounded-3 py-2 px-3 small">Social Hub (WA)</Link></li>
                            <li><Link href="/pages/marketing" className="dropdown-item rounded-3 py-2 px-3 small">Automation</Link></li>
                            <li><hr className="dropdown-divider border-white/5" /></li>
                            <li><h6 className="dropdown-header text-red extra-small fw-800 uppercase tracking-widest px-2 mb-2">Inventory</h6></li>
                            <li><Link href="/pages/inventory" className="dropdown-item rounded-3 py-2 px-3 small">Property Portfolio</Link></li>
                            <li><Link href="/pages/plot-maps" className="dropdown-item rounded-3 py-2 px-3 small">Interactive Maps</Link></li>
                            <li><Link href="/pages/matching-engine" className="dropdown-item rounded-3 py-2 px-3 small">Matching Engine</Link></li>
                            <li><hr className="dropdown-divider border-white/5" /></li>
                            <li><h6 className="dropdown-header text-red extra-small fw-800 uppercase tracking-widest px-2 mb-2">Assets</h6></li>
                            <li><Link href="/pages/brochure-ai" className="dropdown-item rounded-3 py-2 px-3 small">Brochure AI</Link></li>
                            <li><Link href="/pages/seo-engine" className="dropdown-item rounded-3 py-2 px-3 small">Search SEO</Link></li>
                            <li><Link href="/pages/websites" className="dropdown-item rounded-3 py-2 px-3 small">Websites Hub</Link></li>
                        </ul>
                    </div>
                    <Link href="/pages/about" className="text-white opacity-50 text-decoration-none hvr-red d-none d-lg-inline">About Us</Link>
                    <Link href="/pages/plans" className="text-white opacity-50 text-decoration-none hvr-red d-none d-lg-inline">Plans</Link>
                    <Link href="/pages/contact" className="text-white opacity-50 text-decoration-none hvr-red d-none d-lg-inline">Contact</Link>

                    {onMicClick && (
                        <button
                            onClick={onMicClick}
                            className="btn btn-outline-white border-white/10 rounded-circle p-0 d-flex align-items-center justify-content-center hvr-red-pulse"
                            style={{ width: '40px', height: '40px', background: 'rgba(255,255,255,0.05)' }}
                        >
                            <i className="bi bi-mic-fill fs-5 text-white"></i>
                        </button>
                    )}

                    {isAuthenticated ? (
                        <Link href={getRedirectPath()} className="btn-red py-2 px-4 shadow-sm d-none d-lg-inline-block">Dashboard</Link>
                    ) : (
                        <div className="d-flex align-items-center gap-3 d-none d-lg-flex">
                            <Link href="/login" className="text-white opacity-50 text-decoration-none hvr-red small fw-700">Login</Link>
                            <Link href="/register" className="btn-red py-2 px-4 fw-800 rounded-pill">START FREE</Link>
                        </div>
                    )}

                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="btn text-white opacity-50 hvr-red p-0 d-flex align-items-center d-lg-none"
                    >
                        <i className="bi bi-list fs-1"></i>
                    </button>
                </div>
            </div>

            {searchOpen && (
                <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center animate-fade-in" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', paddingTop: '25vh', zIndex: 2000 }}>
                    <button
                        onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                        className="position-absolute top-0 end-0 m-4 btn text-white opacity-50 hvr-red"
                    >
                        <i className="bi bi-x-lg fs-3"></i>
                    </button>
                    <div className="container" style={{ maxWidth: '800px' }}>
                        <div className="position-relative w-100">
                            <i className="bi bi-search position-absolute top-50 start-0 translate-middle-y ms-4 text-white opacity-50 fs-5"></i>
                            <input
                                autoFocus
                                type="text"
                                className="form-control bg-black/60 border border-red/30 text-dark rounded-pill py-3 fs-5 shadow-red-lg"
                                style={{ paddingLeft: '4rem', paddingRight: '4rem', boxShadow: '0 0 20px rgba(230,0,38,0.2)' }}
                                placeholder="Search protocol across all modules..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {isSearching && (
                                <div className="position-absolute end-0 top-50 translate-middle-y pe-4 d-flex gap-1 align-items-center">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="search-wave bg-red" style={{ animationDelay: `${i * 0.1}s` }}></div>
                                    ))}
                                </div>
                            )}

                            {searchResults.length > 0 && (
                                <div className="position-absolute top-100 start-0 w-100 mt-3 bg-black/95 backdrop-blur-xl border border-red/20 rounded-4 shadow-red-lg p-3 custom-scrollbar list-group" style={{ maxHeight: '40vh', overflowY: 'auto', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                                    {searchResults.map((res) => (
                                        <Link
                                            key={res.key}
                                            href={res.key.startsWith('/') ? res.key : `/pages/${res.key}`}
                                            className="d-block text-decoration-none py-3 px-4 rounded-3 hover-bg-red-light text-white mb-1 transition-all"
                                            onClick={() => { setSearchOpen(false); setSearchQuery(''); setSearchResults([]); }}
                                        >
                                            <div className="fw-900 text-red mb-1 fs-6 tracking-tight">{res.title}</div>
                                            <div className="small opacity-60 text-truncate">{res.description}</div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Menu Drawer */}
            <div className={`mobile-drawer position-fixed top-0 end-0 h-100 bg-black backdrop-blur-xl border-start border-red/20 shadow-2xl transition-all ${mobileMenuOpen ? 'open' : ''}`} style={{ width: '300px', maxWidth: '80vw', zIndex: 2001 }}>
                <div className="p-4 d-flex flex-column h-100">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <span className="text-white fw-900 tracking-widest small">MENU</span>
                        <button onClick={() => setMobileMenuOpen(false)} className="btn text-white opacity-50 hvr-red p-0">
                            <i className="bi bi-x-lg fs-4"></i>
                        </button>
                    </div>

                    <div className="d-flex flex-column gap-3 overflow-y-auto mb-4 flex-grow-1 custom-scrollbar pe-2">
                        <div className="text-red extra-small fw-800 uppercase tracking-widest mb-1 mt-2">Core Intelligence</div>
                        <Link href="/pages/virpa-ai" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Virpa AI (Neural)</Link>
                        <Link href="/pages/analytics" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Data Intelligence</Link>
                        <Link href="/pages/crm" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Leads & CRM Hub</Link>
                        <Link href="/pages/intelligent-voice" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Voice Command</Link>

                        <div className="text-red extra-small fw-800 uppercase tracking-widest mt-3 mb-1">Omnichannel</div>
                        <Link href="/pages/social-hub" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Social Hub (WA)</Link>
                        <Link href="/pages/marketing" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Automation</Link>

                        <div className="text-red extra-small fw-800 uppercase tracking-widest mt-3 mb-1">Inventory</div>
                        <Link href="/pages/inventory" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Property Portfolio</Link>
                        <Link href="/pages/plot-maps" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Interactive Maps</Link>
                        <Link href="/pages/matching-engine" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Matching Engine</Link>

                        <div className="text-red extra-small fw-800 uppercase tracking-widest mt-3 mb-1">Assets & Ecosystem</div>
                        <Link href="/pages/brochure-ai" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Brochure AI</Link>
                        <Link href="/pages/seo-engine" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Search SEO</Link>
                        <Link href="/pages/websites" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Websites Hub</Link>

                        <hr className="border-white/10 my-2" />
                        <Link href="/pages/about" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">About Us</Link>
                        <Link href="/pages/plans" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Plans</Link>
                        <Link href="/pages/contact" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small">Contact</Link>
                    </div>

                    <div className="mt-auto pt-3 border-top border-white/10">
                        {isAuthenticated ? (
                            <Link href={getRedirectPath()} onClick={() => setMobileMenuOpen(false)} className="btn-red w-100 py-3 shadow-sm text-center d-block rounded-pill">Dashboard</Link>
                        ) : (
                            <div className="d-flex flex-column gap-3">
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-white opacity-80 text-decoration-none hvr-red small fw-700 text-center py-2 border border-white/20 rounded-pill">Login</Link>
                                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="btn-red w-100 py-3 fw-800 rounded-pill text-center d-block">START FREE</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Backdrop for Mobile Drawer */}
            {mobileMenuOpen && (
                <div
                    className="position-fixed top-0 start-0 w-100 h-100 bg-black/50 animate-fade-in"
                    style={{ zIndex: 1999 }}
                    onClick={() => setMobileMenuOpen(false)}
                ></div>
            )}

            <style jsx>{`
                .logo-link {
                    transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                .logo-link:hover {
                    background-color: #000 !important;
                    border-bottom-color: #fff !important;
                }
                .logo-img {
                    transition: all 0.4s ease;
                }
                .logo-link:hover .logo-img {
                    filter: invert(1) brightness(1.2);
                }
                .glassy-navbar {
                    background: rgba(0, 0, 0, 0.05);
                    backdrop-filter: blur(12px) saturate(180%);
                    -webkit-backdrop-filter: blur(12px) saturate(180%);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                .glassy-navbar.scrolled {
                    background: rgba(10, 10, 10, 0.4);
                    backdrop-filter: blur(25px) saturate(180%);
                    -webkit-backdrop-filter: blur(25px) saturate(180%);
                    border-bottom: 1px solid rgba(230, 0, 38, 0.3);
                    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
                }
                .pulse-slow {
                    animation: pulse-red-soft 3s infinite;
                }
                @keyframes pulse-red-soft {
                    0% { opacity: 0.5; }
                    50% { opacity: 1; }
                    100% { opacity: 0.5; }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(230, 0, 38, 0.2);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(230, 0, 38, 0.4);
                }
                .hvr-red-pulse:hover {
                    animation: pulse 1.5s infinite;
                    border-color: #e60026 !important;
                }
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(230, 0, 38, 0.4); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(230, 0, 38, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(230, 0, 38, 0); }
                }
                .search-wave {
                    width: 3px;
                    height: 12px;
                    border-radius: 10px;
                    animation: search-wave-anim 1s infinite alternate ease-in-out;
                }
                @keyframes search-wave-anim {
                    from { transform: scaleY(0.5); opacity: 0.3; }
                    to { transform: scaleY(1.5); opacity: 1; }
                }
                .animate-fade-in {
                    animation: fadeIn 0.3s ease;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .z-max { z-index: 2000; }
                .hover-bg-red-light:hover { background: rgba(230, 0, 38, 0.05) !important; }
                .mobile-drawer {
                    transform: translateX(100%);
                    opacity: 0;
                    visibility: hidden;
                }
                .mobile-drawer.open {
                    transform: translateX(0);
                    opacity: 1;
                    visibility: visible;
                }
            `}</style>
        </nav >
    );
}
