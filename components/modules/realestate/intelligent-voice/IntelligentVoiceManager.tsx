'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { leadService, bookingService, Lead, Booking } from '@/app/services/api';
import Image from 'next/image';
import MainLayout from '@/components/MainLayout';
import VoiceOrb from './components/VoiceOrb';
import LeadsDataView from './components/LeadsDataView';
import BookingsDataView from './components/BookingsDataView';
import { matchConversation } from './utils/conversationEngine';

export type ViewMode = 'idle' | 'listening' | 'processing' | 'leads' | 'bookings' | 'sleep';

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
                speak("Will see you soon, Thank you.");
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
            // --- Sleep command (special: handled before conversation engine) ---
            if (command.includes('sleep') || command.includes('go to sleep') || command.includes('goto sleep')) {
                speak("Will see you soon, Thank you.");
                setViewMode('sleep');
                setCommandFeedback("Sleeping.");
                setLoading(false);
                return;
            }

            // --- Conversation engine: handles greetings, small-talk, identity etc. ---
            const conversationReply = matchConversation(command);
            if (conversationReply) {
                // If it's a goodbye, trigger sleep after speaking
                const isGoodbye = ['bye', 'goodbye', 'see you', 'later', 'take care', 'talk soon']
                    .some(w => command.toLowerCase().includes(w));
                await speak(conversationReply);
                setCommandFeedback(conversationReply.length > 80 ? conversationReply.substring(0, 80) + '…' : conversationReply);
                if (isGoodbye) {
                    setViewMode('sleep');
                } else {
                    setViewMode('idle');
                    triggerAutoSleep();
                }
                setActiveData('none');
                setLoading(false);
                return;
            }

            // --- Data commands need authentication ---
            if (!token) {
                await speak("You need to be logged in to access data.");
                setCommandFeedback("Authentication required. Please log in.");
                setViewMode('idle');
                setLoading(false);
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

                    const count = fetchedLeads.length;
                    if (count === 0) {
                        await speak("I couldn't find any leads matching that criteria.");
                        setCommandFeedback('No leads found matching your criteria.');
                    } else {
                        await speak(`I have listed ${count} ${count === 1 ? 'lead' : 'leads'} for you.`);
                        setCommandFeedback(`Found ${count} ${count === 1 ? 'lead' : 'leads'} matching your criteria.`);
                    }
                    triggerAutoSleep();
                } else {
                    await speak("Sorry, I had trouble loading your leads. Please try again.");
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

                    const count = bookingsData.length;
                    if (count === 0) {
                        await speak("I couldn't find any bookings matching that criteria.");
                        setCommandFeedback('No bookings found matching your criteria.');
                    } else {
                        await speak(`I have listed ${count} ${count === 1 ? 'booking' : 'bookings'} for you.`);
                        setCommandFeedback(`Found ${count} ${count === 1 ? 'booking' : 'bookings'} matching your criteria.`);
                    }
                    triggerAutoSleep();
                } else {
                    await speak("Sorry, I had trouble loading your bookings. Please try again.");
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

                    {/* The Voice Hub Orb (Relative when awake, Fixed when asleep) */}
                    <VoiceOrb
                        viewMode={viewMode}
                        activeData={activeData}
                        startListening={startListening}
                        speechIntensity={speechIntensity}
                        commandFeedback={commandFeedback}
                    />

                    {/* Dynamic Data Views */}
                    <div className="w-100 mt-2 px-3" style={{ maxWidth: '1200px' }}>

                        {loading && viewMode !== 'processing' && (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-3 fw-bold text-secondary">Synthesizing data matrices...</p>
                            </div>
                        )}

                        {!loading && activeData === 'leads' && (
                            <LeadsDataView leads={leads} />
                        )}

                        {!loading && activeData === 'bookings' && (
                            <BookingsDataView bookings={bookings} />
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
                `}</style>
            </div>
        </MainLayout>
    );
}
