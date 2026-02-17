'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatbotProps {
    theme: any;
    properties: any[];
    onFilterResults: (results: any[]) => void;
    onClose: () => void;
    onSelectProperty: (property: any) => void;
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
    trackAction?: (type: string, metadata?: any) => void;
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

export default function ChatbotWidget({
    theme, properties, onFilterResults, onClose, onSelectProperty, onCreateLead, onExpandToggle,
    customWelcomeTitle, customWelcomeSubtext, leadCaptureMode = 'both',
    flow = ['LOCATION', 'CITY', 'BUDGET'],
    upsellEnabled = true,
    crossSellEnabled = true,
    recommendationLogic = 'price-match',
    previewMode = false,
    trackAction
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

    const handleLeadSubmit = async (formData: { name: string, contact: string }) => {
        if (!formData.contact) return;
        setIsSubmittingLead(true);
        try {
            // Simplified call to onCreateLead - we'll update the signature in the parent
            await (onCreateLead as any)(formData.contact, formData.name);
            setStep('HI');
            addMessage('bot', `Thank you ${formData.name}! We've saved your contact information safely. 🔒`);
            setTimeout(() => {
                addMessage('bot', 'Hi there! I\'m your smart booking assistant. Need help finding the perfect space?');
                setTimeout(() => {
                    if (flow && flow.length > 0) {
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
            if (flow && flow.length > 0) {
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
                if (b === 'Low (< $1k)') return minPrice < 1000;
                if (b === 'Mid ($1k - $5k)') return minPrice >= 1000 && minPrice <= 5000;
                if (b === 'High ($5k - $10k)') return minPrice > 5000 && minPrice <= 10000;
                if (b === 'Luxury (> $10k)') return minPrice > 10000;
                return false;
            });

            const bedMatch = !currentAnswers.BEDROOMS?.length || currentAnswers.BEDROOMS.some((b: string) => {
                const count = parseInt(b);
                return prop.bedrooms === count;
            });

            return cityMatch && locMatch && budgetMatch && bedMatch;
        });

        // Apply Recommendation Logic
        let sorted = [...filtered];
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

        if (sorted.length > 0) {
            addMessage('bot', `I found ${sorted.length} matches for you!`);

            // Upsell Logic: Suggest one slightly more premium property if available
            if (upsellEnabled && properties.length > sorted.length) {
                const premium = properties.find(p => !sorted.find(s => s.id === p.id) && (p.bedrooms || 0) >= (parseInt(currentAnswers.BEDROOMS?.[0]) || 0));
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
            return [
                { label: 'Low (< $1k)', value: 'Low (< $1k)' },
                { label: 'Mid ($1k - $5k)', value: 'Mid ($1k - $5k)' },
                { label: 'High ($5k - $10k)', value: 'High ($5k - $10k)' },
                { label: 'Luxury (> $10k)', value: 'Luxury (> $10k)' }
            ];
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
                        <span className="fw-bold small d-block lh-1">Smart Assistant</span>
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

            <div className="chat-body p-3 overflow-auto flex-grow-1" style={{ backgroundColor: '#f9fafb', minHeight: '0' }} ref={chatBodyRef}>
                {step === 'IDLE' ? (
                    <div className="text-center py-5">
                        <div className="bounce-container mb-3">
                            <i className="bi bi-chat-heart display-5 text-primary opacity-50" style={{ color: theme.primaryColor }}></i>
                        </div>
                        <h6 className="fw-bold">{customWelcomeTitle || 'Looking for a new home?'}</h6>
                        <p className="extra-small text-muted px-4">{customWelcomeSubtext || 'I can find the perfect properties in seconds based on your specific requirements.'}</p>
                        <button
                            className="btn btn-primary rounded-4 px-4 mt-2 shadow-sm fw-bold small"
                            style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                            onClick={() => setStep('LEAD_CAPTURE')}
                        >
                            Start Search
                        </button>
                    </div>
                ) : step === 'LEAD_CAPTURE' ? (
                    <div className="lead-capture py-4 px-2">
                        <div className="text-center mb-4">
                            <div className="bg-light rounded-circle shadow-sm d-inline-flex p-3 mb-3">
                                <i className="bi bi-shield-lock-fill fs-3" style={{ color: theme.primaryColor }}></i>
                            </div>
                            <h6 className="fw-bold">Let's Get Started!</h6>
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
                                    className={`p-2 px-3 rounded-4 small shadow-sm ${m.role === 'bot' ? 'rounded-tl-0' : 'rounded-tr-0'}`}
                                    style={{
                                        maxWidth: '85%',
                                        backgroundColor: m.role === 'user' ? theme.primaryColor : 'white',
                                        color: m.role === 'user' ? 'white' : 'inherit',
                                        border: m.role === 'bot' ? '1px solid #eee' : 'none'
                                    }}
                                >
                                    {m.text}
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
                                                {res.mainImage ? <img src={res.mainImage.url} className="w-100 h-100 object-fit-cover" /> : <i className="bi bi-building p-2 opacity-50"></i>}
                                            </div>
                                            <div className="flex-grow-1 overflow-hidden">
                                                <h6 className="extra-small fw-bold mb-0 text-truncate">{res.title}</h6>
                                                <span className="extra-small text-muted">{res.city} • Available Now</span>
                                            </div>
                                            <i className="bi bi-chevron-right extra-small text-muted"></i>
                                        </div>
                                    </div>
                                ))}
                                {filteredResults.length > 3 && <div className="extra-small text-center text-primary fw-bold">+{filteredResults.length - 3} more on main page</div>}
                            </div>
                        )}

                        {step === 'RESULTS' && (
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

            <div className="chat-footer p-2 bg-white border-top">
                <div className="d-flex flex-wrap gap-1 justify-content-center mb-1">
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
                    <i className="bi bi-power me-1"></i> Close Assistant
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
