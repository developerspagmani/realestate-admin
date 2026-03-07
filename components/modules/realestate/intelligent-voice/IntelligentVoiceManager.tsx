'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { leadService, bookingService, Lead, Booking } from '@/app/services/api';
import Image from 'next/image';
import MainLayout from '@/components/MainLayout';

type ViewMode = 'idle' | 'listening' | 'processing' | 'leads' | 'bookings' | 'sleep';

export default function IntelligentVoiceManager() {
    const { user, token } = useAuthContext();
    const [viewMode, setViewMode] = useState<ViewMode>('idle');
    const [commandFeedback, setCommandFeedback] = useState('How can I help you today?');
    const [speechIntensity, setSpeechIntensity] = useState([1, 1, 1, 1, 1]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [activeData, setActiveData] = useState<'leads' | 'bookings' | 'none'>('none');
    const [loading, setLoading] = useState(false);
    const recognitionRef = useRef<any>(null);
    const sleepTimeoutRef = useRef<any>(null);

    const triggerAutoSleep = () => {
        if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
        sleepTimeoutRef.current = setTimeout(() => {
            setViewMode(prev => {
                if (prev === 'leads' || prev === 'bookings' || prev === 'idle') return 'sleep';
                return prev;
            });
        }, 15000); // 15 seconds
    };

    // Helper to speak back
    const speak = (text: string) => {
        return new Promise((resolve) => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.0;
            utterance.pitch = 0.8;
            utterance.onend = () => resolve(true);
            window.speechSynthesis.speak(utterance);
        });
    };

    const passiveRecognitionRef = useRef<any>(null);

    // Auto-listen for wake word
    useEffect(() => {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) return;

        let recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;
        recognition.interimResults = true;
        passiveRecognitionRef.current = recognition;

        recognition.onresult = (event: any) => {
            if (viewMode === 'listening' || viewMode === 'processing') return; // Don't process wake word if currently recording a command

            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.toLowerCase();

            // Wake word triggers
            if (transcript.includes('hello system') || transcript.includes('start voice') || transcript.includes('wake up') || transcript.includes('virpanix')) {
                recognition.stop();
                if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
                startListening();
            } else if (transcript.includes('go to sleep') || transcript.includes('goto sleep') || transcript.includes('sleep')) {
                recognition.stop();
                setViewMode('sleep');
                speak("Going to sleep.");
            }
        };

        recognition.onend = () => {
            // Restart passive listening if we are not actively talking to the user
            if (viewMode !== 'listening' && viewMode !== 'processing' && passiveRecognitionRef.current) {
                try { passiveRecognitionRef.current.start(); } catch (e) { }
            }
        };

        if (viewMode !== 'listening' && viewMode !== 'processing') {
            try { recognition.start(); } catch (e) { }
        }

        return () => {
            if (passiveRecognitionRef.current) {
                passiveRecognitionRef.current.stop();
            }
        };
    }, [viewMode]);

    const startListening = async () => {
        if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        try {
            setCommandFeedback('Waking up...');
            setViewMode('listening');
            // Hardware probe
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
        } catch (e) {
            console.error('Mic error:', e);
            setCommandFeedback('Microphone permission blocked.');
            setViewMode('idle');
            return;
        }

        await speak("I'm listening.");

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
        recognitionRef.current = recognition;

        const interval = setInterval(() => {
            setSpeechIntensity(Array.from({ length: 5 }, () => Math.floor(Math.random() * 40) + 10));
        }, 100);

        recognition.onstart = () => {
            setCommandFeedback('Listening...');
        };

        recognition.onresult = async (event: any) => {
            clearInterval(interval);
            setSpeechIntensity([5, 5, 5, 5, 5]);
            setViewMode('processing');
            const command = event.results[0][0].transcript.toLowerCase();
            setCommandFeedback(`Command received: "${command}"`);
            await processCommand(command);
        };

        recognition.onerror = (event: any) => {
            clearInterval(interval);
            setSpeechIntensity([1, 1, 1, 1, 1]);
            if (event.error === 'not-allowed') {
                setCommandFeedback('Microphone Blocked. Allow access.');
            } else if (event.error !== 'no-speech') {
                setCommandFeedback('Connection interrupted.');
            }
            setTimeout(() => setViewMode('idle'), 2000);
        };

        recognition.onend = () => {
            clearInterval(interval);
            if (viewMode === 'listening') {
                setViewMode('idle');
                setCommandFeedback('Ready.');
            }
        };

        setTimeout(() => {
            recognition.start();
        }, 400);
    };

    const processCommand = async (command: string) => {
        setLoading(true);

        try {
            if (!token) throw new Error("Authentication required");

            // Conversational triggers
            if (command.includes('sleep') || command.includes('go to sleep')) {
                speak("Going to sleep.");
                setViewMode('sleep');
                setCommandFeedback("Sleeping.");
                return;
            } else if (command.includes('thank') || command.includes('appreciate')) {
                const responses = [
                    "You're very welcome! Let me know if you need anything else.",
                    "It's my pleasure! Do you have any other queries?",
                    "Anytime! I'm here if you need more help."
                ];
                const msg = responses[Math.floor(Math.random() * responses.length)];
                await speak(msg);
                setCommandFeedback("Standing by for further instructions.");
                setViewMode('idle');
                setActiveData('none');
                triggerAutoSleep();
                return;
            } else if (command.trim() === 'hello' || command.trim() === 'hi' || command.includes('how are you')) {
                const responses = [
                    "Hello there! I am ready to assist you.",
                    "Hi! How can I help you today?",
                    "Greetings! What data can I pull up for you?"
                ];
                const msg = responses[Math.floor(Math.random() * responses.length)];
                await speak(msg);
                setCommandFeedback("Listening for instructions...");
                setViewMode('idle');
                setActiveData('none');
                return;
            }

            if (command.includes('lead')) {
                let statusFilter = '';
                let intentMsg = "Pulling up your leads...";

                if (command.includes('new')) {
                    statusFilter = '1'; // Assuming 1 is New
                    intentMsg = "Pulling up your new leads";
                } else if (command.includes('lost')) {
                    statusFilter = '4'; // Assuming 4 is Lost
                    intentMsg = "Pulling up lost leads";
                } else if (command.includes('1.5') || command.includes('budget') || command.includes('cr')) {
                    intentMsg = "Scanning for high value leads near 1.5 Crores";
                }

                await speak(intentMsg);

                // Fetch leads
                const response = await leadService.getLeads(token, { limit: '50', status: statusFilter });

                let leadsData = null;
                if (Array.isArray(response)) leadsData = response;
                else if (response?.data?.leads && Array.isArray(response.data.leads)) leadsData = response.data.leads;
                else if (response?.data && Array.isArray(response.data)) leadsData = response.data;
                else if (response?.success) leadsData = [];

                if (leadsData !== null) {
                    let fetchedLeads = leadsData;

                    // Client side fallback for complex budget matching
                    if (command.includes('1.5') || command.includes('cr')) {
                        fetchedLeads = fetchedLeads.filter((l: any) => l.message?.includes('1.5') || l.budget >= 15000000);
                    }

                    setLeads(fetchedLeads);
                    setActiveData('leads');
                    setViewMode('idle');
                    setCommandFeedback(`Found ${fetchedLeads.length} leads matching your criteria.`);
                    triggerAutoSleep();
                } else {
                    setCommandFeedback(`Failed to load leads or format unknown.`);
                    setActiveData('none');
                    setViewMode('idle');
                }
            }
            else if (command.includes('booking')) {
                let intentMsg = "Pulling up your bookings...";
                const params: any = { limit: '50' };

                if (command.includes('upcoming') || command.includes('future')) {
                    params.status = '1,2'; // Pending OR Confirmed
                    intentMsg = "Pulling up your upcoming bookings...";
                } else if (command.includes('closed') || command.includes('completed')) {
                    params.status = '4'; // Completed
                    intentMsg = "Pulling up closed bookings...";
                } else if (command.includes('today')) {
                    const today = new Date().toISOString().split('T')[0];
                    params.startDate = today;
                    params.endDate = today;
                    intentMsg = "Pulling up today's bookings...";
                }

                await speak(intentMsg);

                const response = await bookingService.getBookings(token, params);

                let bookingsData = null;
                if (Array.isArray(response)) bookingsData = response;
                else if (response?.data?.bookings && Array.isArray(response.data.bookings)) bookingsData = response.data.bookings;
                else if (response?.data && Array.isArray(response.data)) bookingsData = response.data;
                else if (response?.success) bookingsData = [];

                if (bookingsData !== null) {
                    setBookings(bookingsData);
                    setActiveData('bookings');
                    setViewMode('idle');
                    setCommandFeedback(`Found ${bookingsData.length} bookings matching your criteria.`);
                    triggerAutoSleep();
                } else {
                    setCommandFeedback(`Failed to load bookings or format unknown.`);
                    setActiveData('none');
                    setViewMode('idle');
                }
            }
            else {
                await speak("I didn't recognize that command. Please ask for leads or bookings.");
                setCommandFeedback("Unrecognized context. Try 'List new leads' or 'Show today's bookings'.");
                setViewMode('idle');
            }

        } catch (e) {
            console.error(e);
            setCommandFeedback('Failed to execute command. System error.');
            setViewMode('idle');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: number, type: 'lead' | 'booking') => {
        if (type === 'lead') {
            switch (status) {
                case 1: return <span className="badge bg-primary-subtle text-primary">New</span>;
                case 2: return <span className="badge bg-info-subtle text-info">Contacted</span>;
                case 3: return <span className="badge bg-success-subtle text-success">Qualified</span>;
                case 4: return <span className="badge bg-danger-subtle text-danger">Lost</span>;
                default: return <span className="badge bg-secondary-subtle text-secondary">Unknown</span>;
            }
        } else {
            switch (status) {
                case 1: return <span className="badge bg-warning-subtle text-warning">Pending</span>;
                case 2: return <span className="badge bg-success-subtle text-success">Confirmed</span>;
                case 3: return <span className="badge bg-danger-subtle text-danger">Cancelled</span>;
                case 4: return <span className="badge bg-secondary-subtle text-secondary">Completed</span>;
                default: return <span className="badge bg-secondary-subtle text-secondary">Unknown</span>;
            }
        }
    };

    return (
        <MainLayout activePage="intelligent-voice">
            <div className="container-fluid py-4 min-vh-100 d-flex flex-column position-relative" style={{ background: 'linear-gradient(180deg, #f8f9fc 0%, #eef2f7 100%)' }}>

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4 mt-2 px-3 flex-shrink-0">
                    <div>
                        <h2 className="fw-bold mb-1 text-dark" style={{ letterSpacing: '-0.5px' }}>
                            <i className="bi bi-cpu-fill text-primary me-2"></i> Intelligent Command Center
                        </h2>
                        <p className="text-secondary mb-0">Use natural language to interrogate your real estate data.</p>
                    </div>
                    <div className="px-3 py-2 bg-white rounded-pill shadow-sm border border-light d-flex align-items-center gap-2">
                        <div className={`spinner-grow spinner-grow-sm ${viewMode === 'listening' ? 'text-danger' : 'text-success'}`} role="status">
                            <span className="visually-hidden">Listening...</span>
                        </div>
                        <span className="fw-bold small">{viewMode === 'listening' ? 'MIC ACTIVE' : 'SYSTEM ONLINE'}</span>
                    </div>
                </div>

                {/* Main Area */}
                <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-start mx-3 mb-4 w-100 position-relative">

                    {/* Default Screen Text - Active when no data is loaded */}
                    {activeData === 'none' && viewMode !== 'sleep' && (
                        <div className="text-center mt-5 mb-4" style={{ animation: 'fadeInUp 1s ease' }}>
                            <h1 className="fw-bold text-primary mb-2" style={{ fontSize: '3.5rem', letterSpacing: '-1.5px', opacity: 0.9 }}>
                                Virpanix Intelligent
                            </h1>
                            <p className="text-secondary fs-5">Your AI-Powered Command Center</p>
                        </div>
                    )}

                    {viewMode === 'sleep' && activeData === 'none' && (
                        <div className="text-center my-auto" style={{ animation: 'fadeInUp 1s ease', marginTop: '20vh' }}>
                            <h1 className="fw-bold text-primary" style={{ fontSize: '4rem', letterSpacing: '-2px', opacity: 0.3 }}>
                                Virpanix Intelligent
                            </h1>
                            <p className="text-secondary fs-4 mt-2" style={{ opacity: 0.5 }}>System resting in corner</p>
                        </div>
                    )}

                    {/* The Voice Hub Orb (Relative when awake, Absolute/Fixed when asleep) */}
                    <div
                        className={`z-3 text-center ${viewMode === 'sleep' ? 'position-fixed' : 'position-relative'}`}
                        style={viewMode === 'sleep' ? {
                            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            bottom: '30px',
                            right: '30px',
                            pointerEvents: 'none',
                            transform: 'scale(0.65)'
                        } : {
                            transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                            pointerEvents: 'none',
                            transform: 'scale(1)',
                            marginTop: activeData !== 'none' ? '0' : '20px',
                            marginBottom: activeData !== 'none' ? '2.5rem' : '0'
                        }}
                    >
                        <div style={{ pointerEvents: 'auto' }}>
                            <button
                                onClick={startListening}
                                className={`btn rounded-circle p-0 position-relative border-0 shadow-lg ${viewMode === 'listening' ? 'bg-danger' : 'bg-primary'}`}
                                style={{
                                    width: viewMode === 'listening' ? '120px' : '100px',
                                    height: viewMode === 'listening' ? '120px' : '100px',
                                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                }}
                            >
                                <i className={`bi bi-mic-fill text-white ${viewMode === 'listening' ? 'fs-1' : 'fs-2'}`}></i>
                                {(viewMode === 'listening' || viewMode === 'processing') && (
                                    <div className="position-absolute top-0 start-0 w-100 h-100 rounded-circle border border-2 border-white" style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                                )}
                            </button>

                            {/* Text under orb */}
                            {viewMode === 'sleep' ? (
                                <div className="mt-3 bg-white px-3 py-2 rounded-pill shadow-sm d-inline-block" style={{ opacity: 0.9 }}>
                                    <h6 className="fw-bold text-dark mb-0 small">Sleeping. Say "Wake up"</h6>
                                </div>
                            ) : (
                                <div className="mt-4 bg-white px-4 py-2 rounded-4 shadow-sm text-center d-inline-block" style={{ minWidth: '250px', opacity: 0.95 }}>
                                    {viewMode === 'listening' || viewMode === 'processing' ? (
                                        <div className="d-flex justify-content-center gap-1 mb-2" style={{ height: '30px', alignItems: 'center' }}>
                                            {speechIntensity.map((height, i) => (
                                                <div
                                                    key={i}
                                                    style={{
                                                        width: '4px',
                                                        height: `${height}px`,
                                                        backgroundColor: '#0d6efd',
                                                        borderRadius: '2px',
                                                        transition: 'height 0.1s ease',
                                                        animation: viewMode === 'processing' ? 'pulse 1s infinite alternate' : 'none'
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ height: '20px' }}></div>
                                    )}
                                    <h5 className="fw-bold text-dark mb-1">{commandFeedback}</h5>
                                    {viewMode === 'idle' && (
                                        <p className="text-secondary small mb-1">Try: "List new leads" or "Show today's bookings"</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Data Views */}
                    <div className="w-100 mt-2 px-3" style={{ maxWidth: '1200px' }}>

                        {loading && viewMode !== 'processing' && (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-3 fw-bold text-secondary">Synthesizing data matrices...</p>
                            </div>
                        )}

                        {!loading && activeData === 'leads' && (
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ animation: 'fadeInUp 0.5s ease' }}>
                                <div className="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0"><i className="bi bi-funnel-fill text-primary me-2"></i> Artificial Lead Sourcing</h5>
                                    <span className="badge bg-primary rounded-pill px-3 py-2">{leads.length} Results</span>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">Client</th>
                                                <th>Contact</th>
                                                <th>Property Interest</th>
                                                <th>Status</th>
                                                <th className="pe-4 text-end">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leads.length > 0 ? leads.map((lead) => (
                                                <tr key={lead.id}>
                                                    <td className="ps-4">
                                                        <div className="fw-bold text-dark">{lead.name}</div>
                                                        <div className="small text-muted">Lead ID: {lead.id.substring(0, 8).toUpperCase()}</div>
                                                    </td>
                                                    <td>
                                                        <div className="small"><i className="bi bi-envelope me-1"></i>{lead.email || 'N/A'}</div>
                                                        <div className="small"><i className="bi bi-telephone me-1"></i>{lead.phone || 'N/A'}</div>
                                                    </td>
                                                    <td>{lead.property?.title || 'General Inquiry'}</td>
                                                    <td>{getStatusBadge(lead.status, 'lead')}</td>
                                                    <td className="pe-4 text-end small text-secondary">{new Date(lead.createdAt).toLocaleDateString()}</td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={5} className="text-center py-5 text-muted">No leads found matching this criteria.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {!loading && activeData === 'bookings' && (
                            <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ animation: 'fadeInUp 0.5s ease' }}>
                                <div className="card-header bg-white p-4 border-bottom d-flex justify-content-between align-items-center">
                                    <h5 className="fw-bold mb-0"><i className="bi bi-calendar-check text-primary me-2"></i> Booking Intelligence</h5>
                                    <span className="badge bg-primary rounded-pill px-3 py-2">{bookings.length} Results</span>
                                </div>
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                <th className="ps-4">Reference</th>
                                                <th>Client / Guest</th>
                                                <th>Schedule</th>
                                                <th>Status</th>
                                                <th className="pe-4 text-end">Value</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.length > 0 ? bookings.map((booking) => (
                                                <tr key={booking.id}>
                                                    <td className="ps-4">
                                                        <div className="fw-bold text-dark">{booking.id.substring(0, 8).toUpperCase()}</div>
                                                        <div className="small text-muted">{booking.property?.title || 'Unknown Property'}</div>
                                                    </td>
                                                    <td>
                                                        <div className="fw-semibold">{booking.guestName || booking.user?.name || 'Unknown'}</div>
                                                        <div className="small text-muted">{booking.guestEmail || booking.user?.email}</div>
                                                    </td>
                                                    <td>
                                                        <div className="small fw-semibold">{new Date(booking.startAt).toLocaleDateString()}</div>
                                                        <div className="small text-muted">to {new Date(booking.endAt).toLocaleDateString()}</div>
                                                    </td>
                                                    <td>{getStatusBadge(booking.status, 'booking')}</td>
                                                    <td className="pe-4 text-end fw-bold">
                                                        {booking.totalPrice ? `$${booking.totalPrice.toLocaleString()}` : '-'}
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={5} className="text-center py-5 text-muted">No bookings found matching this criteria.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                <style>{`
            @keyframes ping {
                75%, 100% {
                    transform: scale(1.5);
                    opacity: 0;
                }
            }
            @keyframes pulse {
                0% { transform: scaleY(1); }
                100% { transform: scaleY(1.2); }
            }
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .scale-75 {
                transform: scale(0.75);
            }
        `}</style>
            </div>
        </MainLayout>
    );
}
