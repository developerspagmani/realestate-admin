'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '@/app/contexts/AuthContext';
import { leadService, bookingService, analyticsProService, agentService, Lead, Booking } from '@/app/services/api';
import MainLayout from '@/components/MainLayout';
import VoiceOrb from './components/VoiceOrb';
import LeadsDataView from './components/LeadsDataView';
import BookingsDataView from './components/BookingsDataView';
import ForecastingView from './components/ForecastingView';
import PreventionView from './components/PreventionView';
import AgentSelectionView from './components/AgentSelectionView';
import { matchConversation } from './utils/conversationEngine';

export type ViewMode = 'idle' | 'listening' | 'processing' | 'leads' | 'bookings' | 'forecasting' | 'prevention' | 'awaiting_agent_selection' | 'sleep';
export type ActiveDataType = 'leads' | 'bookings' | 'forecasting' | 'prevention' | 'agent_selection' | 'none';

export default function IntelligentVoiceManager() {
    const { user, token } = useAuthContext();
    const [viewMode, setViewMode] = useState<ViewMode>('idle');
    const [commandFeedback, setCommandFeedback] = useState('Say "Wake up" or click the mic to begin');
    const [speechIntensity, setSpeechIntensity] = useState([1, 1, 1, 1, 1]);
    const [leads, setLeads] = useState<Lead[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [forecastingData, setForecastingData] = useState<any>(null);
    const [preventionData, setPreventionData] = useState<any>(null);
    const [agents, setAgents] = useState<any[]>([]);
    const [selectedLeadForTask, setSelectedLeadForTask] = useState<any>(null);
    const [activeData, setActiveData] = useState<ActiveDataType>('none');
    const [loading, setLoading] = useState(false);
    const recognitionRef = useRef<any>(null);
    const sleepTimeoutRef = useRef<any>(null);
    const followUpTimeoutRef = useRef<any>(null);

    const triggerAutoSleep = () => {
        if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
        sleepTimeoutRef.current = setTimeout(() => {
            setViewMode(prev => {
                if (prev === 'leads' || prev === 'bookings' || prev === 'idle') return 'sleep';
                return prev;
            });
        }, 15000);
    };

    /**
     * After a command finishes, automatically re-open the mic so the user
     * can ask a follow-up immediately. If nothing is said within 15 s → sleep.
     */
    const startFollowUpListening = () => {
        if (followUpTimeoutRef.current) clearTimeout(followUpTimeoutRef.current);
        // Small pause so speech synthesis has fully ended before mic opens
        followUpTimeoutRef.current = setTimeout(() => {
            startListening();
        }, 600);
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
            if (viewMode === 'listening' || viewMode === 'processing') return;

            const current = event.resultIndex;
            const transcript = event.results[current][0].transcript.toLowerCase();

            if (transcript.includes('hello system') || transcript.includes('start voice') || transcript.includes('wake up') || transcript.includes('virpanix')) {
                recognition.stop();
                if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
                if (followUpTimeoutRef.current) clearTimeout(followUpTimeoutRef.current);
                startListening();
            } else if (transcript.includes('go to sleep') || transcript.includes('goto sleep') || transcript.includes('sleep')) {
                recognition.stop();
                setViewMode('sleep');
                speak("Will see you soon, Thank you.");
            }
        };

        recognition.onend = () => {
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

    // Clear timers on unmount
    useEffect(() => {
        return () => {
            if (followUpTimeoutRef.current) clearTimeout(followUpTimeoutRef.current);

            if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
        };
    }, []);

    const startListening = async () => {
        if (sleepTimeoutRef.current) clearTimeout(sleepTimeoutRef.current);
        if (followUpTimeoutRef.current) clearTimeout(followUpTimeoutRef.current);

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        if (!SpeechRecognition) {
            alert("Speech recognition not supported in this browser. Please use Chrome or Edge.");
            return;
        }

        try {
            setCommandFeedback('Waking up...');
            setViewMode('listening');
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
            setCommandFeedback(`Processing: "${command}"`);
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
            // --- Multi-turn: Agent Selection state ---
            if (viewMode === 'awaiting_agent_selection' && selectedLeadForTask) {
                // Try to find the agent by name
                const matchedAgent = agents.find(a =>
                    command.toLowerCase().includes(a.name?.toLowerCase()) ||
                    a.name?.toLowerCase().includes(command.toLowerCase())
                );

                if (matchedAgent) {
                    await speak(`Understood. Assigning ${selectedLeadForTask.name} to ${matchedAgent.name} now.`);
                    // We call the service to assign
                    const res = await agentService.assignLead(token || '', {
                        agentId: matchedAgent.agentId,
                        leadId: selectedLeadForTask.id,
                        notes: "Assigned via Voice Command Center for urgent follow-up."
                    });

                    if (res.success) {
                        await speak("Assignment complete. I've sent a notification to the agent.");
                        setCommandFeedback(`Successfully assigned ${selectedLeadForTask.name} to ${matchedAgent.name}.`);
                    } else {
                        await speak("I had trouble with the assignment. Please try again or use the manual dashboard.");
                        setCommandFeedback("Lead assignment API failed.");
                    }

                    setViewMode('idle');
                    setActiveData('prevention');
                    setSelectedLeadForTask(null);
                    startFollowUpListening();
                } else {
                    await speak("I didn't catch that agent's name. Please say one of the names shown on screen.");
                    setCommandFeedback("Agent not matched. Please repeat name.");
                    setViewMode('awaiting_agent_selection'); // Keep waiting
                    startFollowUpListening();
                }
                setLoading(false);
                return;
            }

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
                const isGoodbye = ['bye', 'goodbye', 'see you', 'later', 'take care', 'talk soon']
                    .some(w => command.toLowerCase().includes(w));
                await speak(conversationReply);
                setCommandFeedback(conversationReply.length > 80 ? conversationReply.substring(0, 80) + '…' : conversationReply);
                if (isGoodbye) {
                    setViewMode('sleep');
                } else {
                    setViewMode('idle');
                    setActiveData('none');
                    // Re-open mic immediately for follow-up
                    startFollowUpListening();
                }
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

            // --- Forecasting Intelligence ---
            if (command.includes('shortage') || command.includes('gaps') || command.includes('client looking') || command.includes('demand') || command.includes('improve')) {
                await speak("Analyzing market search signals and inventory gaps...");
                const res = await analyticsProService.getDemandIntelligence();

                if (res.success && res.data) {
                    setForecastingData(res.data);
                    setActiveData('forecasting');
                    setViewMode('idle');

                    let voiceMsg = "";
                    if (command.includes('shortage') || command.includes('gaps')) {
                        const topShortage = res.data.keywordShortages?.[0]?.keyword || "modern amenities";
                        voiceMsg = `I've detected a significant shortage in properties matching ${topShortage}. You have a supply gap of ${res.data.keywordShortages?.[0]?.gap || 10} units here.`;
                    } else if (command.includes('looking mostly')) {
                        voiceMsg = `Clients are mostly looking for ${res.data.keywordShortages?.[0]?.keyword || 'urban flats'}. I recommend expanding horizontal growth in this niche.`;
                    } else if (command.includes('improve')) {
                        voiceMsg = `Based on AI analysis, ${res.data.recommendations?.[0]?.title || 'optimizing pricing'} is your top priority for higher conversion.`;
                    } else {
                        voiceMsg = `Current demand is strong with ${res.data.summary.totalSearches} search signals. Markets are trending towards ${res.data.summary.avgBuyerBudget > 1000000 ? 'high-end luxury' : 'affordable housing'}.`;
                    }

                    await speak(voiceMsg);
                    setCommandFeedback("Forecasting Data Synthesized.");
                    startFollowUpListening();
                } else {
                    await speak("I couldn't retrieve the growth intelligence. System busy.");
                    setCommandFeedback("Forecasting API failed.");
                    setViewMode('idle');
                }
            }
            // --- Risk Prevention & Inactive Leads ---
            else if (command.includes('inactive leads') || command.includes('high risk') || command.includes('leakage')) {
                await speak("Identifying high-risk deals and pipeline leakage...");
                const res = await analyticsProService.getPreventionInsights();
                const agentsRes = await agentService.getAgents(token);

                if (res.success && res.data) {
                    setPreventionData(res.data);

                    let agentList = [];
                    if (agentsRes.success) {
                        if (Array.isArray(agentsRes.data)) agentList = agentsRes.data;
                        else if (agentsRes.data?.agents && Array.isArray(agentsRes.data.agents)) agentList = agentsRes.data.agents;
                        else if (agentsRes.data?.data && Array.isArray(agentsRes.data.data)) agentList = agentsRes.data.data;
                    }
                    setAgents(agentList);

                    setActiveData('prevention');

                    const highRiskCount = res.data.highRiskDeals?.length || 0;
                    if (highRiskCount > 0) {
                        const topLead = res.data.highRiskDeals[0];
                        setSelectedLeadForTask(topLead);

                        await speak(`I found ${highRiskCount} leads at high risk. The most critical is ${topLead.name} with a risk score of ${topLead.score}. Which agent should I assign this to?`);
                        setCommandFeedback(`Critical Risk: ${topLead.name} (${topLead.score}%). Awaiting agent name...`);
                        setViewMode('awaiting_agent_selection');
                        setActiveData('agent_selection');
                        // System remains listening for next turn
                    } else {
                        await speak("Your pipeline looks healthy. No high-risk inactive leads detected.");
                        setCommandFeedback("No high risk deals found.");
                        setViewMode('idle');
                    }
                    startFollowUpListening();
                } else {
                    await speak("Unable to run risk assessment currently.");
                    setCommandFeedback("Prevention API failed.");
                    setViewMode('idle');
                }
            }
            else if (command.includes('lead')) {
                let statusFilter = '';
                let intentMsg = "Pulling up your leads...";

                if (command.includes('new')) {
                    statusFilter = '1';
                    intentMsg = "Pulling up your new leads";
                } else if (command.includes('lost')) {
                    statusFilter = '4';
                    intentMsg = "Pulling up lost leads";
                } else if (command.includes('1.5') || command.includes('budget') || command.includes('cr')) {
                    intentMsg = "Scanning for high value leads near 1.5 Crores";
                }

                await speak(intentMsg);

                const response = await leadService.getLeads(token, { limit: '50', status: statusFilter });

                let leadsData = null;
                if (Array.isArray(response)) leadsData = response;
                else if (response?.data?.leads && Array.isArray(response.data.leads)) leadsData = response.data.leads;
                else if (response?.data && Array.isArray(response.data)) leadsData = response.data;
                else if (response?.success) leadsData = [];

                if (leadsData !== null) {
                    let fetchedLeads = leadsData;
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
                        await speak(`I have listed ${count} ${count === 1 ? 'lead' : 'leads'} for you. Would you like to know anything else?`);
                        setCommandFeedback(`Found ${count} ${count === 1 ? 'lead' : 'leads'} — Listening for next question...`);
                    }
                    // Stay ready for follow-up
                    startFollowUpListening();
                } else {
                    await speak("Sorry, I had trouble loading your leads. Please try again.");
                    setCommandFeedback(`Failed to load leads or format unknown.`);
                    setActiveData('none');
                    setViewMode('idle');
                    triggerAutoSleep();
                }
            }
            else if (command.includes('booking')) {
                let intentMsg = "Pulling up your bookings...";
                const params: any = { limit: '50' };

                if (command.includes('upcoming') || command.includes('future')) {
                    params.status = '1,2';
                    intentMsg = "Pulling up your upcoming bookings...";
                } else if (command.includes('closed') || command.includes('completed')) {
                    params.status = '4';
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
                        await speak(`I have listed ${count} ${count === 1 ? 'booking' : 'bookings'} for you. Would you like to know anything else?`);
                        setCommandFeedback(`Found ${count} ${count === 1 ? 'booking' : 'bookings'} — Listening for next question...`);
                    }
                    // Stay ready for follow-up
                    startFollowUpListening();
                } else {
                    await speak("Sorry, I had trouble loading your bookings. Please try again.");
                    setCommandFeedback(`Failed to load bookings or format unknown.`);
                    setActiveData('none');
                    setViewMode('idle');
                    triggerAutoSleep();
                }
            }
            else {
                await speak("I didn't recognize that command. Please ask for leads, bookings, or market forecasting.");
                setCommandFeedback("Unrecognized. Try 'List inactive leads' or 'Show demand'.");
                setViewMode('idle');
                startFollowUpListening();
            }

        } catch (e) {
            console.error(e);
            setCommandFeedback('Failed to execute command. System error.');
            setViewMode('idle');
        } finally {
            setLoading(false);
        }
    };

    const statusColor = viewMode === 'listening' ? '#ef4444'
        : viewMode === 'processing' ? '#f59e0b'
            : viewMode === 'sleep' ? '#6b7280'
                : '#10b981';

    const statusLabel = viewMode === 'listening' ? 'MIC ACTIVE'
        : viewMode === 'processing' ? 'PROCESSING'
            : viewMode === 'sleep' ? 'SLEEPING'
                : 'SYSTEM ONLINE';

    return (
        <MainLayout activePage="intelligent-voice">
            <div
                className="min-vh-100 d-flex flex-column position-relative"
                style={{
                    background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 40%, #0a1628 100%)',
                    fontFamily: "'Inter', sans-serif"
                }}
            >
                {/* Animated background grid */}
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 0,
                    backgroundImage: `
                        linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    pointerEvents: 'none'
                }} />

                {/* Glowing orbs in background */}
                <div style={{
                    position: 'fixed', top: '10%', left: '5%', width: '400px', height: '400px',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
                }} />
                <div style={{
                    position: 'fixed', bottom: '10%', right: '5%', width: '350px', height: '350px',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                    borderRadius: '50%', pointerEvents: 'none', zIndex: 0
                }} />

                {/* Header */}
                <div className="d-flex justify-content-between align-items-center px-4 py-3 flex-shrink-0 position-relative" style={{ zIndex: 1, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="d-flex align-items-center gap-3">
                        {/* Logo / Brand */}
                        <div style={{
                            width: '42px', height: '42px', borderRadius: '12px',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 0 20px rgba(59,130,246,0.4)'
                        }}>
                            <i className="bi bi-cpu-fill text-white" style={{ fontSize: '1.2rem' }}></i>
                        </div>
                        <div>
                            <h5 className="fw-bold mb-0" style={{ color: '#f1f5f9', letterSpacing: '0.5px' }}>
                                Virpanix <span style={{ color: '#3b82f6' }}>Intelligence</span>
                            </h5>
                            <p className="mb-0" style={{ color: '#64748b', fontSize: '0.75rem' }}>
                                AI-Powered Voice Command Center
                            </p>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3">
                        {/* Listening pulse shown in header when mic auto-reopens */}
                        {viewMode === 'listening' && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.3)',
                                borderRadius: '20px', padding: '6px 14px',
                                animation: 'pulse-glow 0.8s ease infinite alternate'
                            }}>
                                <i className="bi bi-mic-fill" style={{ fontSize: '0.8rem', color: '#f87171' }}></i>
                                <span style={{ color: '#fca5a5', fontSize: '0.78rem', fontWeight: 600 }}>
                                    Listening...
                                </span>
                            </div>
                        )}

                        {/* Status indicator */}
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '20px', padding: '7px 16px'
                        }}>
                            <div style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                backgroundColor: statusColor,
                                boxShadow: `0 0 8px ${statusColor}`,
                                animation: viewMode === 'listening' ? 'ping 1s infinite' : viewMode === 'processing' ? 'pulse-dot 0.6s infinite alternate' : 'none'
                            }} />
                            <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '1px' }}>
                                {statusLabel}
                            </span>
                        </div>

                        {/* User chip */}
                        {user && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '20px', padding: '6px 14px'
                            }}>
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.65rem', color: 'white', fontWeight: 700
                                }}>
                                    {(user as any)?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                                    {(user as any)?.name || 'User'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-grow-1 d-flex flex-column align-items-center position-relative" style={{ zIndex: 1, padding: '2rem 1.5rem' }}>

                    {/* Default Screen — no data */}
                    {activeData === 'none' && viewMode !== 'sleep' && (
                        <div className="text-center mb-5" style={{ animation: 'fadeInUp 0.8s ease' }}>
                            <p style={{ color: '#3b82f6', fontSize: '0.78rem', letterSpacing: '3px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>
                                ◆ VIRPANIX AI ◆
                            </p>
                            <h1 style={{
                                fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
                                fontWeight: 800, letterSpacing: '-2px', lineHeight: 1.1,
                                background: 'linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #a78bfa 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                marginBottom: '16px'
                            }}>
                                Intelligent Command
                            </h1>
                            <p style={{ color: '#475569', fontSize: '1.05rem' }}>
                                Speak naturally · Get instant real-estate insights
                            </p>

                            {/* Quick command chips */}
                            {viewMode === 'idle' && (
                                <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
                                    {['"List new leads"', '"Show today\'s bookings"', '"How are you?"', '"Who are you?"'].map(cmd => (
                                        <span key={cmd} style={{
                                            background: 'rgba(59,130,246,0.08)',
                                            border: '1px solid rgba(59,130,246,0.2)',
                                            borderRadius: '20px', padding: '5px 14px',
                                            color: '#93c5fd', fontSize: '0.8rem', fontWeight: 500
                                        }}>
                                            {cmd}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Sleep Screen */}
                    {viewMode === 'sleep' && activeData === 'none' && (
                        <div className="text-center" style={{ animation: 'fadeInUp 1s ease', marginTop: '10vh' }}>
                            <h1 style={{
                                fontSize: '4rem', fontWeight: 800, letterSpacing: '-2px',
                                background: 'linear-gradient(135deg, #1e3a5f, #2d1b69)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                opacity: 0.4
                            }}>
                                Virpanix Intelligent
                            </h1>
                            <p style={{ color: '#334155', fontSize: '1rem', opacity: 0.5, marginTop: '8px' }}>
                                Resting · Say &quot;Wake up&quot; to resume
                            </p>
                        </div>
                    )}

                    {/* Voice Orb */}
                    <VoiceOrb
                        viewMode={viewMode}
                        activeData={activeData}
                        startListening={startListening}
                        speechIntensity={speechIntensity}
                        commandFeedback={commandFeedback}
                    />

                    {/* Data Views */}
                    <div className="w-100" style={{ maxWidth: '1100px' }}>
                        {loading && viewMode !== 'processing' && (
                            <div className="text-center py-5">
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%',
                                    border: '3px solid rgba(59,130,246,0.2)',
                                    borderTopColor: '#3b82f6',
                                    animation: 'spin 0.8s linear infinite',
                                    margin: '0 auto 16px'
                                }} />
                                <p style={{ color: '#475569', fontWeight: 600 }}>Synthesizing data matrices...</p>
                            </div>
                        )}

                        {!loading && activeData === 'leads' && (
                            <LeadsDataView leads={leads} />
                        )}

                        {!loading && activeData === 'bookings' && (
                            <BookingsDataView bookings={bookings} />
                        )}

                        {!loading && activeData === 'forecasting' && (
                            <ForecastingView data={forecastingData} />
                        )}

                        {!loading && activeData === 'prevention' && (
                            <PreventionView data={preventionData} />
                        )}

                        {!loading && activeData === 'agent_selection' && (
                            <AgentSelectionView
                                agents={agents}
                                selectedLeadName={selectedLeadForTask?.name}
                            />
                        )}
                    </div>
                </div>

                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                    @keyframes ping {
                        75%, 100% { transform: scale(1.5); opacity: 0; }
                    }
                    @keyframes pulse-dot {
                        from { opacity: 0.5; }
                        to   { opacity: 1;   }
                    }
                    @keyframes pulse-glow {
                        from { box-shadow: 0 0 0px rgba(59,130,246,0.3); }
                        to   { box-shadow: 0 0 12px rgba(59,130,246,0.5); }
                    }
                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(24px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes spin {
                        to { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        </MainLayout>
    );
}
