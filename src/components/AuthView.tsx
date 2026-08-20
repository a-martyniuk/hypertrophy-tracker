import { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, Loader2, Activity } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { isFirebaseConfigured } from '../lib/firebase';

export const AuthView = ({ onGuest }: { onGuest: () => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();

    const formatFirebaseError = (errCode?: string, fallbackMsg?: string): string => {
        if (!errCode) return fallbackMsg || 'Ocurrió un error inesperado';
        if (errCode.includes('user-not-found') || errCode.includes('wrong-password') || errCode.includes('invalid-credential')) {
            return 'Credenciales incorrectas. Verifica tu email y contraseña.';
        }
        if (errCode.includes('email-already-in-use')) {
            return 'Este correo ya está registrado. Por favor, inicia sesión.';
        }
        if (errCode.includes('weak-password')) {
            return 'La contraseña debe tener al menos 6 caracteres.';
        }
        if (errCode.includes('invalid-email')) {
            return 'El formato de email no es válido.';
        }
        if (errCode.includes('popup-closed-by-user')) {
            return 'Ventana de Google cerrada antes de completar el acceso.';
        }
        return fallbackMsg || errCode;
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (!isFirebaseConfigured) {
                setError('Firebase no está configurado aún. Puedes continuar como Invitado.');
                return;
            }

            if (isLogin) {
                await signInWithEmail(email, password);
            } else {
                await signUpWithEmail(email, password);
                setMessage('¡Registro exitoso! Tu cuenta ha sido creada.');
            }
        } catch (err: any) {
            console.error('[AuthView] Error:', err);
            setError(formatFirebaseError(err.code, err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setGoogleLoading(true);
        setError(null);
        try {
            if (!isFirebaseConfigured) {
                setError('Firebase no está configurado aún. Puedes continuar como Invitado.');
                return;
            }
            await signInWithGoogle();
        } catch (err: any) {
            console.error('[AuthView] Google login error:', err);
            setError(formatFirebaseError(err.code, err.message));
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-container glass animate-fade">
                <div className="auth-header">
                    <Activity color="#f59e0b" size={40} />
                    <h2>{isLogin ? 'Acceso de Atleta' : 'Registro de Atleta'}</h2>
                    <p>{isLogin ? 'Ingresa tus credenciales para sincronizar' : 'Crea tu perfil para sincronizar en la nube'}</p>
                </div>

                <form onSubmit={handleAuth} className="auth-form">
                    <div className="input-group">
                        <label><Mail size={14} /> Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                        />
                    </div>

                    <div className="input-group">
                        <label><Lock size={14} /> Contraseña</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <div className="auth-error animate-shake">{error}</div>}
                    {message && <div className="auth-success">{message}</div>}

                    <button type="submit" className="btn-primary auth-submit" disabled={loading || googleLoading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
                        {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                    </button>

                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className="btn-google"
                        disabled={loading || googleLoading}
                    >
                        {googleLoading ? (
                            <Loader2 className="animate-spin" size={18} />
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24">
                                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z" />
                                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1s.7 5.4 1.9 7.8l3.7-2.9z" />
                                <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z" />
                            </svg>
                        )}
                        <span>Continuar con Google</span>
                    </button>

                    <div className="auth-divider">
                        <span>O</span>
                    </div>

                    <button type="button" onClick={onGuest} className="btn-secondary guest-submit">
                        <Activity size={18} /> Continuar como Invitado (Local)
                    </button>
                </form>

                <div className="auth-footer">
                    <span>{isLogin ? '¿Aún no tienes cuenta?' : '¿Ya eres miembro?'}</span>
                    <button onClick={() => setIsLogin(!isLogin)} className="toggle-auth">
                        {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
                    </button>
                </div>
            </div>

            <style>{`
                .auth-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(circle at center, rgba(245, 158, 11, 0.05) 0%, rgba(13, 13, 15, 0.95) 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 2000;
                    padding: 1rem;
                }

                .auth-container {
                    width: 100%;
                    max-width: 420px;
                    padding: 2.5rem;
                    border-radius: 24px;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    box-shadow: 0 0 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(245, 158, 11, 0.05);
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 2rem;
                }

                .auth-header h2 {
                    margin-top: 1rem;
                    font-size: 1.75rem;
                    letter-spacing: -0.02em;
                }

                .auth-header p {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    margin-top: 0.5rem;
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                }

                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .input-group label {
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .input-group input {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 0.85rem 1rem;
                    color: white;
                    outline: none;
                    transition: border-color 0.2s;
                }

                .input-group input:focus {
                    border-color: #f59e0b;
                }

                .auth-error {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    text-align: center;
                }

                .auth-success {
                    background: rgba(34, 197, 94, 0.1);
                    color: #22c55e;
                    padding: 0.75rem;
                    border-radius: 8px;
                    font-size: 0.85rem;
                    text-align: center;
                }

                .auth-submit {
                    width: 100%;
                    padding: 0.9rem;
                    font-size: 1rem;
                    margin-top: 0.5rem;
                }

                .btn-google {
                    width: 100%;
                    padding: 0.85rem;
                    background: rgba(255, 255, 255, 0.07);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    color: white;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background 0.2s, border-color 0.2s;
                }

                .btn-google:hover:not(:disabled) {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(255, 255, 255, 0.3);
                }

                .btn-google:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .auth-divider {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.2);
                    font-size: 0.75rem;
                    margin: 0.25rem 0;
                }

                .auth-divider::before,
                .auth-divider::after {
                    content: '';
                    flex: 1;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }

                .auth-divider span {
                    margin: 0 1rem;
                }

                .guest-submit {
                    width: 100%;
                    padding: 0.85rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: var(--text-secondary);
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    font-weight: 500;
                    transition: var(--transition-smooth);
                }

                .guest-submit:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    border-color: rgba(255, 255, 255, 0.2);
                }

                .auth-footer {
                    margin-top: 1.5rem;
                    text-align: center;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }

                .toggle-auth {
                    background: none;
                    border: none;
                    color: #f59e0b;
                    font-weight: 600;
                    cursor: pointer;
                    margin-left: 0.5rem;
                }

                .toggle-auth:hover {
                    text-decoration: underline;
                }

                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .animate-shake {
                    animation: shake 0.2s ease-in-out 0s 2;
                }
            `}</style>
        </div>
    );
};
