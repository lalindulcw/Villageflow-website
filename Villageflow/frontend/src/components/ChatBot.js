// src/components/ChatBot.js
import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { 
    X, Send, Minimize2, Bot, Loader2, 
    Wifi, WifiOff, Trash2, Sparkles, ChevronUp, 
    Volume2, VolumeX, HelpCircle, Zap, MessageCircle
} from 'lucide-react';

const ChatBot = ({ userRole = 'citizen', currentLang = 'si' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState(() => {
        const saved = localStorage.getItem('chatMessages');
        if (saved && JSON.parse(saved).length > 0) {
            return JSON.parse(saved);
        }
        return [];
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [chatLang, setChatLang] = useState(currentLang);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    // Professional UI Text for Chat Interface
    const uiText = {
        si: {
            title: "VillageFlow AI සහායක",
            online: "සබැඳිව",
            offline: "නොබැඳි",
            clearChat: "සංවාදය මකන්න",
            minimize: "කුඩා කරන්න",
            close: "වසන්න",
            typePlaceholder: "ඔබගේ ප්‍රශ්නය ලියන්න...",
            thinking: "පිළිතුර සකසමින්...",
            noInternet: "අන්තර්ජාල සම්බන්ධතාවයක් නැත",
            welcome: "👋 **ආයුබෝවන්!** මම **VillageFlow AI සහායක** වෙමි.\n\n🏛️ **ශ්‍රී ලංකා රජයේ ඩිජිටල් සේවා පද්ධතිය** වෙත ඔබව සාදරයෙන් පිළිගනිමු.\n\n📌 **මට ඔබට උදව් කළ හැකි ක්‍රම:**\n✅ ගිණුම් ලියාපදිංචිය සහ පුරනය වීම\n✅ සහතික අයදුම්පත්\n✅ සහනාධර අයදුම්පත්\n✅ පත්වීම් වෙන්කරවා ගැනීම\n✅ ප්‍රොක්සි ලියාපදිංචිය\n✅ අයදුම්පත් තත්වය\n✅ ග්‍රාම නිලධාරී සම්බන්ධතා\n\n💬 **ඔබට ඕනෑම ප්‍රශ්නයක් අසන්න පුළුවන්!**"
        },
        en: {
            title: "VillageFlow AI Assistant",
            online: "Online",
            offline: "Offline",
            clearChat: "Clear Chat",
            minimize: "Minimize",
            close: "Close",
            typePlaceholder: "Type your question...",
            thinking: "Thinking...",
            noInternet: "No internet connection",
            welcome: "👋 **Welcome!** I'm **VillageFlow AI Assistant**.\n\n🏛️ **Government of Sri Lanka Digital Services**\n\n📌 **How I can help you:**\n✅ Account Registration & Login\n✅ Certificate Applications\n✅ Welfare Applications\n✅ Appointment Booking\n✅ Proxy Registration\n✅ Application Status\n✅ GN Office Contact\n\n💬 **Ask me anything!**"
        },
        ta: {
            title: "VillageFlow AI உதவியாளர்",
            online: "இணையத்தில்",
            offline: "இணையம் இல்லை",
            clearChat: "உரையாடலை அழிக்கவும்",
            minimize: "சிறிதாக்கு",
            close: "மூடு",
            typePlaceholder: "உங்கள் கேள்வியை தட்டச்சு செய்யவும்...",
            thinking: "சிந்தித்துக் கொண்டிருக்கிறது...",
            noInternet: "இணைய இணைப்பு இல்லை",
            welcome: "👋 **வணக்கம்!** நான் **VillageFlow AI உதவியாளர்**.\n\n🏛️ **இலங்கை அரசாங்க டிஜிட்டல் சேவைகள்**\n\n📌 **நான் உதவக்கூடிய வழிகள்:**\n✅ பதிவு & உள்நுழைவு\n✅ சான்றிதழ் விண்ணப்பங்கள்\n✅ நலன்புரி விண்ணப்பங்கள்\n✅ சந்திப்பு முன்பதிவு\n✅ ப்ராக்ஸி பதிவு\n✅ விண்ணப்ப நிலை\n✅ GN அலுவலக தொடர்பு\n\n💬 **என்னை எதையும் கேளுங்கள்!**"
        }
    };

    const t = uiText[chatLang] || uiText.en;

    // Save messages to localStorage
    useEffect(() => {
        const messagesToSave = messages.slice(-50);
        localStorage.setItem('chatMessages', JSON.stringify(messagesToSave));
    }, [messages]);

    // Auto scroll to bottom
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            setTimeout(() => inputRef.current.focus(), 100);
        }
    }, [isOpen, isMinimized]);

    // Online/Offline status listener
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Allow quick exit from chatbot using Escape
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
                setIsMinimized(false);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    // Add welcome message when chat opens
    useEffect(() => {
        if (messages.length === 0 && isOpen) {
            const welcomeMsg = {
                id: Date.now(),
                text: t.welcome,
                sender: 'bot',
                time: new Date().toLocaleTimeString(),
                isTyping: false
            };
            setMessages([welcomeMsg]);
        }
    }, [isOpen, t.welcome, messages.length]);

    // Text to Speech function
    const speakText = (text) => {
        if (!window.speechSynthesis) return;
        
        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            return;
        }
        
        const cleanText = text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/[#*_]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        if (chatLang === 'si') utterance.lang = 'si-LK';
        else if (chatLang === 'ta') utterance.lang = 'ta-IN';
        else utterance.lang = 'en-US';
        
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
    };

    // Format message text with HTML
    const formatMessageText = (text) => {
        let formatted = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\n/g, '<br/>');
        formatted = formatted.replace(/✅/g, '<span style="color:#10b981;">✅</span>');
        formatted = formatted.replace(/⚠️/g, '<span style="color:#f59e0b;">⚠️</span>');
        formatted = formatted.replace(/❌/g, '<span style="color:#ef4444;">❌</span>');
        formatted = formatted.replace(/🔐/g, '<span style="color:#3b82f6;">🔐</span>');
        formatted = formatted.replace(/📝/g, '<span style="color:#8b5cf6;">📝</span>');
        formatted = formatted.replace(/🏛️/g, '<span style="color:#800000;">🏛️</span>');
        formatted = formatted.replace(/📌/g, '<span style="color:#f59e0b;">📌</span>');
        return formatted;
    };

    // Send message to backend
    const sendMessage = async () => {
        if (!input.trim()) return;
        
        // Offline mode handling
        if (!isOnline) {
            const offlineMsg = {
                id: Date.now(),
                text: `⚠️ ${t.noInternet}. ${chatLang === 'si' ? 'කරුණාකර පසුව නැවත උත්සාහ කරන්න.' : (chatLang === 'ta' ? 'தயவுசெய்து பின்னர் மீண்டும் முயற்சிக்கவும்.' : 'Please try again later.')}`,
                sender: 'bot',
                time: new Date().toLocaleTimeString(),
                isTyping: false
            };
            setMessages(prev => [...prev, offlineMsg]);
            setInput('');
            return;
        }

        // Add user message
        const userMessage = { 
            id: Date.now(),
            text: input, 
            sender: 'user', 
            time: new Date().toLocaleTimeString(),
            isTyping: false
        };
        setMessages(prev => [...prev, userMessage]);
        const userInput = input;
        setInput('');
        setIsLoading(true);

        // Add typing indicator
        const typingId = Date.now() + 1;
        setMessages(prev => [...prev, {
            id: typingId,
            text: '',
            sender: 'bot',
            time: new Date().toLocaleTimeString(),
            isTyping: true
        }]);

        try {
            const response = await axios.post('https://villageflow.onrender.com/api/chatbot/chat', {
                message: userInput,
                userRole: userRole,
                lang: chatLang
            });
            
            // Remove typing indicator
            setMessages(prev => prev.filter(msg => msg.id !== typingId));
            
            // Add bot response
            const botMessage = {
                id: Date.now(),
                text: response.data.reply,
                sender: 'bot',
                time: new Date().toLocaleTimeString(),
                isTyping: false
            };
            setMessages(prev => [...prev, botMessage]);
            
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => prev.filter(msg => msg.id !== typingId));
            
            const errorMessage = {
                id: Date.now(),
                text: chatLang === 'si' ? '❌ සමාවන්න, දෝෂයක් ඇති විය. කරුණාකර පසුව නැවත උත්සාහ කරන්න.' :
                       (chatLang === 'ta' ? '❌ மன்னிக்கவும், பிழை ஏற்பட்டது. தயவுசெய்து பின்னர் மீண்டும் முயற்சிக்கவும்.' :
                       '❌ Sorry, an error occurred. Please try again later.'),
                sender: 'bot',
                time: new Date().toLocaleTimeString(),
                isTyping: false
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isLoading) {
            sendMessage();
        }
    };

    const clearChat = () => {
        setMessages([]);
        localStorage.removeItem('chatMessages');
    };

    const changeLanguage = (newLang) => {
        setChatLang(newLang);
    };

    // Only show for citizen role
    if (userRole !== 'citizen') {
        return null;
    }

    // Professional quick suggestions
    const suggestions = [
        chatLang === 'si' ? 'ලියාපදිංචි වෙන්නේ කෙසේද?' : (chatLang === 'ta' ? 'எவ்வாறு பதிவு செய்வது?' : 'How to register?'),
        chatLang === 'si' ? 'සහතිකයක් ලබා ගන්නේ කෙසේද?' : (chatLang === 'ta' ? 'சான்றிதழை எவ்வாறு பெறுவது?' : 'How to get certificate?'),
        chatLang === 'si' ? 'සහනාධර ගැන විස්තර' : (chatLang === 'ta' ? 'நலன்புரி விவரங்கள்' : 'Welfare details'),
        chatLang === 'si' ? 'ප්‍රොක්සි ලියාපදිංචිය' : (chatLang === 'ta' ? 'ப்ராக்ஸி பதிவு' : 'Proxy registration'),
        chatLang === 'si' ? 'ග්‍රාම නිලධාරී අමතන්න' : (chatLang === 'ta' ? 'கிராம அதிகாரியை தொடர்பு கொள்ள' : 'Contact GN officer'),
        chatLang === 'si' ? 'ගෙවීම් ගාස්තු' : (chatLang === 'ta' ? 'கட்டணங்கள்' : 'Payment fees')
    ];

    return (
        <>
            {/* Chat Button - Closed State */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={chatStyles.chatButton}
                    className="chat-button"
                >
                    <MessageCircle size={28} color="white" />
                    <Zap size={14} color="#fbc531" style={chatStyles.sparkIcon} />
                    <span style={chatStyles.notificationBadge}>AI</span>
                </button>
            )}

            {/* Chat Window - Open State */}
            {isOpen && (
                <div style={chatStyles.chatWindow} className="chat-window">
                    {/* Header */}
                    <div className="chat-header" style={chatStyles.chatHeader}>
                        <div className="chat-header-left" style={chatStyles.headerLeft}>
                            <div style={chatStyles.botAvatar}>
                                <Bot size={22} color="#800000" />
                            </div>
                            <div>
                            <div className="chat-header-title" style={chatStyles.headerTitle}>
                                    {t.title}
                                    <Sparkles size={12} color="#fbc531" style={{ marginLeft: '6px' }} />
                                </div>
                                <div style={chatStyles.headerStatus}>
                                    {isOnline ? (
                                        <><Wifi size={10} /> <span style={{ color: '#10b981' }}>{t.online}</span></>
                                    ) : (
                                        <><WifiOff size={10} /> <span style={{ color: '#ef4444' }}>{t.offline}</span></>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="chat-header-actions" style={chatStyles.headerActions}>
                            {/* Language Selector */}
                            <div className="chat-lang-selector" style={chatStyles.langSelector}>
                                <button onClick={() => changeLanguage('si')} style={chatLang === 'si' ? chatStyles.activeLangBtn : chatStyles.langBtn}>සිං</button>
                                <button onClick={() => changeLanguage('en')} style={chatLang === 'en' ? chatStyles.activeLangBtn : chatStyles.langBtn}>EN</button>
                                <button onClick={() => changeLanguage('ta')} style={chatLang === 'ta' ? chatStyles.activeLangBtn : chatStyles.langBtn}>த</button>
                            </div>
                            {/* Clear Chat Button */}
                            <button onClick={clearChat} style={chatStyles.iconBtn} title={t.clearChat}>
                                <Trash2 size={16} />
                            </button>
                            {/* Minimize Button */}
                            <button onClick={() => setIsMinimized(!isMinimized)} style={chatStyles.iconBtn}>
                                {isMinimized ? <ChevronUp size={16} /> : <Minimize2 size={16} />}
                            </button>
                            {/* Close Button */}
                            <button onClick={() => setIsOpen(false)} style={chatStyles.iconBtn}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Chat Content - Not Minimized */}
                    {!isMinimized && (
                        <>
                            {/* Messages Area */}
                            <div className="chat-messages" style={chatStyles.chatMessages}>
                                {messages.map((msg) => (
                                    <div key={msg.id} style={msg.sender === 'user' ? chatStyles.userMessage : chatStyles.botMessage}>
                                        {msg.isTyping ? (
                                            <div style={chatStyles.typingIndicator}>
                                                <Loader2 size={16} className="spin" />
                                                <span>{t.thinking}</span>
                                            </div>
                                        ) : (
                                            <div style={{
                                                ...chatStyles.messageContent,
                                                ...(msg.sender === 'user' ? chatStyles.userMessageContent : chatStyles.botMessageContent)
                                            }}>
                                                {msg.sender === 'bot' && (
                                                    <div style={chatStyles.botIconSmall}>
                                                        <Bot size={14} color="#800000" />
                                                    </div>
                                                )}
                                                <div 
                                                    dangerouslySetInnerHTML={{ __html: formatMessageText(msg.text) }}
                                                    style={chatStyles.messageText}
                                                />
                                                <div style={chatStyles.messageFooter}>
                                                    <span style={chatStyles.messageTime}>{msg.time}</span>
                                                    {msg.sender === 'bot' && (
                                                        <button onClick={() => speakText(msg.text)} style={chatStyles.speakBtn} title="Read aloud">
                                                            {isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Quick Suggestions */}
                            <div style={chatStyles.quickSuggestions}>
                                <div style={chatStyles.suggestionsHeader}>
                                    <HelpCircle size={12} color="#800000" />
                                    <span style={chatStyles.suggestionsTitle}>
                                        {chatLang === 'si' ? 'ඉක්මන් ප්‍රශ්න' : (chatLang === 'ta' ? 'விரைவு கேள்விகள்' : 'Quick Questions')}
                                    </span>
                                </div>
                                <div style={chatStyles.suggestionsGrid}>
                                    {suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setInput(suggestion); setTimeout(() => sendMessage(), 50); }}
                                            style={chatStyles.suggestionBtn}
                                            className="suggestion-btn"
                                        >
                                            {suggestion.length > 28 ? suggestion.substring(0, 25) + '...' : suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Input Area */}
                            <div style={chatStyles.chatInput}>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={t.typePlaceholder}
                                    style={chatStyles.input}
                                    disabled={isLoading}
                                    className="chat-input"
                                />
                                <button 
                                    onClick={sendMessage} 
                                    style={{...chatStyles.sendBtn, opacity: (!input.trim() || isLoading) ? 0.5 : 1}}
                                    disabled={!input.trim() || isLoading}
                                    className="send-btn"
                                >
                                    {isLoading ? <Loader2 size={18} className="spin" /> : <Send size={18} color="white" />}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
            
            {/* Global Styles for Animations */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin { animation: spin 1s linear infinite; }
                
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .chat-window { animation: slideUp 0.3s ease-out; }
                
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
                
                .suggestion-btn {
                    transition: all 0.2s ease;
                }
                .suggestion-btn:hover {
                    background: #800000 !important;
                    color: white !important;
                    transform: translateY(-2px);
                }
                
                .chat-button {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .chat-button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(128,0,0,0.3);
                }
                
                .send-btn {
                    transition: opacity 0.2s, transform 0.2s;
                }
                .send-btn:hover:not(:disabled) {
                    opacity: 0.9;
                    transform: scale(1.02);
                }
                
                .chat-input:focus {
                    border-color: #800000;
                    box-shadow: 0 0 0 2px rgba(128,0,0,0.1);
                    outline: none;
                }
                
                .speak-btn {
                    transition: opacity 0.2s;
                }
                .speak-btn:hover {
                    opacity: 0.7;
                }
                
                /* Custom Scrollbar */
                .chat-messages::-webkit-scrollbar {
                    width: 6px;
                }
                .chat-messages::-webkit-scrollbar-track {
                    background: #f1f5f9;
                    border-radius: 10px;
                }
                .chat-messages::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .chat-messages::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }

                @media (max-width: 768px) {
                    .chat-window {
                        width: 94vw !important;
                        right: 3vw !important;
                        left: auto !important;
                        max-height: calc(100vh - 88px) !important;
                        height: auto !important;
                        bottom: 10px !important;
                        border-radius: 14px !important;
                    }

                    .chat-window .chat-header {
                        padding: 10px 12px !important;
                    }

                    .chat-window .chat-header-left {
                        min-width: 0 !important;
                        gap: 8px !important;
                    }

                    .chat-window .chat-header-title {
                        font-size: 13px !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        white-space: nowrap !important;
                        max-width: 40vw !important;
                    }

                    .chat-window .chat-lang-selector {
                        padding: 2px 4px !important;
                        margin-right: 0 !important;
                        gap: 2px !important;
                    }

                    .chat-window .chat-header-actions {
                        gap: 4px !important;
                        flex-wrap: nowrap !important;
                        overflow-x: auto !important;
                        max-width: 50vw !important;
                    }

                    .chat-window .chat-header-actions button {
                        min-height: auto !important;
                        width: auto !important;
                        margin: 0 !important;
                        padding: 6px !important;
                    }
                }
            `}</style>
        </>
    );
};

// Professional Styles
const chatStyles = {
    chatButton: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '60px',
        height: '60px',
        borderRadius: '30px',
        backgroundColor: '#800000',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 15px rgba(128,0,0,0.3)',
        zIndex: 998,
        transition: 'all 0.3s ease'
    },
    sparkIcon: { 
        position: 'absolute', 
        top: '5px', 
        right: '8px' 
    },
    notificationBadge: {
        position: 'absolute',
        top: '-5px',
        right: '-5px',
        backgroundColor: '#fbc531',
        color: '#800000',
        borderRadius: '10px',
        padding: '2px 6px',
        fontSize: '10px',
        fontWeight: 'bold',
        fontFamily: 'monospace'
    },
    chatWindow: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '420px',
        height: 'min(600px, calc(100vh - 90px))',
        backgroundColor: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 999,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    chatHeader: {
        backgroundColor: '#800000',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    headerLeft: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px' 
    },
    botAvatar: {
        width: '40px',
        height: '40px',
        backgroundColor: 'white',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: { 
        fontWeight: 'bold', 
        fontSize: '16px', 
        display: 'flex', 
        alignItems: 'center' 
    },
    headerStatus: { 
        fontSize: '10px', 
        opacity: 0.8, 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        marginTop: '2px' 
    },
    headerActions: { 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center' 
    },
    langSelector: { 
        display: 'flex', 
        gap: '4px', 
        backgroundColor: 'rgba(255,255,255,0.15)', 
        padding: '4px 8px', 
        borderRadius: '20px', 
        marginRight: '4px' 
    },
    langBtn: { 
        background: 'none', 
        border: 'none', 
        color: 'rgba(255,255,255,0.7)', 
        cursor: 'pointer', 
        fontSize: '11px', 
        fontWeight: 'bold', 
        padding: '4px 8px', 
        borderRadius: '12px',
        transition: 'all 0.2s'
    },
    activeLangBtn: { 
        background: '#fbc531', 
        border: 'none', 
        color: '#800000', 
        cursor: 'pointer', 
        fontSize: '11px', 
        fontWeight: 'bold', 
        padding: '4px 8px', 
        borderRadius: '12px'
    },
    iconBtn: { 
        background: 'none', 
        border: 'none', 
        color: 'white', 
        cursor: 'pointer', 
        padding: '6px', 
        borderRadius: '6px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        transition: 'background 0.2s'
    },
    chatMessages: { 
        flex: 1, 
        padding: '20px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px', 
        backgroundColor: '#f8fafc' 
    },
    userMessage: { 
        display: 'flex', 
        justifyContent: 'flex-end' 
    },
    botMessage: { 
        display: 'flex', 
        justifyContent: 'flex-start' 
    },
    messageContent: { 
        maxWidth: '85%', 
        padding: '12px 16px', 
        borderRadius: '18px', 
        fontSize: '14px', 
        position: 'relative', 
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)', 
        wordWrap: 'break-word', 
        whiteSpace: 'pre-wrap' 
    },
    userMessageContent: { 
        backgroundColor: '#800000', 
        color: 'white', 
        borderBottomRightRadius: '4px' 
    },
    botMessageContent: { 
        backgroundColor: 'white', 
        color: '#334155', 
        borderBottomLeftRadius: '4px', 
        border: '1px solid #e2e8f0' 
    },
    botIconSmall: { 
        display: 'inline-block', 
        marginRight: '8px', 
        verticalAlign: 'middle' 
    },
    messageText: { 
        lineHeight: '1.5' 
    },
    messageFooter: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginTop: '6px', 
        gap: '10px' 
    },
    messageTime: { 
        fontSize: '9px', 
        opacity: 0.6 
    },
    speakBtn: { 
        background: 'none', 
        border: 'none', 
        cursor: 'pointer', 
        padding: '2px', 
        opacity: 0.5, 
        display: 'flex', 
        alignItems: 'center',
        transition: 'opacity 0.2s'
    },
    typingIndicator: { 
        backgroundColor: 'white', 
        padding: '12px 20px', 
        borderRadius: '20px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        border: '1px solid #e2e8f0', 
        color: '#64748b' 
    },
    quickSuggestions: { 
        padding: '12px 16px', 
        borderTop: '1px solid #e2e8f0', 
        backgroundColor: 'white' 
    },
    suggestionsHeader: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '8px', 
        marginBottom: '10px' 
    },
    suggestionsTitle: { 
        fontSize: '11px', 
        fontWeight: '600', 
        color: '#64748b', 
        textTransform: 'uppercase', 
        letterSpacing: '0.5px' 
    },
    suggestionsGrid: { 
        display: 'flex', 
        gap: '8px', 
        flexWrap: 'wrap' 
    },
    suggestionBtn: { 
        padding: '8px 14px', 
        backgroundColor: '#f1f5f9', 
        border: '1px solid #e2e8f0', 
        borderRadius: '20px', 
        fontSize: '12px', 
        cursor: 'pointer', 
        transition: 'all 0.2s', 
        whiteSpace: 'nowrap', 
        color: '#334155',
        fontFamily: 'inherit'
    },
    chatInput: { 
        padding: '16px', 
        borderTop: '1px solid #e2e8f0', 
        display: 'flex', 
        gap: '10px', 
        backgroundColor: 'white' 
    },
    input: { 
        flex: 1, 
        padding: '12px 16px', 
        border: '1px solid #e2e8f0', 
        borderRadius: '25px', 
        outline: 'none', 
        fontSize: '14px', 
        transition: 'all 0.2s',
        fontFamily: 'inherit'
    },
    sendBtn: { 
        width: '44px', 
        height: '44px', 
        borderRadius: '22px', 
        backgroundColor: '#800000', 
        border: 'none', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        transition: 'all 0.2s' 
    }
};

export default ChatBot;