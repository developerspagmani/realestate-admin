'use client';

import { useState, useEffect, useRef } from 'react';
import { Property, MediaItem, Unit } from '@/types';

interface ChatbotProps {
    theme: any;
    properties: any[];
    onFilterResults: (results: Property[]) => void;
    onClose: () => void;
    onSelectProperty: (property: Property) => void;
    onCreateLead: (contact: string, name?: string) => Promise<void>;
    onExpandToggle?: (expanded: boolean) => void;
    customWelcomeTitle?: string;
    customWelcomeSubtext?: string;
    leadCaptureMode?: 'email' | 'mobile' | 'both';
    flow?: string[];
    upsellEnabled?: boolean;
    crossSellEnabled?: boolean;
    recommendationLogic?: 'price-match' | 'newest' | 'featured';
    previewMode?: boolean;
    trackAction?: (type: string, metadata?: Record<string, unknown>) => void;
    currencySymbol?: string;
    budgetRanges?: { label: string, min?: number, max?: number }[];
    aiEnabled?: boolean | string;
    propertyId?: string;
    aiName?: string;
    tenantId?: string;
}

type Step = 'IDLE' | 'LEAD_CAPTURE' | 'HI' | 'DYNAMIC_FLOW' | 'RESULTS';

const STORAGE_KEY = 'cw_chatbot_session';

const CheckboxGroup = ({ options, onConfirm, theme, onMessage }: { options: { label: string, value: string }[], onConfirm: (vals: string[]) => void, theme: any, onMessage: (msg: string) => void }) => {
    const [selected, setSelected] = useState<string[]>([]);
    return (
        <div className="bg-white p-3 rounded-4 shadow-sm border border-light animate-fade-in mb-2">
            <div className="d-flex flex-wrap gap-2 mb-3">
                {options.map(opt => (
                    <div key={opt.value} className="form-check form-check-inline m-0">
                        <input
                            className="btn-check"
                            type="checkbox"
                            id={`check-${opt.value}`}
                            checked={selected.includes(opt.value)}
                            onChange={(e) => {
                                if (e.target.checked) setSelected(prev => [...prev, opt.value]);
                                else setSelected(prev => prev.filter(v => v !== opt.value));
                            }}
                        />
                        <label
                            className={`btn btn-sm rounded-4 px-3 border-0 transition-all ${selected.includes(opt.value) ? 'text-white' : 'bg-light text-muted'}`}
                            style={{ backgroundColor: selected.includes(opt.value) ? theme.primaryColor : undefined }}
                            htmlFor={`check-${opt.value}`}
                        >
                            {opt.label}
                        </label>
                    </div>
                ))}
            </div>
            <button
                className="btn btn-primary w-100 rounded-4 btn-sm fw-bold shadow-sm"
                style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                onClick={() => {
                    if (selected.length > 0) onConfirm(selected);
                    else onMessage('Please select at least one option to continue.');
                }}
            >
                Confirm Selection
            </button>
        </div>
    );
};

// Lightweight markdown renderer for AI bot responses
const MarkdownMessage = ({ text, primaryColor }: { text: string; primaryColor: string }) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;

    const renderInline = (line: string) => {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, idx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={idx} className="fw-bold">{part.slice(2, -2)}</strong>;
            }
            return <span key={idx}>{part}</span>;
        });
    };

    while (i < lines.length) {
        const line = lines[i];
        const trimmed = line.trim();

        if (!trimmed) { elements.push(<div key={i} style={{ height: '4px' }} />); i++; continue; }

        // Property block: [Property N] Title
        if (/^\[Property \d+\]/.test(trimmed)) {
            const title = trimmed.replace(/^\[Property \d+\]\s*/, '');
            const details: string[] = [];
            i++;
            while (i < lines.length && (lines[i].startsWith('  ') || lines[i].trim() === '')) {
                if (lines[i].trim()) details.push(lines[i].trim());
                i++;
            }
            elements.push(
                <div key={`prop-${i}`} className="rounded-3 border overflow-hidden mb-2 animate-fade-in"
                    style={{ backgroundColor: '#f8f9ff', borderColor: `${primaryColor}44` }}>
                    <div className="px-3 py-2" style={{ backgroundColor: primaryColor }}>
                        <span className="fw-bold text-white" style={{ fontSize: '11px' }}>
                            <i className="bi bi-building me-1"></i>{title}
                        </span>
                    </div>
                    <div className="px-3 py-2">
                        {details.map((d, di) => {
                            const colonIdx = d.indexOf(':');
                            if (colonIdx > -1) {
                                const label = d.slice(0, colonIdx).trim();
                                const value = d.slice(colonIdx + 1).trim();
                                return (
                                    <div key={di} className="d-flex gap-1 mb-1" style={{ fontSize: '11px' }}>
                                        <span className="text-muted fw-semibold" style={{ minWidth: '90px', flexShrink: 0 }}>{label}:</span>
                                        <span className="text-dark">{value}</span>
                                    </div>
                                );
                            }
                            return <div key={di} style={{ fontSize: '11px' }} className="text-muted">{d}</div>;
                        })}
                    </div>
                </div>
            );
            continue;
        }

        // Bullet: - item or * item
        if (/^[-*•]\s/.test(trimmed)) {
            const bulletItems: string[] = [];
            while (i < lines.length && /^[-*•]\s/.test(lines[i].trim())) {
                bulletItems.push(lines[i].trim().replace(/^[-*•]\s/, ''));
                i++;
            }
            elements.push(
                <ul key={`ul-${i}`} className="mb-1 ps-0" style={{ fontSize: '12px', listStyle: 'none' }}>
                    {bulletItems.map((item, bi) => (
                        <li key={bi} className="mb-1 d-flex gap-1">
                            <span style={{ color: primaryColor }}>▪</span>
                            <span>{renderInline(item)}</span>
                        </li>
                    ))}
                </ul>
            );
            continue;
        }

        // Numbered: 1. item
        if (/^\d+\.\s/.test(trimmed)) {
            elements.push(
                <div key={i} className="mb-1 d-flex gap-1 align-items-start" style={{ fontSize: '12px' }}>
                    <span style={{ color: primaryColor, fontWeight: 600, minWidth: '16px' }}>{trimmed.match(/^\d+/)![0]}.</span>
                    <span>{renderInline(trimmed.replace(/^\d+\.\s/, ''))}</span>
                </div>
            );
            i++; continue;
        }

        // Default paragraph
        elements.push(
            <p key={i} className="mb-1" style={{ fontSize: '12px', lineHeight: '1.5', color: '#000000ff' }}>
                {renderInline(trimmed)}
            </p>
        );
        i++;
    }

    return <div>{elements}</div>;
};

export default function ChatbotWidget({
    theme, properties, onFilterResults, onClose, onSelectProperty, onCreateLead, onExpandToggle,
    customWelcomeTitle, customWelcomeSubtext, leadCaptureMode = 'both',
    flow = ['LOCATION', 'CITY', 'BUDGET'],
    upsellEnabled = true,
    crossSellEnabled = true,
    recommendationLogic = 'price-match',
    previewMode = false,
    trackAction,
    aiEnabled = false,
    propertyId,
    currencySymbol = '$',
    budgetRanges = [
        { label: `Low (< 1k)`, min: 0, max: 1000 },
        { label: `Mid (1k - 5k)`, min: 1000, max: 5000 },
        { label: `High (5k - 10k)`, min: 5000, max: 10000 },
        { label: `Luxury (> 10k)`, min: 10000 }
    ],
    aiName = "",
    tenantId
}: ChatbotProps) {
    const [step, setStep] = useState<Step>('IDLE');
    const [flowIndex, setFlowIndex] = useState(0);
    const [answers, setAnswers] = useState<any>({
        name: '',
        contact: '',
        LOCATION: [] as string[],
        CITY: [] as string[],
        BUDGET: [] as string[],
        BEDROOMS: [] as string[],
        TYPE: [] as string[]
    });
    const [messages, setMessages] = useState<{ role: 'bot' | 'user', text: string }[]>([]);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmittingLead, setIsSubmittingLead] = useState(false);
    const [isNeuralProcessing, setIsNeuralProcessing] = useState(false);
    const [intentScore, setIntentScore] = useState(0);
    const [processingMessage, setProcessingMessage] = useState('');
    const [inputText, setInputText] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const [compareProperties, setCompareProperties] = useState<any[]>([]);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (previewMode) return;
        const savedSession = localStorage.getItem(STORAGE_KEY);
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                setStep(session.step || 'IDLE');
                setAnswers(session.answers || { LOCATION: [], CITY: [], BUDGET: [], BEDROOMS: [], TYPE: [] });
                setMessages(session.messages || []);
                setFilteredResults(session.filteredResults || []);

                if (session.step === 'RESULTS' && session.filteredResults) {
                    onFilterResults(session.filteredResults);
                }
            } catch (e) {
                console.error('Failed to restore chatbot session', e);
            }
        }
    }, [onFilterResults, previewMode]);

    // PERSISTENCE: Save session to localStorage on state changes
    useEffect(() => {
        if (step !== 'IDLE' && !previewMode) {
            const session = { step, answers, messages, filteredResults };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        }
    }, [step, answers, messages, filteredResults, previewMode]);

    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [messages, filteredResults, step]);

    const addMessage = (role: 'bot' | 'user', text: string) => {
        setMessages(prev => [...prev, { role, text }]);
    };

    const handleReset = () => {
        localStorage.removeItem(STORAGE_KEY);
        setStep('IDLE');
        setAnswers({ name: '', contact: '', LOCATION: [], CITY: [], BUDGET: [], BEDROOMS: [], TYPE: [] });
        setMessages([]);
        setFilteredResults([]);
        onFilterResults(properties); // Restore all properties on main page
    };

    const handleAiChat = async (text: string) => {
        if (!text.trim() || isAiTyping) return;

        addMessage('user', text);
        setInputText('');
        setIsAiTyping(true);

        try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

            // Step 1: Get AI response
            const response = await fetch(`${apiBase}/widgets/public/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, { role: 'user', text }],
                    propertyId,
                    tenantId
                })
            });
            const data = await response.json();
            if (!data.success) {
                addMessage('bot', data.message || "I'm having trouble connecting to my neural core. 🧠");
                return;
            }

            let botMessage: string = data.data.message;

            // Step 2: Parse any [ACTION:...] tags from the response
            const actionTagRegex = /\[ACTION:([A-Z_]+)\|([^\]]+)\]/;
            const actionMatch = botMessage.match(actionTagRegex);

            if (actionMatch) {
                // Strip the action tag from the display message
                botMessage = botMessage.replace(actionTagRegex, '').trim();

                const actionType = actionMatch[1];
                const paramStr = actionMatch[2];
                const params: Record<string, string> = {};
                paramStr.split('|').forEach(p => {
                    const [k, v] = p.split('=');
                    if (k && v) params[k.trim()] = v.trim();
                });

                // Show the cleaned message first
                addMessage('bot', botMessage);

                // Step 3: Execute the real action
                setIsAiTyping(true);
                try {
                    if (actionType === 'SEND_EMAIL') {
                        // Try to get email from user contact saved in answers
                        const emailToUse = params.email || (answers.contact?.includes('@') ? answers.contact : '');
                        if (!emailToUse) {
                            addMessage('bot', "Could you share your email address so I can send the details? 📧");
                            return;
                        }

                        const actionRes = await fetch(`${apiBase}/widgets/public/chat/action`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'SEND_EMAIL',
                                email: emailToUse,
                                leadName: answers.name || 'Valued Customer',
                                tenantId
                            })
                        });
                        const actionData = await actionRes.json();
                        addMessage('bot', actionData.success
                            ? `✅ Done! I've sent the property details to **${emailToUse}**. Check your inbox shortly! 📩`
                            : `⚠️ ${actionData.message || 'Could not send email right now. Please try again.'}`
                        );
                    }

                    else if (actionType === 'BOOK_VISIT') {
                        const emailToUse = answers.contact?.includes('@') ? answers.contact : undefined;
                        const actionRes = await fetch(`${apiBase}/widgets/public/chat/action`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'BOOK_VISIT',
                                email: emailToUse,
                                leadName: answers.name || 'Chatbot Visitor',
                                tenantId,
                                notes: `AI chatbot booking request for: ${params.propertyTitle || 'property'}`
                            })
                        });
                        const actionData = await actionRes.json();
                        addMessage('bot', actionData.success
                            ? `🎉 Site visit booked! **Reference: ${actionData.booking?.qrCode}**\n- Property: ${actionData.booking?.propertyName || params.propertyTitle || 'Selected Property'}\n- Date: ${actionData.booking?.startAt ? new Date(actionData.booking.startAt).toLocaleDateString() : 'Tomorrow'}\n${emailToUse ? `- Confirmation sent to ${emailToUse}` : ''}`
                            : `⚠️ ${actionData.message || 'Could not create booking. Please try again.'}`
                        );
                    }

                    else if (actionType === 'COMPARE_PROPERTIES') {
                        const actionRes = await fetch(`${apiBase}/widgets/public/chat/action`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'COMPARE_PROPERTIES',
                                tenantId,
                                // Pass property names as we don't have IDs here; backend will match by title
                                propertyIds: []
                            })
                        });
                        const actionData = await actionRes.json();
                        if (actionData.success && actionData.data?.length >= 2) {
                            setCompareProperties(actionData.data.slice(0, 3));
                        } else {
                            addMessage('bot', 'Please tell me which specific properties you\'d like to compare (e.g. "compare [Property A] with [Property B]"). 🏘️');
                        }
                    }
                } catch {
                    addMessage('bot', 'I ran into a problem executing that action. Please try again. 🔄');
                } finally {
                    setIsAiTyping(false);
                }
            } else {
                addMessage('bot', botMessage);
            }
        } catch (error) {
            console.error('AI Chat Error:', error);
            addMessage('bot', "I'm offline right now. Please try again later.");
        } finally {
            setIsAiTyping(false);
        }
    };

    const handleLeadSubmit = async (formData: { name: string, contact: string }) => {
        if (!formData.contact) return;
        setIsSubmittingLead(true);
        if (trackAction) trackAction('CHAT_START_CONVERSATION', { name: formData.name });
        try {
            // Simplified call to onCreateLead - we'll update the signature in the parent
            await (onCreateLead as any)(formData.contact, formData.name);
            if (trackAction) trackAction('LEAD_SUBMITTED', { method: 'chatbot', contact: formData.contact });
            setStep('HI');
            addMessage('bot', `Thank you ${formData.name}! We've saved your contact information safely. 🔒`);
            setTimeout(() => {
                const isAi = aiEnabled === true || aiEnabled === 'true';
                addMessage('bot', `Hi there! I'm ${aiName}. ${isAi ? 'You can ask me anything about our properties!' : 'Need help finding the perfect place?'}`);
                setTimeout(() => {
                    const isAi = aiEnabled === true || aiEnabled === 'true';
                    if (isAi) {
                        setStep('RESULTS'); // Reuse results step or create AI step
                        addMessage('bot', 'How can I help you today?');
                    } else if (flow && flow.length > 0) {
                        setStep('DYNAMIC_FLOW');
                        setFlowIndex(0);
                        askFlowQuestion(flow[0]);
                    } else {
                        setStep('RESULTS');
                        calculateResults();
                    }
                }, 800);
            }, 800);
        } catch (error) {
            console.error('Lead capture failed:', error);
            setStep('HI');
            // Show friendly error message so user knows what happened, even if we logged the error
            addMessage('bot', 'Sorry, I had trouble saving your details. Please try again or contact us directly.');
        } finally {
            setIsSubmittingLead(false);
        }
    };

    const handleChatAgain = () => {
        setAnswers((prev: any) => ({ ...prev, LOCATION: [], CITY: [], BUDGET: [], BEDROOMS: [], TYPE: [] }));
        setFilteredResults([]);
        addMessage('bot', 'No problem! Let\'s start a new search. 🧐');
        setTimeout(() => {
            const isAi = aiEnabled === true || aiEnabled === 'true';
            if (isAi) {
                setStep('RESULTS');
                addMessage('bot', 'How can I help you today?');
            } else if (flow && flow.length > 0) {
                setStep('DYNAMIC_FLOW');
                setFlowIndex(0);
                askFlowQuestion(flow[0]);
            } else {
                setStep('RESULTS');
                calculateResults();
            }
        }, 600);
    };

    const askFlowQuestion = (stepKey: string) => {
        const questions: Record<string, string> = {
            LOCATION: 'Which locations are you interested in?',
            CITY: 'Great! Which cities are you interested in?',
            BUDGET: 'Almost done! What is your budget range?',
            BEDROOMS: 'How many bedrooms do you need?',
            TYPE: 'What type of property are you looking for?'
        };
        addMessage('bot', questions[stepKey] || 'Can you tell me more about what you want?');
    };

    const calculateResults = (finalAnswers?: any) => {
        const currentAnswers = finalAnswers || answers;

        // --- PHASE 1: Neural Vectoring Simulation ---
        setIsNeuralProcessing(true);
        const stages = [
            "Initializing Linguistic Decoder...",
            "Mapping Intent Vectors...",
            "Decoding Semantic Requirements...",
            "Synchronizing with Market Intelligence Hub..."
        ];

        let stageIdx = 0;
        const stageInterval = setInterval(() => {
            if (stageIdx < stages.length) {
                setProcessingMessage(stages[stageIdx]);
                stageIdx++;
            } else {
                clearInterval(stageInterval);
                finishCalculation(currentAnswers);
            }
        }, 600);
    };

    const finishCalculation = (currentAnswers: any) => {
        const filtered = properties.filter(prop => {
            const cityMatch = !currentAnswers.CITY?.length || currentAnswers.CITY.some((c: string) => prop.city?.toLowerCase().includes(c.toLowerCase()));
            const locMatch = !currentAnswers.LOCATION?.length || currentAnswers.LOCATION.some((l: string) =>
                prop.neighborhood?.toLowerCase().includes(l.toLowerCase()) ||
                prop.title?.toLowerCase().includes(l.toLowerCase())
            );

            const minPrice = (prop.units || []).reduce((min: number, unit: any) => {
                const price = Number(unit.unitPricing?.[0]?.price) || 1000000;
                return price < min ? price : min;
            }, 1000000);

            const budgetMatch = !currentAnswers.BUDGET?.length || currentAnswers.BUDGET.some((b: string) => {
                const range = budgetRanges.find(r => r.label === b);
                if (!range) return false;

                const min = range.min ?? 0;
                const max = range.max ?? Infinity;

                return minPrice >= min && minPrice <= max;
            });

            const bedMatch = !currentAnswers.BEDROOMS?.length || currentAnswers.BEDROOMS.some((b: string) => {
                const count = parseInt(b);
                const propBeds = prop.bedrooms || prop.realEstateDetails?.bedrooms;
                if (propBeds === count) return true;
                return prop.units?.some((u: any) => u.realEstateDetails?.bedrooms === count);
            });

            const typeMatch = !currentAnswers.TYPE?.length || currentAnswers.TYPE.some((t: string) => {
                const searchStr = `${prop.propertyTypeLabel} ${prop.listingType} ${prop.title}`.toLowerCase();
                return searchStr.includes(t.toLowerCase());
            });

            return cityMatch && locMatch && budgetMatch && bedMatch && typeMatch;
        });

        // Apply Recommendation Logic
        const sorted = [...filtered];
        if (recommendationLogic === 'price-match') {
            sorted.sort((a, b) => {
                const getP = (p: any) => (p.units || []).reduce((m: number, u: any) => Math.min(m, Number(u.unitPricing?.[0]?.price) || 1000000), 1000000);
                return getP(a) - getP(b);
            });
        } else if (recommendationLogic === 'newest') {
            sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else if (recommendationLogic === 'featured') {
            sorted.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
        }

        // --- PHASE 2: Intent Scoring Algorithm ---
        let score = 70; // Base score
        if (currentAnswers.BUDGET?.some((b: string) => b.includes('High') || b.includes('Luxury'))) score += 15;
        if (currentAnswers.LOCATION?.length > 1) score += 10;
        if (sorted.length > 0) score += 3;
        setIntentScore(Math.min(99, score));

        setIsNeuralProcessing(false);
        if (sorted.length > 0) {
            addMessage('bot', `I found ${sorted.length} matches for you!`);

            // Upsell Logic: Suggest one slightly more premium property if available
            if (upsellEnabled && properties.length > sorted.length) {
                const premium = properties.find(p => {
                    const isAlreadyIn = sorted.find(s => s.id === p.id);
                    const pBeds = p.bedrooms || p.realEstateDetails?.bedrooms || 0;
                    const requestedBeds = parseInt(currentAnswers.BEDROOMS?.[0]) || 0;
                    return !isAlreadyIn && pBeds >= requestedBeds;
                });
                if (premium) {
                    addMessage('bot', `I also found a premium option that might interest you: ${premium.title}. ✨`);
                }
            }

            setFilteredResults(sorted);
            onFilterResults(sorted);

            // Cross-sell Logic
            if (crossSellEnabled) {
                setTimeout(() => {
                    addMessage('bot', 'Need help with financing, legal advice, or maintenance for your new home? Just let me know! 🏠');
                }, 1000);
            }
        } else if (properties.length > 0) {
            addMessage('bot', 'I couldn\'t find an exact match, but I have some suggestions! 💡');
            const suggestions = properties.slice(0, 3);
            setFilteredResults(suggestions);
            onFilterResults(suggestions);
        } else {
            addMessage('bot', 'I couldn\'t find any matching spaces. 😔');
            onFilterResults([]);
        }
    };

    const handleAnswer = (text: string | string[]) => {
        const displayText = Array.isArray(text) ? text.join(', ') : text;
        addMessage('user', displayText);

        const currentStepKey = flow[flowIndex] || 'UNKNOWN';
        const updatedAnswers = {
            ...answers,
            [currentStepKey]: Array.isArray(text) ? text : [text]
        };
        setAnswers(updatedAnswers);

        if (flowIndex < flow.length - 1) {
            const nextIndex = flowIndex + 1;
            setFlowIndex(nextIndex);
            setTimeout(() => askFlowQuestion(flow[nextIndex]), 500);
        } else {
            setStep('RESULTS');
            setTimeout(() => calculateResults(updatedAnswers), 500);
        }

        // Track the choice
        if (trackAction) {
            trackAction('CHAT_CHOICE', { step: currentStepKey, answer: text });
        }
    };

    const getOptions = () => {
        if (!properties || !Array.isArray(properties)) return [];
        const currentStepKey = flow[flowIndex];

        if (currentStepKey === 'LOCATION') {
            const neighborhoods = properties
                .map(p => p.neighborhood)
                .filter((v, i, a) => v && a.indexOf(v) === i);
            if (neighborhoods.length === 0) return ['Downtown', 'Suburbs', 'Quiet Area', 'Near Transit'].map(v => ({ label: v, value: v }));
            return neighborhoods.map(n => ({ label: n, value: n }));
        }
        if (currentStepKey === 'CITY') {
            const cities = properties
                .map(p => p.city)
                .filter((v, i, a) => v && a.indexOf(v) === i);
            if (cities.length === 0) return ['Common City'].map(v => ({ label: v, value: v }));
            return cities.map(c => ({ label: c, value: c }));
        }
        if (currentStepKey === 'BUDGET') {
            return budgetRanges.map(r => ({
                label: r.label.replace('$', currencySymbol),
                value: r.label
            }));
        }
        if (currentStepKey === 'BEDROOMS') {
            return [
                { label: 'Studio', value: '0' },
                { label: '1 BHK', value: '1' },
                { label: '2 BHK', value: '2' },
                { label: '3 BHK', value: '3' },
                { label: '4+ BHK', value: '4' }
            ];
        }
        if (currentStepKey === 'TYPE') {
            return [
                { label: 'Apartment', value: 'Apartment' },
                { label: 'Villa', value: 'Villa' },
                { label: 'Office Space', value: 'Office' },
                { label: 'Studio', value: 'Studio' }
            ];
        }
        return [];
    };


    return (
        <div className={`chatbot-container border-0 shadow-lg rounded-4 overflow-hidden animate-slide-up bg-white ${isExpanded ? 'expanded' : ''}`}>

            <div className="chat-header p-3 text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: theme.primaryColor }}>
                <div className="d-flex align-items-center gap-2">
                    <div className="bg-white rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>
                        <i className="bi bi-robot" style={{ color: theme.primaryColor }}></i>
                    </div>
                    <div>
                        <span className="fw-bold small d-block lh-1">{aiName || 'Virpa AI'}</span>
                        <span className="extra-small opacity-75">Online</span>
                    </div>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-sm text-white p-0 border-0" onClick={() => {
                        const next = !isExpanded;
                        setIsExpanded(next);
                        if (onExpandToggle) onExpandToggle(next);
                    }} title="Expand">
                        <i className={`bi ${isExpanded ? 'bi-fullscreen-exit' : 'bi-fullscreen'}`}></i>
                    </button>
                    <button className="btn btn-sm text-white p-0 border-0" onClick={handleReset} title="Reset Chat">
                        <i className="bi bi-arrow-counterclockwise"></i>
                    </button>
                    <button className="btn btn-sm text-white p-0 border-0" onClick={onClose}><i className="bi bi-x-lg"></i></button>
                </div>
            </div>

            <div className="chat-body p-3 overflow-auto flex-grow-1 position-relative" style={{ backgroundColor: '#f9fafb', minHeight: '0' }} ref={chatBodyRef}>

                {/* Neural Processing Overlay */}
                {isNeuralProcessing && (
                    <div className="position-absolute inset-0 bg-white/95 z-3 d-flex flex-column align-items-center justify-content-center p-4">
                        <div className="mb-4 d-flex gap-2">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="bg-red rounded-circle animate-pulse" style={{ width: '12px', height: '12px', animationDelay: `${i * 0.2}s` }}></div>
                            ))}
                        </div>
                        <span className="extra-small fw-800 text-red letter-spacing-1 mb-2">VIRPA NEURAL HUB</span>
                        <p className="extra-small text-muted text-center tracking-widest uppercase fw-700 animate-fade-in">{processingMessage}</p>
                    </div>
                )}
                {step === 'IDLE' ? (
                    <div className="text-center py-5">
                        <div className="bounce-container mb-3 position-relative d-inline-block">
                            {(aiEnabled === true || aiEnabled === 'true') ? (
                                <>
                                    <div className="bg-primary-soft rounded-circle d-inline-flex p-3">
                                        <i className="bi bi-robot display-5 text-primary" style={{ color: theme.primaryColor }}></i>
                                    </div>
                                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger border border-white border-2" style={{ fontSize: '9px' }}>
                                        AI
                                    </span>
                                </>
                            ) : (
                                <i className="bi bi-chat-heart display-5 text-primary opacity-50" style={{ color: theme.primaryColor }}></i>
                            )}
                        </div>
                        <h6 className="fw-bold">
                            {(aiEnabled === true || aiEnabled === 'true') && !customWelcomeTitle ? `Chat with ${aiName || 'Virpa'}` : (customWelcomeTitle || 'Looking for a new home?')}
                        </h6>
                        <p className="extra-small text-muted px-4">
                            {customWelcomeSubtext || 'I can find the perfect properties in seconds based on your specific requirements.'}
                        </p>
                        <button
                            className="btn btn-primary rounded-4 px-4 mt-2 shadow-sm fw-bold small"
                            style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                            onClick={() => {
                                setStep('LEAD_CAPTURE');
                                if (trackAction) trackAction('CHAT_INIT');
                            }}
                        >
                            Start Search
                        </button>
                    </div>
                ) : step === 'LEAD_CAPTURE' ? (
                    <div className="lead-capture py-4 px-2">
                        <div className="text-center mb-4">
                            <div className="bg-light rounded-4 shadow-sm d-inline-flex p-3 mb-3">
                                <i className="bi bi-robot fs-3" style={{ color: theme.primaryColor }}></i>
                            </div>
                            <h6 className="fw-bold" style={{ color: theme.primaryColor }}>Let&apos;s Get Started!</h6>
                            <p className="extra-small text-muted mb-0">Please share your WhatsApp or Email to continue.</p>
                        </div>

                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            const contact = leadCaptureMode === 'both'
                                ? `${formData.get('email')} | ${formData.get('mobile')}`
                                : (formData.get('contact') as string);

                            handleLeadSubmit({
                                name: formData.get('name') as string,
                                contact: contact
                            });
                        }}>
                            <div className="mb-2">
                                <label className="extra-small text-muted mb-1 ps-2">Your Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    className="form-control rounded-4 border-0 shadow-sm px-3 small"
                                    placeholder="Enter your name"
                                    required
                                    disabled={isSubmittingLead}
                                />
                            </div>

                            {leadCaptureMode === 'both' ? (
                                <>
                                    <div className="mb-2">
                                        <label className="extra-small text-muted mb-1 ps-2">Email Address</label>
                                        <input
                                            name="email"
                                            type="email"
                                            className="form-control rounded-4 border-0 shadow-sm px-3 small"
                                            placeholder="your@email.com"
                                            required
                                            disabled={isSubmittingLead}
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="extra-small text-muted mb-1 ps-2">Mobile Number</label>
                                        <input
                                            name="mobile"
                                            type="tel"
                                            className="form-control rounded-4 border-0 shadow-sm px-3 small"
                                            placeholder="+1 234..."
                                            required
                                            disabled={isSubmittingLead}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="mb-3">
                                    <label className="extra-small text-muted mb-1 ps-2">
                                        {leadCaptureMode === 'email' ? 'Email Address' : 'Mobile Number'}
                                    </label>
                                    <input
                                        name="contact"
                                        type={leadCaptureMode === 'email' ? 'email' : 'tel'}
                                        className="form-control rounded-4 border-0 shadow-sm px-3 small"
                                        placeholder={leadCaptureMode === 'email' ? 'your@email.com' : '+1 234...'}
                                        required
                                        disabled={isSubmittingLead}
                                    />
                                </div>
                            )}

                            <div className="p-3 rounded-4 bg-light mb-3 border">
                                <p className="extra-small text-muted mb-0 lh-base">
                                    <i className="bi bi-shield-check me-1 text-primary"></i>
                                    <strong>Privacy:</strong> We use this only for follow-ups. No spam, ever.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 rounded-4 py-2 shadow-sm fw-bold small"
                                style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                                disabled={isSubmittingLead}
                            >
                                {isSubmittingLead ? 'Saving...' : 'Start Conversation'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-3">
                        {messages.map((m, i) => (
                            <div key={i} className={`d-flex ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                <div
                                    className={`p-2 px-3 rounded-4 shadow-sm ${m.role === 'bot' ? 'rounded-tl-0' : 'rounded-tr-0'}`}
                                    style={{
                                        maxWidth: '90%',
                                        backgroundColor: m.role === 'user' ? theme.primaryColor : '#fff',
                                        color: m.role === 'user' ? '#fff' : '#000',
                                        border: m.role === 'bot' ? '1px solid #eee' : 'none'
                                    }}
                                >
                                    {m.role === 'bot'
                                        ? <MarkdownMessage text={m.text} primaryColor={theme.primaryColor} />
                                        : <span style={{ fontSize: '12px' }}>{m.text}</span>
                                    }
                                </div>
                            </div>
                        ))}

                        {filteredResults.length > 0 && (
                            <div className="results-list animate-fade-in d-flex flex-column gap-2 mt-2">
                                {filteredResults.slice(0, 3).map((res) => (
                                    <div
                                        key={res.id}
                                        className="card border-0 shadow-sm rounded-3 overflow-hidden hvr-light p-2 cursor-pointer"
                                        onClick={() => onSelectProperty(res)}
                                    >
                                        <div className="d-flex gap-2 align-items-center">
                                            <div className="bg-light rounded-2 overflow-hidden" style={{ width: '40px', height: '40px' }}>
                                                {res.mainImage ? <img src={(res.mainImage as MediaItem).url} className="w-100 h-100 object-fit-cover" alt={res.title || ''} /> : <i className="bi bi-building p-2 opacity-50"></i>}
                                            </div>
                                            <div className="flex-grow-1 overflow-hidden">
                                                <h6 className="extra-small fw-bold mb-0 text-truncate" style={{ color: theme.primaryColor }}>{res.title}</h6>
                                                <span className="extra-small text-muted">
                                                    {res.city} • Starting {currencySymbol}{Number((res.units || []).reduce((min: number, u: Unit) => {
                                                        const p = Number(u.unitPricing?.[0]?.price);
                                                        return p && p < min ? p : min;
                                                    }, 1000000)).toLocaleString()}
                                                </span>
                                            </div>
                                            <i className="bi bi-chevron-right extra-small text-muted"></i>
                                        </div>
                                    </div>
                                ))}
                        {filteredResults.length > 3 && <div className="extra-small text-center text-primary fw-bold">+{filteredResults.length - 3} more on main page</div>}
                            </div>
                        )}

                        {/* Property Comparison Panel */}
                        {compareProperties.length >= 2 && (
                            <div className="animate-fade-in mt-2">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <span className="extra-small fw-bold" style={{ color: theme.primaryColor }}>
                                        <i className="bi bi-bar-chart-steps me-1"></i> Property Comparison
                                    </span>
                                    <button className="btn btn-sm p-0 extra-small text-muted" onClick={() => setCompareProperties([])}>
                                        <i className="bi bi-x-circle"></i>
                                    </button>
                                </div>
                                <div className="overflow-auto" style={{ fontSize: '10px' }}>
                                    <table className="table table-bordered table-sm mb-0" style={{ fontSize: '10px', minWidth: '100%' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: theme.primaryColor }}>
                                                <th className="text-white py-1 px-2" style={{ fontSize: '10px', minWidth: '70px' }}>Feature</th>
                                                {compareProperties.map((p, idx) => (
                                                    <th key={idx} className="text-white py-1 px-2" style={{ fontSize: '10px', maxWidth: '100px' }}>
                                                        {p.title?.split(' ').slice(0, 3).join(' ')}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[
                                                { label: '📍 City', key: 'city' },
                                                { label: '💰 Price', key: 'price', format: (v: any) => v ? `${currencySymbol}${Number(v).toLocaleString()}` : 'On Request' },
                                                { label: '🛏 Beds', key: 'bedrooms', format: (v: any) => v || '-' },
                                                { label: '🚿 Baths', key: 'bathrooms', format: (v: any) => v || '-' },
                                                { label: '📐 Area', key: 'area', format: (v: any) => v ? `${v} sqft` : '-' },
                                                { label: '🏷 Type', key: 'listingType' },
                                                { label: '🛋 Furnish', key: 'furnishing' },
                                                { label: '🚗 Parking', key: 'parkingSpaces', format: (v: any) => v || '-' },
                                            ].map((row) => (
                                                <tr key={row.key}>
                                                    <td className="fw-semibold text-muted py-1 px-2">{row.label}</td>
                                                    {compareProperties.map((p, idx) => (
                                                        <td key={idx} className="py-1 px-2">
                                                            {row.format ? row.format(p[row.key]) : (p[row.key] || '-')}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                            <tr>
                                                <td className="fw-semibold text-muted py-1 px-2">✨ Amenities</td>
                                                {compareProperties.map((p, idx) => (
                                                    <td key={idx} className="py-1 px-2">
                                                        {p.propertyAmenities?.slice(0, 3).map((a: any) => a.amenity?.name).join(', ') || '-'}
                                                    </td>
                                                ))}
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {step === 'RESULTS' && !(aiEnabled === true || aiEnabled === 'true') && (
                            <div className="text-center mt-3 animate-fade-in">
                                <button
                                    className="btn btn-outline-primary btn-sm rounded-4 px-4 fw-bold extra-small"
                                    onClick={handleChatAgain}
                                    style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                                >
                                    <i className="bi bi-chat-dots-fill me-2"></i> Chat Again
                                </button>
                            </div>
                        )}

                        {(aiEnabled === true || aiEnabled === 'true') && step === 'RESULTS' && (
                            <div className="mt-3 position-relative animate-slide-up px-1 pb-1">
                                <div className="input-group input-group-sm shadow-sm rounded-4 overflow-hidden border border-light-subtle bg-white">
                                    <input
                                        type="text"
                                        className="form-control border-0 px-3 py-2 shadow-none"
                                        placeholder="Ask about location, price, amenities..."
                                        value={inputText}
                                        onChange={(e) => setInputText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAiChat(inputText)}
                                        disabled={isAiTyping}
                                        style={{ fontSize: '12px' }}
                                    />
                                    <button
                                        className="btn btn-primary border-0 px-3"
                                        style={{ backgroundColor: theme.primaryColor }}
                                        onClick={() => handleAiChat(inputText)}
                                        disabled={isAiTyping || !inputText.trim()}
                                    >
                                        {isAiTyping ? <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span> : <i className="bi bi-send-fill" style={{ fontSize: '12px' }}></i>}
                                    </button>
                                </div>
                                {isAiTyping && <div className="extra-small text-muted mt-1 ms-2 animate-pulse"><i className="bi bi-magic me-1"></i> Virpa is thinking...</div>}

                                {/* Quick Action Suggestion Pills */}
                                {!isAiTyping && messages.length > 0 && (
                                    <div className="d-flex flex-wrap gap-1 mt-2">
                                        {[
                                            { label: '📅 Book a Visit', msg: 'I want to book a site visit' },
                                            { label: '📧 Email Details', msg: `Send property details to my email ${answers.contact?.includes('@') ? answers.contact : ''}`.trim() },
                                            { label: '🆚 Compare', msg: 'Compare the top 2 properties for me' },
                                            { label: '💰 Price Range', msg: 'Show me properties under my budget' },
                                        ].map((pill) => (
                                            <button
                                                key={pill.label}
                                                className="btn btn-sm rounded-pill border px-2 py-0"
                                                style={{ fontSize: '10px', borderColor: theme.primaryColor, color: theme.primaryColor, backgroundColor: 'transparent' }}
                                                onClick={() => handleAiChat(pill.msg)}
                                                disabled={isAiTyping}
                                            >
                                                {pill.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {step === 'DYNAMIC_FLOW' && (
                            <div className="animate-fade-in">
                                <CheckboxGroup
                                    options={getOptions()}
                                    theme={theme}
                                    onConfirm={(vals) => handleAnswer(vals)}
                                    onMessage={(msg) => addMessage('bot', msg)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="chat-footer p-2 bg-white border-top position-relative">
                {intentScore > 0 && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                        <span className="badge bg-red text-white py-1 px-3 rounded-pill border border-white/20 shadow-sm" style={{ fontSize: '10px' }}>
                            INTENT SCORE: {intentScore}%
                        </span>
                    </div>
                )}
                <div className="d-flex flex-wrap gap-1 justify-content-center mb-1 mt-2">
                    {properties.slice(0, 4).map(p => (
                        <span
                            key={p.id}
                            className="badge bg-light text-dark fw-normal extra-small border cursor-pointer hvr-light"
                            style={{ fontSize: '9px' }}
                            onClick={() => onSelectProperty(p)}
                        >
                            <i className="bi bi-lightning-fill text-warning me-1"></i>{p.title.split(' ')[0]}
                        </span>
                    ))}
                </div>
                <button className="btn btn-link btn-sm text-muted text-decoration-none extra-small w-100 opacity-50" onClick={onClose}>
                    <i className="bi bi-power me-1"></i> Close Virpa
                </button>
            </div>

            <style jsx>{`
                .chatbot-container {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    z-index: 1000;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .chatbot-container.expanded {
                    /* Width and height controlled by parent container's classes */
                }
                .extra-small { font-size: 11px; }
                .rounded-tl-0 { border-top-left-radius: 0 !important; }
                .rounded-tr-0 { border-top-right-radius: 0 !important; }
                .animate-slide-up { animation: slideUp 0.3s ease-out; }
                .animate-fade-in { animation: fadeIn 0.5s ease; }
                .confetti-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                    background: rgba(255,255,255,0.7);
                    z-index: 10;
                    animation: explosion 1s ease-out infinite;
                    pointer-events: none;
                }
                .bounce-container { animation: bounce 2s infinite; }
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
                    40% {transform: translateY(-8px);}
                    60% {transform: translateY(-4px);}
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-pulse { animation: pulse 1.5s infinite ease-in-out; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes explosion {
                    0% { transform: scale(0.5); opacity: 1; }
                    100% { transform: scale(2); opacity: 0; }
                }
                .hvr-light:hover { background-color: #f1f5f9; }
                .cursor-pointer { cursor: pointer; }
                .lead-capture input:focus {
                    box-shadow: 0 0 0 0.25rem rgba(99, 102, 241, 0.1);
                    border: 1px solid #eee;
                }
            `}</style>
        </div>
    );
}
