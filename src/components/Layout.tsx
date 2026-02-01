import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Plus, History, Activity, LogOut, User, LayoutGrid, Target, Camera, Calculator, Dna } from 'lucide-react'
import { Tooltip } from './Tooltip'
import { ToastProvider } from './ui/ToastProvider'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'

interface LayoutProps {
    isGuest: boolean;
    setIsGuest: (val: boolean) => void;
}

export const Layout = ({ setIsGuest }: LayoutProps) => {
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
        { path: 'dashboard', icon: LayoutGrid, label: 'Dashboard', tooltip: 'Vista general y resumen' },
        { path: 'new-entry', icon: Plus, label: 'Nueva Medida', tooltip: 'Registrar nuevas medidas corporales' },
        { path: 'history', icon: History, label: 'Historial', tooltip: 'Ver historial de registros' },
        { path: 'analysis', icon: Activity, label: 'Análisis', tooltip: 'Análisis gráfico de tu progreso' },
        { path: 'potential', icon: Dna, label: 'Genética', tooltip: 'Análisis de estructura ósea (Casey Butt)' },
        { path: 'comparison', icon: Camera, label: 'Comparativa', tooltip: 'Comparativa visual de fotos' },
        { path: 'calculator', icon: Calculator, label: 'Metabolismo', tooltip: 'Calculadora de BMR y TDEE' },
        { path: 'goals', icon: Target, label: 'Objetivos', tooltip: 'Definir metas de medidas' },
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
                            <LogOut size={20} /> Salir
                        </button>
                    </div>
                </nav>

                <main className="content">
                    <Outlet />
                </main>

                <nav className="mobile-nav glass">
                    <button className={activeView === 'dashboard' ? 'active' : ''} onClick={() => navigate('dashboard')}>
                        <LayoutGrid size={24} />
                        <span>Inicio</span>
                    </button>
                    <button className={activeView === 'new-entry' ? 'active' : ''} onClick={() => navigate('new-entry')}>
                        <Plus size={24} />
                        <span>Nuevo</span>
                    </button>
                    <button className={activeView === 'history' ? 'active' : ''} onClick={() => navigate('history')}>
                        <History size={24} />
                        <span>Diario</span>
                    </button>
                    <button className={activeView === 'analysis' ? 'active' : ''} onClick={() => navigate('analysis')}>
                        <Activity size={24} />
                        <span>Análisis</span>
                    </button>
                    <button className={activeView === 'potential' ? 'active' : ''} onClick={() => navigate('potential')}>
                        <Dna size={24} />
                        <span>Genética</span>
                    </button>
                    <button className={activeView === 'comparison' ? 'active' : ''} onClick={() => navigate('comparison')}>
                        <Camera size={24} />
                        <span>Comparar</span>
                    </button>
                    <button className={activeView === 'calculator' ? 'active' : ''} onClick={() => navigate('calculator')}>
                        <Calculator size={24} />
                        <span>Metab.</span>
                    </button>
                    <button className={activeView === 'goals' ? 'active' : ''} onClick={() => navigate('goals')}>
                        <Target size={24} />
                        <span>Objetivos</span>
                    </button>
                    <button className="btn-logout-mobile" onClick={handleLogOut}>
                        <LogOut size={24} />
                        <span>Salir</span>
                    </button>
                </nav>
            </div>
        </ToastProvider>
    )
}
