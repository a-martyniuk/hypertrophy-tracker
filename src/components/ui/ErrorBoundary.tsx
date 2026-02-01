import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import './ErrorBoundary.css';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary-container glass">
                    <AlertTriangle size={48} className="text-danger mb-4" />
                    <h2>Algo salió mal</h2>
                    <p className="error-message">
                        {this.state.error?.message || 'Ha ocurrido un error inesperado.'}
                    </p>
                    <div className="error-actions">
                        <button
                            className="hud-btn"
                            onClick={() => window.location.reload()}
                        >
                            <RefreshCw size={16} /> Recargar
                        </button>
                        <button
                            className="hud-btn secondary"
                            onClick={() => window.location.href = '/'}
                        >
                            <Home size={16} /> Ir al Inicio
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
