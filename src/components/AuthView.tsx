import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Mail, Lock, LogIn, UserPlus, Loader2, Activity } from 'lucide-react';

export const AuthView = ({ onGuest }: { onGuest: () => void }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setMessage('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.');
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-overlay">
            <div className="auth-container glass animate-fade">
                <div className="auth-header">
                    <Activity color="#f59e0b" size={40} />
                    <h2>{isLogin ? 'Acceso de Atleta' : 'Registro de Atleta'}</h2>
                    <p>{isLogin ? 'Ingresa tus credenciales para continuar' : 'Crea tu perfil pro para sincronizar tus datos'}</p>
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

                    <button type="submit" className="btn-primary auth-submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
                        {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
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
                    padding: 3rem;
                    border-radius: 24px;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    box-shadow: 0 0 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(245, 158, 11, 0.05);
                }

                .auth-header {
                    text-align: center;
                    margin-bottom: 2.5rem;
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
                    gap: 1.5rem;
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
                    padding: 1rem;
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
                    padding: 1rem;
                    font-size: 1rem;
                    margin-top: 1rem;
                }

                .auth-divider {
                    display: flex;
                    align-items: center;
                    text-align: center;
                    color: rgba(255, 255, 255, 0.2);
                    font-size: 0.75rem;
                    margin: 0.5rem 0;
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
                    margin-top: 2rem;
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
