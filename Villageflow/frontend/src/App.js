import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

// ✅ System Config Service එක import කරන්න
import { loadPublicConfig, validateToken, getPublicConfig } from './services/configService';

import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import Member2Certificates from './components/Member2Certificates';
import GramaNiladhariDashboard from './components/GramaNiladhariDashboard';
import VerifyCertificate from './components/VerifyCertificate';
import VerifyProfile from './pages/VerifyProfile'; 
import WelfarePage from './components/WelfarePage'; 
import ApplyWelfare from './components/ApplyWelfare'; 
import NoticePage from './components/NoticePage'; 
import AppointmentPage from './components/AppointmentPage'; 
import SystemConfig from './components/SystemConfig';
import ChatBot from './components/ChatBot';

// Icons for mobile top navigation
import { 
    FileText, Calendar, User, Heart, 
    LayoutDashboard, Settings, LogOut, Bell, ShieldCheck 
} from 'lucide-react';

function AppContent() {
    const [page, setPage] = useState('login');
    const [user, setUser] = useState(null);
    const [configLoaded, setConfigLoaded] = useState(false);
    const [lang, setLang] = useState('si');
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Check screen size for mobile view
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile menu when navigating
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    // ✅ App start වෙද්දී public config එක load කරන්න
    useEffect(() => {
        let isMounted = true;
        
        const initializeApp = async () => {
            try {
                const existingConfig = getPublicConfig();
                
                if (existingConfig) {
                    console.log('✅ Using existing config from localStorage');
                    if (isMounted) setConfigLoaded(true);
                } else {
                    await loadPublicConfig();
                    if (isMounted) setConfigLoaded(true);
                }
                
                const token = localStorage.getItem('token');
                if (token) {
                    const isValid = await validateToken();
                    if (isValid && isMounted) {
                        const userData = localStorage.getItem('user');
                        if (userData) {
                            setUser(JSON.parse(userData));
                        }
                    }
                }
                
                console.log('✅ App initialized successfully');
            } catch (err) {
                console.error('❌ Error initializing app:', err);
                if (isMounted) setConfigLoaded(true);
            }
        };
        
        const timeoutId = setTimeout(() => {
            if (isMounted && !configLoaded) {
                console.log('⚠️ Config loading timeout - forcing load');
                setConfigLoaded(true);
            }
        }, 3000);
        
        initializeApp();
        
        return () => {
            isMounted = false;
            clearTimeout(timeoutId);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const loggedInUser = localStorage.getItem('user');
        if (loggedInUser && loggedInUser !== "undefined") {
            const parsedUser = JSON.parse(loggedInUser);
            setUser(parsedUser);
            
            const savedLang = localStorage.getItem('appLanguage');
            if (savedLang && (savedLang === 'en' || savedLang === 'si' || savedLang === 'ta')) {
                setLang(savedLang);
            }
            
            const isVerificationPage = location.pathname.startsWith('/verify/') || location.pathname.startsWith('/verify-cert/');
            
            if (!isVerificationPage) {
                const currentPath = location.pathname.substring(1);
                if (currentPath) setPage(currentPath);
            }
        }
    }, [location.pathname]); 

    const handleLoginSuccess = () => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        setUser(loggedInUser);
        const targetPage = loggedInUser.role === 'officer' ? 'gn-dashboard' : 'profile';
        setPage(targetPage);
        navigate(`/${targetPage}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setPage('login');
        navigate('/');
    };

    // Verification පේජ් වලදී Navbar එක පෙන්වන්නේ නැත
    const isVerificationPage = location.pathname.startsWith('/verify/') || location.pathname.startsWith('/verify-cert/');
    const showDesktopNavBar = user && !isVerificationPage && !isMobile;
    const showMobileTopNav = user && !isVerificationPage && isMobile;
    
    // ✅ ChatBot එක - Login, Register සහ Citizen පිටු වල පෙන්වන්න
    const showChatBot = (user && user.role === 'citizen') || 
                        (!user && (location.pathname === '/' || 
                                   location.pathname === '/login' || 
                                   location.pathname === '/register'));

    const finalShowChatBot = showChatBot && !isVerificationPage;

    if (!configLoaded) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p>Loading VillageFlow...</p>
            </div>
        );
    }

    // Helper function to check if a path is active
    const isActive = (path) => location.pathname === path;

    // Mobile menu toggle button
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh', position: 'relative' }}>
            {/* Desktop Navbar */}
            {showDesktopNavBar && (
                <nav className="desktop-navbar" style={styles.navBar}>
                    <div style={styles.logo}>VillageFlow</div>
                    <div className="desktop-nav-links" style={styles.navLinks}>
                        <button 
                            onClick={() => { setPage('notices'); navigate('/notices'); }} 
                            style={isActive('/notices') ? styles.activeLink : styles.link}
                        >
                            Noticeboard
                        </button>
                        <button 
                            onClick={() => { setPage('appointments'); navigate('/appointments'); }} 
                            style={isActive('/appointments') ? styles.activeLink : styles.link}
                        >
                            Appointments
                        </button>

                        {user && user.role !== 'officer' && (
                            <>
                                <button 
                                    onClick={() => { setPage('profile'); navigate('/profile'); }} 
                                    style={isActive('/profile') ? styles.activeLink : styles.link}
                                >
                                    Profile
                                </button>
                                <button 
                                    onClick={() => { setPage('certificates'); navigate('/certificates'); }} 
                                    style={isActive('/certificates') ? styles.activeLink : styles.link}
                                >
                                    Certificates
                                </button>
                                <button 
                                    onClick={() => { setPage('apply-welfare'); navigate('/apply-welfare'); }} 
                                    style={isActive('/apply-welfare') ? styles.activeLink : styles.link}
                                >
                                    Welfare Apply
                                </button>
                            </>
                        )}
                        
                        {user && user.role === 'officer' && (
                            <>
                                <button 
                                    onClick={() => { setPage('gn-dashboard'); navigate('/gn-dashboard'); }} 
                                    style={isActive('/gn-dashboard') ? styles.activeLink : styles.link}
                                >
                                    GN Dashboard
                                </button>
                                <button 
                                    onClick={() => { setPage('welfare-manage'); navigate('/welfare-manage'); }} 
                                    style={isActive('/welfare-manage') ? styles.activeLink : styles.link}
                                >
                                    Welfare Manage
                                </button>
                                <button 
                                    onClick={() => { setPage('system-config'); navigate('/system-config'); }} 
                                    style={isActive('/system-config') ? styles.activeLink : styles.link}
                                >
                                    System Settings
                                </button>
                            </>
                        )}
                        
                        {user && (
                            <button onClick={handleLogout} style={styles.logoutBtn}>
                                <LogOut size={16} /> Logout
                            </button>
                        )}
                    </div>
                </nav>
            )}

            {/* Mobile Top Navigation Bar */}
            {showMobileTopNav && (
                <>
                    <div className="mobile-top-nav" style={styles.mobileTopNav}>
                        <div style={styles.mobileLogo}>VillageFlow</div>
                        <button onClick={toggleMobileMenu} style={styles.menuButton}>
                            <div style={styles.hamburgerIcon}>
                                <span style={{...styles.hamburgerLine, transform: mobileMenuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none'}}></span>
                                <span style={{...styles.hamburgerLine, opacity: mobileMenuOpen ? 0 : 1}}></span>
                                <span style={{...styles.hamburgerLine, transform: mobileMenuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none'}}></span>
                            </div>
                        </button>
                    </div>
                    
                    {/* Mobile Menu Dropdown */}
                    <div className="mobile-menu-dropdown" style={{...styles.mobileMenuDropdown, maxHeight: mobileMenuOpen ? '500px' : '0', padding: mobileMenuOpen ? '15px 0' : '0'}}>
                        {user && user.role !== 'officer' ? (
                            // Citizen Mobile Menu
                            <div style={styles.mobileMenuItems}>
                                <button 
                                    onClick={() => { navigate('/profile'); }} 
                                    className={isActive('/profile') ? 'active-mobile' : ''}
                                    style={isActive('/profile') ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                                >
                                    <User size={20} />
                                    <span>Profile</span>
                                </button>
                                <button 
                                    onClick={() => { navigate('/certificates'); }} 
                                    className={isActive('/certificates') ? 'active-mobile' : ''}
                                    style={isActive('/certificates') ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                                >
                                    <FileText size={20} />
                                    <span>Certificates</span>
                                </button>
                                <button 
                                    onClick={() => { navigate('/apply-welfare'); }} 
                                    className={isActive('/apply-welfare') ? 'active-mobile' : ''}
                                    style={isActive('/apply-welfare') ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                                >
                                    <Heart size={20} />
                                    <span>Welfare Apply</span>
                                </button>
                                <button 
                                    onClick={() => { navigate('/notices'); }} 
                                    className={isActive('/notices') ? 'active-mobile' : ''}
                                    style={isActive('/notices') ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                                >
                                    <Bell size={20} />
                                    <span>Notices</span>
                                </button>
                                <button 
                                    onClick={() => { navigate('/appointments'); }} 
                                    className={isActive('/appointments') ? 'active-mobile' : ''}
                                    style={isActive('/appointments') ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                                >
                                    <Calendar size={20} />
                                    <span>Appointments</span>
                                </button>
                                <hr style={styles.mobileDivider} />
                                <button onClick={handleLogout} style={styles.mobileMenuItem}>
                                    <LogOut size={20} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        ) : user && user.role === 'officer' ? (
                            // Officer Mobile Menu
                            <div style={styles.mobileMenuItems}>
                                <button 
                                    onClick={() => { navigate('/gn-dashboard'); }} 
                                    className={isActive('/gn-dashboard') ? 'active-mobile' : ''}
                                    style={isActive('/gn-dashboard') ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                                >
                                    <LayoutDashboard size={20} />
                                    <span>Dashboard</span>
                                </button>
                                <button 
                                    onClick={() => { navigate('/welfare-manage'); }} 
                                    className={isActive('/welfare-manage') ? 'active-mobile' : ''}
                                    style={isActive('/welfare-manage') ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                                >
                                    <ShieldCheck size={20} />
                                    <span>Welfare Manage</span>
                                </button>
                                <button 
                                    onClick={() => { navigate('/notices'); }} 
                                    className={isActive('/notices') ? 'active-mobile' : ''}
                                    style={isActive('/notices') ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                                >
                                    <Bell size={20} />
                                    <span>Notices</span>
                                </button>
                                <button 
                                    onClick={() => { navigate('/appointments'); }} 
                                    className={isActive('/appointments') ? 'active-mobile' : ''}
                                    style={isActive('/appointments') ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                                >
                                    <Calendar size={20} />
                                    <span>Appointments</span>
                                </button>
                                <button 
                                    onClick={() => { navigate('/system-config'); }} 
                                    className={isActive('/system-config') ? 'active-mobile' : ''}
                                    style={isActive('/system-config') ? styles.mobileMenuItemActive : styles.mobileMenuItem}
                                >
                                    <Settings size={20} />
                                    <span>System Settings</span>
                                </button>
                                <hr style={styles.mobileDivider} />
                                <button onClick={handleLogout} style={styles.mobileMenuItem}>
                                    <LogOut size={20} />
                                    <span>Logout</span>
                                </button>
                            </div>
                        ) : null}
                    </div>
                </>
            )}

            <div className={showMobileTopNav ? "app-route-content with-mobile-nav" : "app-route-content"}>
            <Routes>
                <Route path="/verify/:id" element={<VerifyProfile />} />
                <Route path="/verify-cert/:id" element={<VerifyCertificate />} />

                <Route path="/" element={
                    !user ? (
                        <div style={{ textAlign: 'center', backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
                            {page === 'login' ? 
                                <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setPage('register')} /> : 
                                <Register onSwitchToLogin={() => setPage('login')} />
                            }
                        </div>
                    ) : (
                        <Navigate to={user.role === 'officer' ? "/gn-dashboard" : "/profile"} />
                    )
                } />
                
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
                <Route path="/certificates" element={user ? <Member2Certificates /> : <Navigate to="/" />} />
                <Route path="/gn-dashboard" element={user?.role === 'officer' ? <GramaNiladhariDashboard /> : <Navigate to="/" />} />
                <Route path="/welfare-manage" element={user?.role === 'officer' ? <WelfarePage /> : <Navigate to="/" />} />
                <Route path="/apply-welfare" element={user ? <ApplyWelfare /> : <Navigate to="/" />} />
                <Route path="/notices" element={user ? <NoticePage /> : <Navigate to="/" />} />
                <Route path="/appointments" element={user ? <AppointmentPage /> : <Navigate to="/" />} />
                <Route path="/system-config" element={user?.role === 'officer' ? <SystemConfig /> : <Navigate to="/" />} />

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            </div>
            
            {/* ✅ ChatBot - Login, Register, Citizen pages වල පෙන්වයි */}
            {finalShowChatBot && (
                <ChatBot 
                    userRole={user?.role || 'citizen'} 
                    currentLang={lang}
                />
            )}
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

const styles = {
    // Desktop Navbar Styles
    navBar: { 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '15px 50px', 
        background: '#800000', 
        color: 'white', 
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
        gap: '15px'
    },
    navLinks: { 
        display: 'flex', 
        gap: '15px', 
        alignItems: 'center', 
        flexWrap: 'wrap' 
    },
    logo: { 
        fontSize: '22px', 
        fontWeight: '900', 
        letterSpacing: '1px' 
    },
    navBtn: { 
        padding: '10px 25px', 
        borderRadius: '8px', 
        border: 'none', 
        cursor: 'pointer', 
        background: '#e0e0e0', 
        fontWeight: 'bold' 
    },
    activeNav: { 
        padding: '10px 25px', 
        borderRadius: '8px', 
        border: 'none', 
        cursor: 'pointer', 
        background: '#800000', 
        color: 'white', 
        fontWeight: 'bold' 
    },
    link: { 
        background: 'transparent', 
        borderBottom: '2px solid transparent',
        color: 'rgba(255,255,255,0.7)', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        fontSize: '15px', 
        padding: '5px 10px',
        transition: 'color 0.3s ease',
    },
    activeLink: { 
        background: 'transparent', 
        color: '#fbc531', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        fontSize: '15px', 
        borderBottom: '2px solid #fbc531', 
        padding: '5px 10px' 
    },
    logoutBtn: { 
        padding: '8px 15px', 
        borderRadius: '5px', 
        border: '1px solid white', 
        background: 'transparent', 
        color: 'white', 
        cursor: 'pointer', 
        fontWeight: 'bold', 
        marginLeft: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'background 0.3s ease, color 0.3s ease',
    },
    
    // Mobile Top Navigation Styles
    mobileTopNav: {
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        background: '#800000',
        padding: '12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1001,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    },
    mobileLogo: {
        fontSize: '20px',
        fontWeight: 'bold',
        color: 'white',
        letterSpacing: '1px'
    },
    menuButton: {
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        padding: '8px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    hamburgerIcon: {
        width: '24px',
        height: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    hamburgerLine: {
        width: '24px',
        height: '3px',
        background: 'white',
        borderRadius: '3px',
        transition: 'all 0.3s ease'
    },
    mobileMenuDropdown: {
        position: 'sticky',
        top: '60px',
        left: 0,
        right: 0,
        background: 'white',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease, padding 0.3s ease',
        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        zIndex: 1000
    },
    mobileMenuItems: {
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    },
    mobileMenuItem: {
        background: 'transparent',
        border: 'none',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        fontSize: '15px',
        color: '#333',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        transition: 'background 0.2s ease'
    },
    mobileMenuItemActive: {
        background: 'rgba(128, 0, 0, 0.1)',
        border: 'none',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px',
        fontSize: '15px',
        color: '#800000',
        cursor: 'pointer',
        width: '100%',
        textAlign: 'left',
        fontWeight: 'bold'
    },
    mobileDivider: {
        margin: '8px 20px',
        border: 'none',
        height: '1px',
        background: '#eee'
    },
    
    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f4f7f6'
    },
    spinner: {
        width: '50px',
        height: '50px',
        border: '5px solid #f3f3f3',
        borderTop: '5px solid #800000',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
    }
};

export default App;