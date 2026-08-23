import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import {
    Plus,
    History,
    Activity,
    LogOut,
    User,
    LayoutGrid,
    Target,
    Calculator,
    Dna,
    Settings,
    MoreHorizontal,
    X,
    Sparkles
} from 'lucide-react'
import { Tooltip } from './Tooltip'
import { ToastProvider } from './ui/ToastProvider'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

interface LayoutProps {
    isGuest: boolean;
    setIsGuest: (val: boolean) => void;
}

export const Layout = ({ setIsGuest }: LayoutProps) => {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const activeView = location.pathname.slice(1) || 'dashboard'

    const { user: authUser, signOut } = useAuth()
    const { profile, updateProfile } = useProfile()

    const userSex = profile?.sex || 'male'
    const userName = profile?.name || authUser?.email?.split('@')[0] || 'Atleta'

    const handleLogOut = async () => {
        await signOut()
        setIsGuest(false)
        setMobileMenuOpen(false)
        navigate('/')
    }

    const navigationItems = [
        { path: 'dashboard', icon: LayoutGrid, label: t('common.menu.dashboard'), tooltip: t('common.tooltips.dashboard') },
        { path: 'new-entry', icon: Plus, label: t('common.menu.new_entry'), tooltip: t('common.tooltips.new_entry') },
        { path: 'history', icon: History, label: t('common.menu.history'), tooltip: t('common.tooltips.history') },
        { path: 'analysis', icon: Activity, label: t('common.menu.analysis'), tooltip: t('common.tooltips.analysis') },
        { path: 'potential', icon: Dna, label: t('common.menu.genetics'), tooltip: t('common.tooltips.genetics') },
        { path: 'calculator', icon: Calculator, label: t('common.menu.metabolism'), tooltip: t('common.tooltips.metabolism') },
        { path: 'goals', icon: Target, label: t('common.menu.goals'), tooltip: t('common.tooltips.goals') },
        { path: 'settings', icon: Settings, label: t('common.menu.settings'), tooltip: t('common.tooltips.settings') },
    ]

    const isSecondaryViewActive = ['history', 'calculator', 'goals', 'settings'].includes(activeView);

    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        document.body.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        const contentEl = document.querySelector('.content');
        if (contentEl) {
            contentEl.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
        }
    }, [location.pathname]);

    const handleNavigateMobile = (path: string) => {
        setMobileMenuOpen(false)
        navigate(path)
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    }

    return (
        <ToastProvider>
            <div className="app-container">
                {/* Mobile Top Header */}
                <header className="mobile-header glass">
                    <div className="logo-mobile" onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
                        <Activity color="var(--primary-color)" size={24} />
                        <span className="logo-text">HYPERTROPHY</span>
                    </div>

                    <div className="mobile-header-actions">
                        <div className="gender-toggle-mobile">
                            <button
                                className={userSex === 'male' ? 'active' : ''}
                                onClick={() => updateProfile({ sex: 'male' })}
                            >M</button>
                            <button
                                className={userSex === 'female' ? 'active' : ''}
                                onClick={() => updateProfile({ sex: 'female' })}
                            >F</button>
                        </div>
                        <div
                            className={`user-avatar-mobile ${userSex}`}
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            style={{ cursor: 'pointer' }}
                        >
                            <User size={18} />
                        </div>
                    </div>
                </header>

                {/* Desktop Sidebar */}
                <nav className="sidebar glass">
                    <div className="logo">
                        <Activity color="var(--primary-color)" size={32} />
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '0.9', marginLeft: '6px' }}>
                            <span style={{ fontSize: '0.75rem', letterSpacing: '0.05em', opacity: 0.9 }}>HYPERTROPHY</span>
                            <span style={{ fontSize: '1rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>TRACKER</span>
                        </div>
                    </div>

                    <div className="nav-items">
                        {navigationItems.map(item => (
                            <Tooltip key={item.path} content={item.tooltip} position="right">
                                <button
                                    className={activeView === item.path ? 'active' : ''}
                                    onClick={() => navigate(item.path)}
                                >
                                    <item.icon size={20} /> {item.label}
                                </button>
                            </Tooltip>
                        ))}
                    </div>

                    <div className="nav-footer">
                        <div className="user-profile">
                            <div className={`user-avatar ${userSex}`}>
                                <User size={20} />
                            </div>
                            <div className="user-info">
                                <span className="name">{userName}</span>
                                <span className="status">{authUser ? 'Online' : 'Invitado'}</span>
                            </div>
                        </div>
                        <div className="gender-toggle">
                            <button
                                className={userSex === 'male' ? 'active' : ''}
                                onClick={() => updateProfile({ sex: 'male' })}
                            >M</button>
                            <button
                                className={userSex === 'female' ? 'active' : ''}
                                onClick={() => updateProfile({ sex: 'female' })}
                            >F</button>
                        </div>
                        <button className="btn-logout" onClick={handleLogOut}>
                            <LogOut size={20} /> {t('common.logout')}
                        </button>
                    </div>
                </nav>

                {/* Content Area */}
                <main className="content">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Mobile Bottom Navigation (Segmented 5-Key Bar) */}
                <nav className="mobile-nav glass">
                    <button
                        className={activeView === 'dashboard' ? 'active' : ''}
                        onClick={() => handleNavigateMobile('dashboard')}
                    >
                        <LayoutGrid size={20} />
                        <span>Inicio</span>
                    </button>

                    <button
                        className={activeView === 'analysis' ? 'active' : ''}
                        onClick={() => handleNavigateMobile('analysis')}
                    >
                        <Activity size={20} />
                        <span>Análisis</span>
                    </button>

                    {/* Central Highlighted Button */}
                    <button
                        className={`mobile-center-btn ${activeView === 'new-entry' ? 'active' : ''}`}
                        onClick={() => handleNavigateMobile('new-entry')}
                    >
                        <div className="center-btn-bubble">
                            <Plus size={22} />
                        </div>
                        <span>Medir</span>
                    </button>

                    <button
                        className={activeView === 'potential' ? 'active' : ''}
                        onClick={() => handleNavigateMobile('potential')}
                    >
                        <Dna size={20} />
                        <span>Genética</span>
                    </button>

                    <button
                        className={mobileMenuOpen || isSecondaryViewActive ? 'active' : ''}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <MoreHorizontal size={20} />
                        <span>Más</span>
                    </button>
                </nav>

                {/* Mobile "More" Drawer Modal */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setMobileMenuOpen(false)}
                                className="mobile-drawer-backdrop"
                            />

                            {/* Drawer Card */}
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className="mobile-drawer-sheet glass"
                            >
                                <div className="drawer-header">
                                    <div className="drawer-user-info">
                                        <div className={`user-avatar ${userSex}`}>
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <div className="drawer-user-name">{userName}</div>
                                            <div className="drawer-user-status">
                                                <Sparkles size={12} className="inline mr-1 text-amber-400" />
                                                {authUser ? 'Sincronizado' : 'Modo Local (Invitado)'}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="drawer-close-btn"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="drawer-menu-grid">
                                    <button
                                        className={`drawer-menu-item ${activeView === 'history' ? 'active' : ''}`}
                                        onClick={() => handleNavigateMobile('history')}
                                    >
                                        <History size={20} className="text-amber-400" />
                                        <span>{t('common.menu.history')}</span>
                                    </button>

                                    <button
                                        className={`drawer-menu-item ${activeView === 'calculator' ? 'active' : ''}`}
                                        onClick={() => handleNavigateMobile('calculator')}
                                    >
                                        <Calculator size={20} className="text-amber-400" />
                                        <span>{t('common.menu.metabolism')}</span>
                                    </button>

                                    <button
                                        className={`drawer-menu-item ${activeView === 'goals' ? 'active' : ''}`}
                                        onClick={() => handleNavigateMobile('goals')}
                                    >
                                        <Target size={20} className="text-amber-400" />
                                        <span>{t('common.menu.goals')}</span>
                                    </button>

                                    <button
                                        className={`drawer-menu-item ${activeView === 'settings' ? 'active' : ''}`}
                                        onClick={() => handleNavigateMobile('settings')}
                                    >
                                        <Settings size={20} className="text-amber-400" />
                                        <span>{t('common.menu.settings')}</span>
                                    </button>
                                </div>

                                <div className="drawer-footer">
                                    <button className="drawer-logout-btn" onClick={handleLogOut}>
                                        <LogOut size={18} />
                                        <span>{t('common.logout')}</span>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                .app-container {
                    display: flex;
                    min-height: 100vh;
                }

                .mobile-header {
                    display: none;
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 60px;
                    z-index: 100;
                    padding: 0 1.25rem;
                    justify-content: space-between;
                    align-items: center;
                    border-bottom: 1px solid var(--border-color);
                    background: rgba(8, 9, 13, 0.85);
                    backdrop-filter: blur(16px);
                }

                .logo-mobile {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .logo-text {
                    font-size: 0.85rem;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    color: #ffffff;
                }

                .mobile-header-actions {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .gender-toggle-mobile {
                    display: flex;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 2px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.08);
                }

                .gender-toggle-mobile button {
                    width: 28px;
                    height: 24px;
                    font-size: 0.7rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    border-radius: 6px;
                }

                .gender-toggle-mobile button.active {
                    background: var(--primary-gradient);
                    color: #08090d;
                }

                .user-avatar-mobile {
                    width: 34px;
                    height: 34px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 1px solid var(--border-color);
                    color: var(--primary-color);
                }

                .user-avatar-mobile.female {
                    color: #ec4899;
                    border-color: rgba(236, 72, 153, 0.4);
                }

                /* Mobile Bottom Nav (Clean 5-Item Segmented Bar) */
                .mobile-nav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    padding: 0.4rem 0.75rem calc(0.4rem + env(safe-area-inset-bottom, 0px));
                    z-index: 100;
                    border-top: 1px solid var(--border-color);
                    background: rgba(8, 9, 13, 0.92);
                    backdrop-filter: blur(20px);
                    -webkit-backdrop-filter: blur(20px);
                    justify-content: space-around;
                    align-items: center;
                    touch-action: manipulation;
                }

                .mobile-nav button {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 3px;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 0.65rem;
                    font-weight: 600;
                    font-family: var(--font-mono);
                    padding: 0.4rem 0.2rem;
                    border-radius: 10px;
                    transition: var(--transition-smooth);
                    user-select: none;
                }

                .mobile-nav button.active {
                    color: #fbbf24;
                }

                .mobile-center-btn {
                    position: relative;
                    margin-top: -16px;
                }

                .center-btn-bubble {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: var(--primary-gradient);
                    color: #08090d;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px var(--primary-glow);
                    transition: transform 0.2s ease;
                }

                .mobile-center-btn:active .center-btn-bubble {
                    transform: scale(0.92);
                }

                /* Mobile Drawer Sheet */
                .mobile-drawer-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    z-index: 150;
                }

                .mobile-drawer-sheet {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    padding: 1.5rem 1.25rem calc(2rem + env(safe-area-inset-bottom, 0px));
                    z-index: 160;
                    border-top: 1px solid rgba(245, 158, 11, 0.3);
                    border-radius: 24px 24px 0 0;
                    background: rgba(13, 16, 25, 0.98);
                    box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.8);
                }

                .drawer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.25rem;
                    padding-bottom: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .drawer-user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .drawer-user-name {
                    font-weight: 700;
                    font-size: 1rem;
                    color: #ffffff;
                }

                .drawer-user-status {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    font-family: var(--font-mono);
                }

                .drawer-close-btn {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-secondary);
                    padding: 6px;
                    border-radius: 50%;
                }

                .drawer-menu-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                    margin-bottom: 1.25rem;
                }

                .drawer-menu-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.9rem 1rem;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    border-radius: 14px;
                    color: #ffffff;
                    font-size: 0.85rem;
                    font-weight: 600;
                    text-align: left;
                    transition: var(--transition-smooth);
                }

                .drawer-menu-item:active, .drawer-menu-item.active {
                    background: rgba(245, 158, 11, 0.15);
                    border-color: #f59e0b;
                    color: #fbbf24;
                }

                .drawer-footer {
                    padding-top: 0.75rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.06);
                }

                .drawer-logout-btn {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.8rem;
                    background: rgba(239, 68, 68, 0.1);
                    border: 1px solid rgba(239, 68, 68, 0.25);
                    border-radius: 12px;
                    color: #fb7185;
                    font-weight: 700;
                    font-size: 0.85rem;
                }

                .sidebar {
                    width: 280px;
                    height: 100vh;
                    position: sticky;
                    top: 0;
                    display: flex;
                    flex-direction: column;
                    padding: 2.5rem 1.8rem;
                    border-right: 1px solid var(--border-color);
                    z-index: 100;
                }

                .logo {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    font-size: 1.4rem;
                    font-weight: 700;
                    margin-bottom: 3.5rem;
                    padding-left: 0.5rem;
                    letter-spacing: -0.01em;
                }

                .nav-items {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    flex: 1;
                }

                .nav-items button {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 0.9rem 1.2rem;
                    border: 1px solid transparent;
                    background: transparent;
                    color: var(--text-secondary);
                    border-radius: 14px;
                    transition: var(--transition-smooth);
                    font-size: 0.95rem;
                    text-align: left;
                }

                .nav-items button:hover {
                    background: var(--surface-hover);
                    color: white;
                }

                .nav-items button.active {
                    background: rgba(245, 158, 11, 0.12);
                    color: #fbbf24;
                    font-weight: 700;
                    border: 1px solid rgba(245, 158, 11, 0.4);
                    box-shadow: 0 4px 20px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                }

                .nav-footer {
                    border-top: 1px solid var(--border-color);
                    padding-top: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .user-profile {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.5rem 1rem;
                }

                .user-avatar {
                    width: 40px;
                    height: 40px;
                    background: var(--surface-hover);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--primary-color);
                    border: 1px solid var(--border-color);
                    transition: var(--transition-smooth);
                }

                .user-avatar.female {
                    color: #ec4899;
                    border-color: rgba(236, 72, 153, 0.4);
                }

                .gender-toggle {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;
                    padding: 0 0.5rem;
                }

                .gender-toggle button {
                    flex: 1;
                    padding: 0.4rem;
                    font-size: 0.75rem;
                    font-weight: bold;
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--text-secondary);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                }

                .gender-toggle button.active {
                    background: var(--primary-color);
                    color: #1a1a1d;
                    border-color: var(--primary-color);
                }

                .user-info {
                    display: flex;
                    flex-direction: column;
                }

                .user-info .name {
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .user-info .status {
                    font-size: 0.7rem;
                    color: var(--success-color);
                }

                .btn-logout {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    border-radius: 12px;
                }

                .btn-logout:hover {
                    background: rgba(239, 68, 68, 0.1);
                    color: var(--danger-color);
                }

                .content {
                    flex: 1;
                    padding: 2rem 3rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                }

                @media (max-width: 768px) {
                    .app-container {
                        flex-direction: column;
                    }
                    .sidebar {
                        display: none;
                    }
                    .mobile-header {
                        display: flex;
                    }
                    .mobile-nav {
                        display: flex;
                    }
                    .content {
                        padding: 1rem 0.85rem;
                        padding-top: 75px;
                        padding-bottom: calc(85px + env(safe-area-inset-bottom, 0px));
                    }
                }
            `}</style>
        </ToastProvider >
    )
}
