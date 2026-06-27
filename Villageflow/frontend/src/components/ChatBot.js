import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';
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
            welcome: "👋 **ආයුබෝවන්!** මම **VillageFlow AI සහායක** වෙමි.\n\n🏛️ **ශ්‍රී ලංකා රජයේ ඩිජිටල් සේවා පද්ධතිය** වෙත ඔබව සාදරයෙන් පිළිගනිමු.\n\n📌 **මට ඔබට උදව් කළ හැකි ක්‍රම:**\n✅ ගිණුම් ලියාපදිංචිය සහ පුරනය වීම\n✅ සහතික සහ සහනාධර අයදුම්පත්\n✅ පත්වීම් වෙන්කරවා ගැනීම සහ ප්‍රොක්සි\n✅ ආපදා සේවා සහ හදිසි SOS 🚨\n✅ යටිතල පහසුකම් පැමිණිලි 🛣️\n✅ මැතිවරණ සහ ඡන්ද තොරතුරු 🗳️\n\n💬 **ඔබට ඕනෑම ප්‍රශ්නයක් අසන්න පුළුවන්!**",
            welcomeOfficer: "👋 **ආයුබෝවන් ගෞරවනීය නිලධාරීතුමනි!** මම **VillageFlow AI සහායක** වෙමි.\n\n🏛️ **රාජකාරි කටයුතු පහසු කිරීමේ සහායක පද්ධතිය**\n\n📌 **මට ඔබට සහාය විය හැකි ප්‍රධාන මාර්ග:**\n✅ පුරවැසි සහතික අයදුම්පත් අනුමත කිරීම\n✅ සහනාධර අයදුම්පත් පරීක්ෂා කිරීම\n✅ හදිසි ආපදා/SOS අනතුරු ඇඟවීම් නිකුත් කිරීම\n✅ යටිතල පහසුකම් පැමිණිලිවල ප්‍රගතිය යාවත්කාලීන කිරීම\n✅ මැතිවරණ තොරතුරු සහ පද්ධති සැකසුම් සැකසීම\n\n💬 **ඔබට අවශ්‍ය ඕනෑම රාජකාරි මගපෙන්වීමක් විමසන්න!**"
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
            welcome: "👋 **Welcome!** I'm **VillageFlow AI Assistant**.\n\n🏛️ **Government of Sri Lanka Digital Services**\n\n📌 **How I can help you:**\n✅ Account Registration & Login\n✅ Certificate & Welfare Applications\n✅ Appointment Booking & Proxy Registration\n✅ Disaster & Emergency SOS Alerts 🚨\n✅ Report Infrastructure Complaints 🛣️\n✅ Election updates & Candidate lists 🗳️\n\n💬 **Ask me anything!**",
            welcomeOfficer: "👋 **Welcome, Administrative Officer!** I'm **VillageFlow AI Assistant**.\n\n🏛️ **Officer Helpdesk & Task Assistance Portal**\n\n📌 **How I can assist your administrative tasks:**\n✅ Certificate Approvals & Rejections\n✅ Welfare Processing (Aswasuma/Samurdhi)\n✅ Issuing Disaster & SOS Safety Warnings\n✅ Managing public Infrastructure Complaints\n✅ System Configurations & Polling Stations\n\n💬 **Ask me any administrative guidelines!**"
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
            welcome: "👋 **வணக்கம்!** நான் **VillageFlow AI உதவியாளர்**.\n\n🏛️ **இலங்கை அரசாங்க டிஜிட்டல் சேவைகள்**\n\n📌 **நான் உதவக்கூடிய வழிகள்:**\n✅ பதிவு & உள்நுழைவு\n✅ சான்றிதழ் & நலன்புரி விண்ணப்பங்கள்\n✅ சந்திப்பு & ப்ராக்ஸி பதிவு\n✅ பேரிடர் & அவசர SOS 🚨\n✅ உள்கட்டமைப்பு புகார்கள் 🛣️\n✅ தேர்தல் & வாக்கு விவரங்கள் 🗳️\n\n💬 **என்னை எதையும் கேளுங்கள்!**",
            welcomeOfficer: "👋 **வணக்கம், நிர்வாக அதிகாரி அவர்களே!** நான் **VillageFlow AI உதவியாளர்**.\n\n🏛️ **நிர்வாகப் பணிகளுக்கான உதவி மையம்**\n\n📌 **நான் உங்களுக்கு உதவக்கூடிய வழிகள்:**\n✅ சான்றிதழ் விண்ணப்பங்களை அங்கீகரிப்பது\n✅ நலன்புரி விண்ணப்பங்களைச் சரிபார்ப்பது\n✅ அவசர பேரிடர் எச்சரிக்கைகளை வெளியிடுவது\n✅ உள்கட்டமைப்பு புகார்களை மேலாண்மை செய்வது\n✅ கணினி அமைப்புகள் மற்றும் தேர்தல் தகவல்\n\n💬 **நிர்வாக வழிகாட்டுதல்களைப் பற்றி எதையும் கேளுங்கள்!**"
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
                text: userRole === 'officer' ? t.welcomeOfficer : t.welcome,
                sender: 'bot',
                time: new Date().toLocaleTimeString(),
                isTyping: false
            };
            setMessages([welcomeMsg]);
        }
    }, [isOpen, t.welcome, t.welcomeOfficer, messages.length, userRole]);

    // Sync chatLang with currentLang
    useEffect(() => {
        setChatLang(currentLang);
    }, [currentLang]);

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
        formatted = formatted.replace(/🏛️/g, '<span style="color:#8B0000;">🏛️</span>');
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
            const response = await axios.post(`${API_BASE}/chatbot/chat`, {
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

    // Professional quick suggestions
    const suggestions = userRole === 'officer'
        ? [
            chatLang === 'si' ? 'සහතික අනුමත කරන්නේ කෙසේද?' : (chatLang === 'ta' ? 'சான்றிதழ்களை எவ்வாறு அங்கீகரிப்பது?' : 'How to approve certificates?'),
            chatLang === 'si' ? 'ආපදා ඇඟවීමක් නිකුත් කිරීම' : (chatLang === 'ta' ? 'பேரிடர் எச்சரிக்கை வெளியிடுவது' : 'Publish disaster alert'),
            chatLang === 'si' ? 'පැමිණිලි යාවත්කාලීන කිරීම' : (chatLang === 'ta' ? 'புகார்களைப் புதுப்பிப்பது' : 'Update infra complaints'),
            chatLang === 'si' ? 'සහනාධර සැකසීම' : (chatLang === 'ta' ? 'நலன்புரி செயலாக்கம்' : 'Welfare processing'),
            chatLang === 'si' ? 'මැතිවරණ සැකසුම්' : (chatLang === 'ta' ? 'தேர்தல் அமைப்புகள்' : 'Election configurations'),
            chatLang === 'si' ? 'පද්ධති සැකසුම්' : (chatLang === 'ta' ? 'அமைப்பு அமைப்புகள்' : 'System configurations')
        ]
        : [
            chatLang === 'si' ? 'ආපදා සහ හදිසි SOS' : (chatLang === 'ta' ? 'பேரிடர் & அவசர SOS' : 'Disaster & Emergency SOS'),
            chatLang === 'si' ? 'යටිතල පහසුකම් පැමිණිල්ලක්' : (chatLang === 'ta' ? 'உள்கட்டமைப்பு புகார்' : 'Infrastructure complaint'),
            chatLang === 'si' ? 'මැතිවරණ සහ ඡන්ද විස්තර' : (chatLang === 'ta' ? 'தேர்தல் & வாக்கு விவரங்கள்' : 'Election & voting details'),
            chatLang === 'si' ? 'සහතික අයදුම්පත' : (chatLang === 'ta' ? 'சான்றிதழ் விண்ணப்பம்' : 'How to apply certificate'),
            chatLang === 'si' ? 'සහනාධර ගැන විස්තර' : (chatLang === 'ta' ? 'நலன்புரி விவரங்கள்' : 'Welfare details'),
            chatLang === 'si' ? 'ග්‍රාම නිලධාරී අමතන්න' : (chatLang === 'ta' ? 'கிராம அதிகாரியை தொடர்பு கொள்ள' : 'Contact GN officer')
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
                    <Zap size={14} color="#D4AF37" style={chatStyles.sparkIcon} />
                    <span style={chatStyles.notificationBadge}>AI</span>
                </button>
            )}

            {/* Chat Window - Open State */}
            {isOpen && (
                <div 
                    style={{
                        ...chatStyles.chatWindow,
                        height: isMinimized ? 'auto' : chatStyles.chatWindow.height
                    }} 
                    className={`chat-window ${isMinimized ? 'minimized' : ''}`}
                >
                    {/* Header */}
                    <div className="chat-header" style={chatStyles.chatHeader}>
                        <div className="chat-header-left" style={chatStyles.headerLeft}>
                            <div style={chatStyles.botAvatar}>
                                <Bot size={20} color="#D4AF37" />
                            </div>
                            <div>
                                <div className="chat-header-title" style={chatStyles.headerTitle}>
                                    {t.title}
                                    <Sparkles size={12} color="#D4AF37" style={{ marginLeft: '6px' }} />
                                </div>
                                <div style={chatStyles.headerStatus}>
                                    {isOnline ? (
                                        <><span className="status-dot online"></span> <span style={{ color: '#a7f3d0', fontWeight: '500' }}>{t.online}</span></>
                                    ) : (
                                        <><span className="status-dot offline"></span> <span style={{ color: '#fca5a5', fontWeight: '500' }}>{t.offline}</span></>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="chat-header-actions" style={chatStyles.headerActions}>
                            {/* Clear Chat Button */}
                            <button onClick={clearChat} style={chatStyles.iconBtn} title={t.clearChat}>
                                <Trash2 size={15} />
                            </button>
                            {/* Minimize Button */}
                            <button onClick={() => setIsMinimized(!isMinimized)} style={chatStyles.iconBtn} title={isMinimized ? "Maximize" : "Minimize"}>
                                {isMinimized ? <ChevronUp size={16} /> : <Minimize2 size={15} />}
                            </button>
                            {/* Close Button */}
                            <button onClick={() => setIsOpen(false)} style={chatStyles.iconBtn} title="Close">
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
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', width: '100%' }}>
                                                <div style={chatStyles.botAvatarOuter}>
                                                    <Bot size={14} color="white" />
                                                </div>
                                                <div style={chatStyles.typingIndicator}>
                                                    <span className="dot"></span>
                                                    <span className="dot"></span>
                                                    <span className="dot"></span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ 
                                                display: 'flex', 
                                                gap: '8px', 
                                                alignItems: 'flex-start',
                                                width: '100%',
                                                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                                            }}>
                                                {msg.sender === 'bot' && (
                                                    <div style={chatStyles.botAvatarOuter}>
                                                        <Bot size={14} color="white" />
                                                    </div>
                                                )}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    flexDirection: 'column', 
                                                    alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                                    maxWidth: '82%'
                                                }}>
                                                    <div style={{
                                                        ...chatStyles.messageContent,
                                                        ...(msg.sender === 'user' ? chatStyles.userMessageContent : chatStyles.botMessageContent)
                                                    }}>
                                                        <div 
                                                            dangerouslySetInnerHTML={{ __html: formatMessageText(msg.text) }}
                                                            style={chatStyles.messageText}
                                                        />
                                                    </div>
                                                    <div style={{
                                                        ...chatStyles.messageFooter,
                                                        alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                                        paddingLeft: msg.sender === 'bot' ? '4px' : '0',
                                                        paddingRight: msg.sender === 'user' ? '4px' : '0'
                                                    }}>
                                                        <span style={chatStyles.messageTime}>{msg.time}</span>
                                                        {msg.sender === 'bot' && (
                                                            <button onClick={() => speakText(msg.text)} style={chatStyles.speakBtn} title="Read aloud">
                                                                {isSpeaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
                                                            </button>
                                                        )}
                                                    </div>
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
                                    <HelpCircle size={12} color="#8B0000" />
                                    <span style={chatStyles.suggestionsTitle}>
                                        {chatLang === 'si' ? 'ඉක්මන් ප්‍රශ්න' : (chatLang === 'ta' ? 'விரைவு கேள்விகள்' : 'Quick Questions')}
                                    </span>
                                </div>
                                <div className="chat-suggestions-grid" style={chatStyles.suggestionsGrid}>
                                    {suggestions.map((suggestion, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => { setInput(suggestion); setTimeout(() => sendMessage(), 50); }}
                                            style={chatStyles.suggestionBtn}
                                            className="suggestion-btn"
                                        >
                                            {suggestion}
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
                                    {isLoading ? <Loader2 size={16} className="spin" color="white" /> : <Send size={16} color="white" />}
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
                    from { opacity: 0; transform: translateY(24px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .chat-window { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
                
                .chat-window.minimized {
                    height: auto !important;
                }

                @keyframes dotBounce {
                    0%, 100% { transform: translateY(0); opacity: 0.4; }
                    50% { transform: translateY(-4px); opacity: 1; }
                }
                .dot {
                    width: 6px;
                    height: 6px;
                    background-color: #64748b;
                    border-radius: 50%;
                    display: inline-block;
                    animation: dotBounce 1.2s infinite ease-in-out;
                }
                .dot:nth-child(2) {
                    animation-delay: 0.2s;
                }
                .dot:nth-child(3) {
                    animation-delay: 0.4s;
                }

                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    display: inline-block;
                    margin-right: 4px;
                }
                .status-dot.online {
                    background-color: #10b981;
                    box-shadow: 0 0 8px #10b981;
                }
                .status-dot.offline {
                    background-color: #ef4444;
                    box-shadow: 0 0 8px #ef4444;
                }

                .chat-suggestions-grid::-webkit-scrollbar {
                    display: none !important;
                }
                
                .suggestion-btn {
                    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .suggestion-btn:hover {
                    background: #8B0000 !important;
                    color: white !important;
                    border-color: #8B0000 !important;
                    transform: translateY(-1.5px);
                    box-shadow: 0 4px 10px rgba(128,0,0,0.15);
                }
                
                .chat-button {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .chat-button:hover {
                    transform: scale(1.06);
                    box-shadow: 0 6px 20px rgba(128,0,0,0.4);
                }
                
                .send-btn {
                    transition: all 0.2s ease;
                }
                .send-btn:hover:not(:disabled) {
                    transform: scale(1.05);
                    background-color: #9c1c24 !important;
                    box-shadow: 0 4px 12px rgba(128, 0, 0, 0.3);
                }
                
                .chat-input:focus {
                    border-color: #8B0000 !important;
                    box-shadow: 0 0 0 2px rgba(128,0,0,0.15) !important;
                    background-color: white !important;
                }
                
                .speak-btn {
                    transition: opacity 0.2s, transform 0.2s;
                }
                .speak-btn:hover {
                    opacity: 0.9;
                    transform: scale(1.1);
                    color: #8B0000;
                }
                
                /* Custom Scrollbar */
                .chat-messages::-webkit-scrollbar {
                    width: 5px;
                }
                .chat-messages::-webkit-scrollbar-track {
                    background: transparent;
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
                        width: 92vw !important;
                        right: 4vw !important;
                        left: auto !important;
                        max-height: calc(100vh - 120px) !important;
                        height: 500px !important;
                        bottom: 20px !important;
                        border-radius: 18px !important;
                        box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important;
                    }

                    .chat-window.minimized {
                        height: auto !important;
                    }

                    .chat-window .chat-header {
                        padding: 12px 16px !important;
                    }

                    .chat-window .chat-header-left {
                        min-width: 0 !important;
                        gap: 10px !important;
                    }

                    .chat-window .chat-header-title {
                        font-size: 14px !important;
                        overflow: hidden !important;
                        text-overflow: ellipsis !important;
                        white-space: nowrap !important;
                        max-width: 45vw !important;
                    }

                    .chat-window .chat-header-actions {
                        gap: 6px !important;
                        flex-wrap: nowrap !important;
                    }

                    .chat-window .chat-header-actions button {
                        min-height: auto !important;
                        width: auto !important;
                        margin: 0 !important;
                        padding: 5px !important;
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
        backgroundColor: '#8B0000',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 24px rgba(128,0,0,0.3)',
        zIndex: 1999,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    },
    sparkIcon: { 
        position: 'absolute', 
        top: '6px', 
        right: '8px' 
    },
    notificationBadge: {
        position: 'absolute',
        top: '-3px',
        right: '-3px',
        backgroundColor: '#D4AF37',
        color: '#8B0000',
        borderRadius: '10px',
        padding: '2px 6px',
        fontSize: '10px',
        fontWeight: 'bold',
        fontFamily: "'Inter', sans-serif",
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    },
    chatWindow: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '400px',
        height: 'min(550px, calc(100vh - 48px))',
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        boxShadow: '0 16px 48px rgba(0,0,0,0.16)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 2000,
        border: '1px solid #e2e8f0',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    },
    chatHeader: {
        background: 'linear-gradient(135deg, #8B0000 0%, #a51d24 100%)',
        color: 'white',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '3.5px solid #D4AF37'
    },
    headerLeft: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px' 
    },
    botAvatar: {
        width: '36px',
        height: '36px',
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1.5px solid #D4AF37'
    },
    botAvatarOuter: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#8B0000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: '1.5px solid #D4AF37',
        boxShadow: '0 2px 4px rgba(128,0,0,0.1)'
    },
    headerTitle: { 
        fontWeight: '700', 
        fontSize: '15px', 
        letterSpacing: '0.3px',
        display: 'flex', 
        alignItems: 'center' 
    },
    headerStatus: { 
        fontSize: '10px', 
        opacity: 0.9, 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        marginTop: '3px' 
    },
    headerActions: { 
        display: 'flex', 
        gap: '6px', 
        alignItems: 'center' 
    },
    iconBtn: { 
        background: 'none', 
        border: 'none', 
        color: 'rgba(255,255,255,0.85)', 
        cursor: 'pointer', 
        padding: '6px', 
        borderRadius: '8px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        transition: 'all 0.2s'
    },
    chatMessages: { 
        flex: 1, 
        padding: '20px', 
        overflowY: 'auto', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '16px', 
        backgroundColor: '#f8fafc' 
    },
    userMessage: { 
        display: 'flex', 
        justifyContent: 'flex-end',
        width: '100%'
    },
    botMessage: { 
        display: 'flex', 
        justifyContent: 'flex-start',
        width: '100%'
    },
    messageContent: { 
        maxWidth: '100%', 
        padding: '12px 16px', 
        fontSize: '14px', 
        lineHeight: '1.6',
        position: 'relative', 
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)', 
        wordWrap: 'break-word', 
        whiteSpace: 'pre-wrap' 
    },
    userMessageContent: { 
        backgroundColor: '#8B0000', 
        color: 'white', 
        borderRadius: '16px 16px 4px 16px',
        boxShadow: '0 3px 10px rgba(128,0,0,0.12)'
    },
    botMessageContent: { 
        backgroundColor: '#ffffff', 
        color: '#1e293b', 
        borderRadius: '16px 16px 16px 4px', 
        border: '1px solid #f1f5f9' 
    },
    messageText: { 
        lineHeight: '1.6' 
    },
    messageFooter: { 
        display: 'flex', 
        alignItems: 'center', 
        marginTop: '4px', 
        gap: '6px' 
    },
    messageTime: { 
        fontSize: '10px', 
        color: '#94a3b8'
    },
    speakBtn: { 
        background: 'none', 
        border: 'none', 
        cursor: 'pointer', 
        padding: '2px', 
        color: '#64748b',
        display: 'flex', 
        alignItems: 'center'
    },
    typingIndicator: { 
        backgroundColor: '#ffffff', 
        padding: '12px 18px', 
        borderRadius: '16px 16px 16px 4px', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px', 
        border: '1px solid #f1f5f9', 
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
    },
    quickSuggestions: { 
        padding: '12px 16px 14px 16px', 
        borderTop: '1px solid #f1f5f9', 
        backgroundColor: '#ffffff' 
    },
    suggestionsHeader: { 
        display: 'flex', 
        alignItems: 'center', 
        gap: '6px', 
        marginBottom: '8px' 
    },
    suggestionsTitle: { 
        fontSize: '11px', 
        fontWeight: '700', 
        color: '#94a3b8', 
        textTransform: 'uppercase', 
        letterSpacing: '0.5px' 
    },
    suggestionsGrid: { 
        display: 'flex', 
        gap: '8px', 
        overflowX: 'auto',
        paddingBottom: '4px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
    },
    suggestionBtn: { 
        padding: '8px 14px', 
        backgroundColor: '#f8fafc', 
        border: '1px solid #e2e8f0', 
        borderRadius: '20px', 
        fontSize: '12px', 
        fontWeight: '500',
        cursor: 'pointer', 
        whiteSpace: 'nowrap', 
        color: '#475569',
        fontFamily: 'inherit'
    },
    chatInput: { 
        padding: '14px 16px', 
        borderTop: '1px solid #f1f5f9', 
        display: 'flex', 
        gap: '8px', 
        alignItems: 'center',
        backgroundColor: '#ffffff' 
    },
    input: { 
        flex: 1, 
        padding: '10px 16px', 
        border: '1px solid #e2e8f0', 
        borderRadius: '20px', 
        outline: 'none', 
        fontSize: '14px', 
        backgroundColor: '#f8fafc',
        color: '#1e293b',
        transition: 'all 0.2s',
        fontFamily: 'inherit'
    },
    sendBtn: { 
        width: '38px', 
        height: '38px', 
        borderRadius: '50%', 
        backgroundColor: '#8B0000', 
        border: 'none', 
        cursor: 'pointer', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center'
    }
};

export default ChatBot;