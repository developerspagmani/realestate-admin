'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatbotProps {
    theme: any;
    properties: any[];
    onFilterResults: (results: any[]) => void;
    onClose: () => void;
    onSelectProperty: (property: any) => void;
    onCreateLead: (contact: string, name?: string) => Promise<void>;
    onExpandToggle?: (expanded: boolean) => void;
}

type Step = 'IDLE' | 'LEAD_CAPTURE' | 'HI' | 'ASK_LOCATION' | 'ASK_CITY' | 'ASK_BUDGET' | 'RESULTS';

const STORAGE_KEY = 'cw_chatbot_session';

export default function ChatbotWidget({ theme, properties, onFilterResults, onClose, onSelectProperty, onCreateLead, onExpandToggle }: ChatbotProps) {
    const [step, setStep] = useState<Step>('IDLE');
    const [answers, setAnswers] = useState({
        name: '',
        contact: '',
        locations: [] as string[],
        cities: [] as string[],
        budgets: [] as string[]
    });
    const [messages, setMessages] = useState<{ role: 'bot' | 'user', text: string }[]>([]);
    const [filteredResults, setFilteredResults] = useState<any[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmittingLead, setIsSubmittingLead] = useState(false);
    const chatBodyRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const savedSession = localStorage.getItem(STORAGE_KEY);
        if (savedSession) {
            try {
                const session = JSON.parse(savedSession);
                setStep(session.step || 'IDLE');
                setAnswers(session.answers || { locations: [] as string[], cities: [] as string[], budgets: [] as string[] });
                setMessages(session.messages || []);
                setFilteredResults(session.filteredResults || []);

                // Use a ref-like check or just run once to avoid loops
                if (session.step === 'RESULTS' && session.filteredResults) {
                    onFilterResults(session.filteredResults);
                }
            } catch (e) {
                console.error('Failed to restore chatbot session', e);
            }
        }
    }, [onFilterResults]); // Memoized onFilterResults will prevent loops

    // PERSISTENCE: Save session to localStorage on state changes
    useEffect(() => {
        if (step !== 'IDLE') {
            const session = { step, answers, messages, filteredResults };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        }
    }, [step, answers, messages, filteredResults]);

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
        setAnswers({ name: '', contact: '', locations: [], cities: [], budgets: [] });
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
                    setStep('ASK_LOCATION');
                    addMessage('bot', 'First, which locations are you interested in?');
                }, 800);
            }, 800);
        } catch (error) {
            console.error('Lead capture failed:', error);
            setStep('HI');
        } finally {
            setIsSubmittingLead(false);
        }
    };

    const handleChatAgain = () => {
        setAnswers(prev => ({ ...prev, locations: [], cities: [], budgets: [] }));
        setFilteredResults([]);
        addMessage('bot', 'No problem! Let\'s start a new search. 🧐');
        setTimeout(() => {
            setStep('ASK_LOCATION');
            addMessage('bot', 'Which locations are you interested in this time?');
        }, 600);
    };

    const handleAnswer = (text: string | string[]) => {
        const displayText = Array.isArray(text) ? text.join(', ') : text;
        addMessage('user', displayText);

        if (step === 'ASK_LOCATION') {
            setAnswers(prev => ({ ...prev, locations: Array.isArray(text) ? text : [text] }));
            setStep('ASK_CITY');
            setTimeout(() => addMessage('bot', 'Great! Which cities are you interested in?'), 500);
        } else if (step === 'ASK_CITY') {
            setAnswers(prev => ({ ...prev, cities: Array.isArray(text) ? text : [text] }));
            setStep('ASK_BUDGET');
            setTimeout(() => addMessage('bot', 'Almost done! What is your budget range?'), 500);
        } else if (step === 'ASK_BUDGET') {
            const selectedBudgets = Array.isArray(text) ? text : [text];
            setAnswers(prev => ({ ...prev, budgets: selectedBudgets }));
            setStep('RESULTS');

            const filtered = properties.filter(prop => {
                const cityMatch = answers.cities.length === 0 || answers.cities.some(c => prop.city?.toLowerCase().includes(c.toLowerCase()));
                const locMatch = answers.locations.length === 0 || answers.locations.some(l =>
                    prop.neighborhood?.toLowerCase().includes(l.toLowerCase()) ||
                    prop.title?.toLowerCase().includes(l.toLowerCase()) ||
                    prop.description?.toLowerCase().includes(l.toLowerCase())
                );

                const minPrice = prop.units?.reduce((min: number, unit: any) => {
                    const price = Number(unit.unitPricing?.[0]?.price) || 1000000;
                    return price < min ? price : min;
                }, 1000000);

                const budgetMatch = selectedBudgets.length === 0 || selectedBudgets.some(b => {
                    if (b === 'Low (< $1k)') return minPrice < 1000;
                    if (b === 'Mid ($1k - $5k)') return minPrice >= 1000 && minPrice <= 5000;
                    if (b === 'High ($5k - $10k)') return minPrice > 5000 && minPrice <= 10000;
                    if (b === 'Luxury (> $10k)') return minPrice > 10000;
                    return false;
                });

                return cityMatch && locMatch && budgetMatch;
            });

            setTimeout(() => {
                if (filtered.length > 0) {
                    addMessage('bot', `I found ${filtered.length} matches for you!`);
                } else if (properties.length > 0) {
                    addMessage('bot', 'I couldn\'t find an exact match, but I have some suggestions! 💡');
                    setFilteredResults(properties.slice(0, 3));
                } else {
                    addMessage('bot', 'I couldn\'t find any matching spaces. 😔');
                }

                if (filtered.length > 0) {
                    setFilteredResults(filtered);
                }

                onFilterResults(filtered.length > 0 ? filtered : (properties.length > 0 ? properties.slice(0, 3) : []));
            }, 500);
        }
    };

    const getOptions = () => {
        if (!properties || !Array.isArray(properties)) return [];

        if (step === 'ASK_LOCATION') {
            const neighborhoods = properties
                .map(p => p.neighborhood)
                .filter((v, i, a) => v && a.indexOf(v) === i);
            if (neighborhoods.length === 0) return ['Downtown', 'Suburbs', 'Quiet Area', 'Near Transit'].map(v => ({ label: v, value: v }));
            return neighborhoods.map(n => ({ label: n, value: n }));
        }
        if (step === 'ASK_CITY') {
            const cities = properties
                .map(p => p.city)
                .filter((v, i, a) => v && a.indexOf(v) === i);
            if (cities.length === 0) return ['Common City'].map(v => ({ label: v, value: v }));
            return cities.map(c => ({ label: c, value: c }));
        }
        if (step === 'ASK_BUDGET') {
            return [
                { label: 'Low (< $1k)', value: 'Low (< $1k)' },
                { label: 'Mid ($1k - $5k)', value: 'Mid ($1k - $5k)' },
                { label: 'High ($5k - $10k)', value: 'High ($5k - $10k)' },
                { label: 'Luxury (> $10k)', value: 'Luxury (> $10k)' }
            ];
        }
        return [];
    };

    const CheckboxGroup = ({ options, onConfirm }: { options: { label: string, value: string }[], onConfirm: (vals: string[]) => void }) => {
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
                                className={`btn btn-sm rounded-pill px-3 border-0 transition-all ${selected.includes(opt.value) ? 'text-white' : 'bg-light text-muted'}`}
                                style={{ backgroundColor: selected.includes(opt.value) ? theme.primaryColor : undefined }}
                                htmlFor={`check-${opt.value}`}
                            >
                                {opt.label}
                            </label>
                        </div>
                    ))}
                </div>
                <button
                    className="btn btn-primary w-100 rounded-pill btn-sm fw-bold shadow-sm"
                    style={{ backgroundColor: theme.primaryColor, border: 'none' }}
                    onClick={() => {
                        if (selected.length > 0) onConfirm(selected);
                        else addMessage('bot', 'Please select at least one option to continue.');
                    }}
                >
                    Confirm Selection
                </button>
            </div>
        );
    };

    return (
        <div className={`chatbot-window border-0 shadow-lg rounded-4 overflow-hidden animate-slide-up bg-white ${isExpanded ? 'expanded' : ''}`}>

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

            <div className="chat-body p-3 overflow-auto" style={{ height: isExpanded ? '450px' : '300px', backgroundColor: '#f9fafb' }} ref={chatBodyRef}>
                {step === 'IDLE' ? (
                    <div className="text-center py-5">
                        <div className="bounce-container mb-3">
                            <i className="bi bi-chat-heart display-5 text-primary opacity-50" style={{ color: theme.primaryColor }}></i>
                        </div>
                        <h6 className="fw-bold">Looking for a new home?</h6>
                        <p className="extra-small text-muted px-4">I can find the perfect properties in seconds based on your specific requirements.</p>
                        <button
                            className="btn btn-primary rounded-pill px-4 mt-2 shadow-sm fw-bold small"
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
                            handleLeadSubmit({
                                name: formData.get('name') as string,
                                contact: formData.get('contact') as string
                            });
                        }}>
                            <div className="mb-2">
                                <label className="extra-small text-muted mb-1 ps-2">Your Name</label>
                                <input
                                    name="name"
                                    type="text"
                                    className="form-control rounded-pill border-0 shadow-sm px-3 small"
                                    placeholder="Enter your name"
                                    required
                                    disabled={isSubmittingLead}
                                />
                            </div>
                            <div className="mb-3">
                                <label className="extra-small text-muted mb-1 ps-2">WhatsApp / Email</label>
                                <input
                                    name="contact"
                                    type="text"
                                    className="form-control rounded-pill border-0 shadow-sm px-3 small"
                                    placeholder="yourname@email.com or +123..."
                                    required
                                    disabled={isSubmittingLead}
                                />
                            </div>

                            <div className="p-3 rounded-4 bg-light mb-3 border">
                                <p className="extra-small text-muted mb-0 lh-base">
                                    <i className="bi bi-shield-check me-1 text-primary"></i>
                                    <strong>Privacy:</strong> We use this only for follow-ups. No spam, ever.
                                </p>
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 rounded-pill py-2 shadow-sm fw-bold small"
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
                                    className="btn btn-outline-primary btn-sm rounded-pill px-4 fw-bold extra-small"
                                    onClick={handleChatAgain}
                                    style={{ borderColor: theme.primaryColor, color: theme.primaryColor }}
                                >
                                    <i className="bi bi-chat-dots-fill me-2"></i> Chat Again
                                </button>
                            </div>
                        )}

                        {['ASK_LOCATION', 'ASK_CITY', 'ASK_BUDGET'].includes(step) && (
                            <div className="animate-fade-in">
                                <CheckboxGroup
                                    options={getOptions()}
                                    onConfirm={(vals) => handleAnswer(vals)}
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
                .chatbot-window {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    z-index: 1000;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .chatbot-window.expanded {
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
