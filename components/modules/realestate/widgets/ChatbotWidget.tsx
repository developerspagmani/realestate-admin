'use client';

import { useState, useEffect, useRef } from 'react';

interface ChatbotProps {
    theme: any;
    properties: any[];
    onFilterResults: (results: any[]) => void;
    onClose: () => void;
    onSelectProperty: (property: any) => void;
    onCreateLead: (contact: string, name?: string) => Promise<void>;
}

type Step = 'IDLE' | 'LEAD_CAPTURE' | 'HI' | 'ASK_LOCATION' | 'ASK_CITY' | 'ASK_BUDGET' | 'RESULTS';

const STORAGE_KEY = 'cw_chatbot_session';

export default function ChatbotWidget({ theme, properties, onFilterResults, onClose, onSelectProperty, onCreateLead }: ChatbotProps) {
    const [step, setStep] = useState<Step>('IDLE');
    const [answers, setAnswers] = useState({
        name: '',
        contact: '',
        location: '',
        city: '',
        budget: ''
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
                setAnswers(session.answers || { location: '', city: '', budget: '' });
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
        setAnswers({ name: '', contact: '', location: '', city: '', budget: '' });
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
                    addMessage('bot', 'First, what type of location are you looking for? (e.g. Creative, quiet, near transit)');
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
        setAnswers(prev => ({ ...prev, location: '', city: '', budget: '' }));
        setFilteredResults([]);
        addMessage('bot', 'No problem! Let\'s start a new search. 🧐');
        setTimeout(() => {
            setStep('ASK_LOCATION');
            addMessage('bot', 'What type of location are you looking for this time?');
        }, 600);
    };

    const handleAnswer = (text: string) => {
        addMessage('user', text);

        if (step === 'ASK_LOCATION') {
            setAnswers(prev => ({ ...prev, location: text }));
            setStep('ASK_CITY');
            setTimeout(() => addMessage('bot', 'Great! Which city are you interested in?'), 500);
        } else if (step === 'ASK_CITY') {
            setAnswers(prev => ({ ...prev, city: text }));
            setStep('ASK_BUDGET');
            setTimeout(() => addMessage('bot', 'Almost done! What is your maximum budget (e.g. 5000)?'), 500);
        } else if (step === 'ASK_BUDGET') {
            const budgetVal = parseFloat(text) || 999;
            setAnswers(prev => ({ ...prev, budget: text }));
            setStep('RESULTS');

            const filtered = properties.filter(prop => {
                const cityQuery = answers.city?.toLowerCase();
                const locQuery = answers.location?.toLowerCase();
                const budgetVal = parseFloat(text) || 999;

                const hasCityMatch = cityQuery && prop.city.toLowerCase().includes(cityQuery);
                const hasLocMatch = locQuery && (prop.description.toLowerCase().includes(locQuery) || prop.title.toLowerCase().includes(locQuery));

                const minPrice = prop.units?.reduce((min: number, unit: any) => {
                    const price = unit.unitPricing?.[0]?.price || 1000000;
                    return price < min ? price : min;
                }, 1000000);
                const hasBudgetMatch = budgetVal && minPrice <= (budgetVal * 1.1); // 10% tolerance

                return hasCityMatch || hasLocMatch || hasBudgetMatch;
            });

            setTimeout(() => {
                if (filtered.length > 0) {
                    addMessage('bot', `I found some matches for you!`);
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
                    <button className="btn btn-sm text-white p-0 border-0" onClick={() => setIsExpanded(!isExpanded)} title="Expand">
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
                            <div className="input-area mt-2 border-top position-sticky bottom-0 bg-white shadow-sm rounded-pill">
                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const input = (e.target as any).message;
                                    if (input.value) {
                                        handleAnswer(input.value);
                                        input.value = '';
                                    }
                                }}>
                                    <div className="input-group">
                                        <input
                                            name="message"
                                            type="text"
                                            className="form-control form-control-sm border-0 bg-transparent px-3"
                                            placeholder="Your answer..."
                                            autoFocus
                                            autoComplete="off"
                                        />
                                        <button className="btn btn-sm btn-link p-1 me-1" style={{ color: theme.primaryColor }}>
                                            <i className="bi bi-arrow-up-circle-fill fs-5"></i>
                                        </button>
                                    </div>
                                </form>
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
                    position: fixed;
                    bottom: 80px;
                    right: 20px;
                    width: 320px;
                    z-index: 1000;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                .chatbot-window.expanded {
                    width: 600px;
                    top: 30px;
                    bottom: 80px;
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
