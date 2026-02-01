import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Plus, History, Activity, LogOut, User, LayoutGrid, Target, Camera, Calculator, Dna, Settings } from 'lucide-react'
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
    const activeView = location.pathname.slice(1) || 'dashboard'

    const { user: authUser, signOut } = useAuth()
    const { profile, updateProfile } = useProfile()

    const userSex = profile?.sex || 'male'
    const userName = profile?.name || authUser?.email?.split('@')[0] || 'Atleta'

    const handleLogOut = async () => {
        await signOut()
        setIsGuest(false)
        navigate('/')
    }

    const navigationItems = [
        { path: 'dashboard', icon: LayoutGrid, label: t('common.dashboard'), tooltip: t('common.tooltips.dashboard') },
        { path: 'new-entry', icon: Plus, label: t('common.new_entry'), tooltip: t('common.tooltips.new_entry') },
        { path: 'history', icon: History, label: t('common.history'), tooltip: t('common.tooltips.history') },
        { path: 'analysis', icon: Activity, label: t('common.analysis'), tooltip: t('common.tooltips.analysis') },
        { path: 'potential', icon: Dna, label: t('common.genetics'), tooltip: t('common.tooltips.genetics') },
        { path: 'comparison', icon: Camera, label: t('common.compare'), tooltip: t('common.tooltips.compare') },
        { path: 'calculator', icon: Calculator, label: t('common.metabolism'), tooltip: t('common.tooltips.metabolism') },
        { path: 'goals', icon: Target, label: t('common.goals'), tooltip: t('common.tooltips.goals') },
        { path: 'settings', icon: Settings, label: t('common.settings'), tooltip: t('common.tooltips.settings') },
    ]

    return (
        <ToastProvider>
            <div className="app-container">
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

                <main className="content">
                    <Outlet />
                </main>

                <nav className="mobile-nav glass">
                    {navigationItems.map(item => (
                        <button
                            key={item.path}
                            className={activeView === item.path ? 'active' : ''}
                            onClick={() => navigate(item.path)}
                        >
                            <item.icon size={22} />
                            <span>{item.label === 'Nueva Medida' ? 'Nuevo' : item.label}</span>
                        </button>
                    ))}
                    <button className="btn-logout-mobile" onClick={handleLogOut}>
                        <LogOut size={22} />
                        <span>{t('common.logout')}</span>
                    </button>
                </nav>
            </div>
            <style>{`
                .app-container {
                    display: flex;
                    min-height: 100vh;
                    background-color: var(--bg-color);
                }

                .mobile-nav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    padding: 0.8rem;
                    z-index: 100;
                    border-top: 1px solid var(--border-color);
                    background: rgba(3, 3, 5, 0.95);
                    backdrop-filter: blur(20px);
                    
                    /* Scrolling for many items */
                    overflow-x: auto;
                    white-space: nowrap;
                    justify-content: flex-start;
                    gap: 1.2rem;
                    
                    /* Hide scrollbar structure */
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                
                .mobile-nav::-webkit-scrollbar {
                    display: none;
                }

                .mobile-nav button {
                    flex: 0 0 auto; /* Don't shrink */
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    background: none;
                    border: none;
                    color: var(--text-secondary);
                    font-size: 0.65rem;
                    padding: 0.5rem;
                    border-radius: 8px;
                    min-width: 60px;
                }

                .mobile-nav button.active {
                    color: var(--primary-color);
                    background: rgba(245, 158, 11, 0.1);
                }
                
                .btn-logout-mobile {
                    color: var(--danger-color) !important;
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
                    background: linear-gradient(90deg, rgba(245, 158, 11, 0.15) 0%, transparent 100%);
                    color: var(--primary-color);
                    font-weight: 700;
                    border-left: 3px solid var(--primary-color);
                    box-shadow: 0 0 20px rgba(245, 158, 11, 0.1);
                    border-radius: 4px 14px 14px 4px;
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
                    .mobile-nav {
                        display: flex;
                    }
                    .content {
                        padding: 1.5rem;
                        padding-bottom: 7rem;
                    }
                }
            `}</style>
        </ToastProvider >
    )
}
