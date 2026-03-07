/**
 * Virpanix Intelligent Voice — Conversation Engine
 * All basic chat / small-talk patterns live here.
 * → Returns null if no pattern matches (caller should try data commands instead).
 */

interface ConversationRule {
    /** One or more substrings that must appear in the transcript */
    triggers: string[];
    /** One or more possible replies — one is picked at random */
    replies: string[];
}

const RULES: ConversationRule[] = [
    // ── Identity ──────────────────────────────────────────────────────────────
    {
        triggers: ['who are you', 'what are you', 'introduce yourself', 'your name', 'who made you'],
        replies: [
            "I'm Virpanix, your intelligent real-estate voice assistant. I can pull up leads, bookings, and answer your questions instantly.",
            "I am Virpanix — an AI-powered command center built for real-estate professionals like you. Just ask!",
            "My name is Virpanix. I manage your real-estate data and conversations using the power of voice."
        ]
    },
    // ── Greetings ─────────────────────────────────────────────────────────────
    {
        triggers: ['hello', 'hi ', 'hey ', 'good morning', 'good afternoon', 'good evening', 'good night', 'howdy'],
        replies: [
            "Hello! Great to hear from you. What can I help you with today?",
            "Hi there! I'm all ears. Ask me about leads, bookings, or anything else.",
            "Hey! Virpanix is ready. What would you like to explore today?"
        ]
    },
    // ── How are you ───────────────────────────────────────────────────────────
    {
        triggers: ['how are you', 'how are u', 'how r you', 'you okay', 'are you okay', 'you alright'],
        replies: [
            "I'm doing fantastic, thank you for asking! My systems are running at full capacity. How about you?",
            "All circuits are green! I'm ready and energized. How can I assist you today?",
            "Couldn't be better! I love a good conversation. What's on your mind?",
            "I'm great, and always happy to hear from you. How are things on your end?"
        ]
    },
    // ── How is it going ───────────────────────────────────────────────────────
    {
        triggers: ['how is it going', 'how\'s it going', 'how is going', 'whats up', "what's up", 'sup ', 'hows things', "how's things"],
        replies: [
            "Everything is going smoothly! All data pipelines are live. What do you need?",
            "Things are great on my end! Ready to pull up any data you need.",
            "It's going well — just waiting for your next command. What shall we look at?"
        ]
    },
    // ── What can you do ───────────────────────────────────────────────────────
    {
        triggers: ['what can you do', 'what do you do', 'help me', 'show me what you can', 'capabilities', 'features'],
        replies: [
            "I can list your leads, show bookings, filter by status or date, and have a conversation with you — all by voice! Try saying 'List new leads' or 'Show today's bookings'.",
            "Here's what I can do: pull up leads, show bookings, filter by date or status, and chat with you. Just ask naturally!",
            "I'm your voice-powered real-estate command center. I handle lead queries, booking lookups, and general conversation. What would you like first?"
        ]
    },
    // ── Thank you ─────────────────────────────────────────────────────────────
    {
        triggers: ['thank you', 'thanks', 'thank u', 'appreciate it', 'appreciate that', 'cheers', 'brilliant'],
        replies: [
            "You're very welcome! Is there anything else you'd like to know?",
            "It's my pleasure! Do you have another query?",
            "Anytime! That's what I'm here for — just say the word.",
            "Happy to help! Shall I fetch anything else for you?"
        ]
    },
    // ── Goodbye ───────────────────────────────────────────────────────────────
    {
        triggers: ['bye', 'goodbye', 'see you', 'later', 'take care', 'talk soon'],
        replies: [
            "Goodbye! I'll be right here whenever you need me. Say 'Wake up' to resume!",
            "See you soon! Say 'Wake up' anytime to bring me back.",
            "Take care! I'll go to sleep for now. Just say 'Wake up' when you're back."
        ]
    },
    // ── Compliments ───────────────────────────────────────────────────────────
    {
        triggers: ['good job', 'well done', 'great job', 'nice work', 'you are great', 'you are amazing', "you're amazing", "you're great"],
        replies: [
            "Thank you so much! That really motivates me. What's next?",
            "You're too kind! I'm always striving to be better. What else can I do?",
            "That means a lot! I'm here to make your work easier. Shall we continue?"
        ]
    },
    // ── Time / Date ───────────────────────────────────────────────────────────
    {
        triggers: ['what time is it', 'what is the time', 'current time', "what's the time", 'what day is it', 'today\'s date', "today's date"],
        replies: [
            `Right now it is ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.`,
        ]
    },
    // ── Jokes ─────────────────────────────────────────────────────────────────
    {
        triggers: ['tell me a joke', 'say a joke', 'joke', 'make me laugh', 'funny'],
        replies: [
            "Why did the property agent bring a ladder to work? Because the market is always going up! 😄",
            "What do you call a real-estate agent who also does yoga? A flexible seller! 😂",
            "Why did the house go to therapy? It had too many walls to break down! 🏠"
        ]
    },
    // ── Motivational ──────────────────────────────────────────────────────────
    {
        triggers: ['motivate me', 'inspire me', 'i need motivation', 'encourage me'],
        replies: [
            "Every great deal starts with a single conversation. You've already taken the first step by showing up today!",
            "Success in real estate is built one client at a time. You're doing great — keep going!",
            "Real estate is not just about properties; it's about people. And you're clearly great with people!"
        ]
    },
    // ── Boredom ───────────────────────────────────────────────────────────────
    {
        triggers: ['i am bored', "i'm bored", 'bored', 'nothing to do'],
        replies: [
            "Let's put that energy to good use! Try 'List new leads' — you might find an opportunity waiting.",
            "No boredom allowed! How about reviewing today's bookings? There's always something to explore.",
            "Bored? Let me show you your latest leads — I bet one of them is your next big deal!"
        ]
    },
];

/**
 * Match a transcript against all conversation rules.
 * Returns a spoken reply string, or null if no rule matches.
 */
export function matchConversation(transcript: string): string | null {
    const lower = transcript.toLowerCase().trim();

    for (const rule of RULES) {
        const hit = rule.triggers.some(trigger => lower.includes(trigger));
        if (hit) {
            const replies = rule.replies;
            return replies[Math.floor(Math.random() * replies.length)];
        }
    }

    return null;
}
