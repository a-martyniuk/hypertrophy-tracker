import { useState, useRef } from 'react';
import { Download, Upload, AlertTriangle, Check, Database, FileJson, RefreshCw, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import type { MeasurementRecord, GrowthGoal, UserProfile } from '../types/measurements';

interface Props {
    records: MeasurementRecord[];
    goals: GrowthGoal[];
    profile: UserProfile | null;
}

export const SettingsView = ({ records, goals, profile }: Props) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    const handleExport = () => {
        const data = {
            metadata: {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                user: user?.email || 'guest'
            },
            profile,
            measurements: records,
            goals,
            localSettings: {
                // Capture other local storage items relevant to the app
                skeletal_height: localStorage.getItem('skeletal_height'),
                skeletal_frame_draft: localStorage.getItem('skeletal_frame_draft'),
                metabolism_settings: localStorage.getItem('metabolism_settings')
            }
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hypertrophy_data_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setSuccessMsg('Datos exportados correctamente.');
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    const handleImportClick = () => {
        if (confirm("IMPORTANTE: Al importar se sobrescribirán los datos locales actuales. ¿Deseas continuar?")) {
            fileInputRef.current?.click();
        }
    };

    const processImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);

                // Simple validation
                if (!json.measurements && !json.profile) {
                    throw new Error("Formato de archivo inválido.");
                }

                // 1. Restore Local Storage Items
                if (json.localSettings) {
                    Object.entries(json.localSettings).forEach(([key, val]) => {
                        if (val) localStorage.setItem(key, val as string);
                    });
                }

                // 2. Restore Main Data structures to LocalStorage (Standard Keys)
                // Even for Auth users, we dump to local first, app logic will verify/sync if needed
                if (json.measurements) localStorage.setItem('hypertrophy_measurements', JSON.stringify(json.measurements));
                if (json.goals) localStorage.setItem('hypertrophy_goals', JSON.stringify(json.goals));
                if (json.profile) localStorage.setItem('hypertrophy_profile', JSON.stringify(json.profile));

                setSuccessMsg('Datos importados. Recargando aplicación...');

                // 3. Force Reload to hydrate state from LocalStorage
                setTimeout(() => {
                    window.location.reload();
                }, 1500);

            } catch (err: any) {
                console.error(err);
                setError(err.message || "Error al leer el archivo.");
            } finally {
                setImporting(false);
                // Clear input
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="settings-view animate-fade-in">
            <div className="view-header">
                <div className="title-group">
                    <Database className="text-primary" size={24} />
                    <h2>{t('settings.title')}</h2>
                </div>
            </div>

            <div className="settings-grid">
                {/* EXPORT CARD */}
                <div className="card glass settings-card">
                    <div className="card-header">
                        <Download className="text-emerald-400" size={24} />
                        <h3>{t('settings.export')}</h3>
                    </div>
                    <p className="card-desc">
                        {t('settings.export_desc')}
                    </p>
                    <div className="stats-row">
                        <div className="mini-stat">
                            <span className="label">Registros</span>
                            <span className="val">{records.length}</span>
                        </div>
                        <div className="mini-stat">
                            <span className="label">Objetivos</span>
                            <span className="val">{goals.length}</span>
                        </div>
                        <div className="mini-stat">
                            <span className="label">Perfil</span>
                            <span className="val">{profile ? 'Si' : 'No'}</span>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={handleExport}>
                        <FileJson size={18} className="mr-2" />
                        DESCARGAR RESPALDO
                    </button>
                    {successMsg && !importing && (
                        <div className="success-tag animate-fade-in">
                            <Check size={14} /> {successMsg}
                        </div>
                    )}
                </div>

                {/* IMPORT CARD */}
                <div className="card glass settings-card">
                    <div className="card-header">
                        <Upload className="text-amber-400" size={24} />
                        <h3>{t('settings.import')}</h3>
                    </div>
                    <p className="card-desc">
                        {t('settings.import_desc')}
                    </p>

                    <div className="warning-box">
                        <AlertTriangle size={18} className="text-amber-400 flex-shrink-0" />
                        <div className="text-xs text-amber-100/80">
                            <strong>Advertencia:</strong> Esta acción sobrescribirá los datos guardados en este dispositivo.
                            Asegúrate de exportar tus datos actuales antes de continuar si tienes dudas.
                        </div>
                    </div>

                    <input
                        type="file"
                        accept=".json"
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        onChange={processImport}
                    />

                    <button className="btn-secondary" onClick={handleImportClick} disabled={importing}>
                        {importing ? (
                            <>
                                <RefreshCw size={18} className="mr-2 animate-spin" />
                                PROCESANDO...
                            </>
                        ) : (
                            <>
                                <Upload size={18} className="mr-2" />
                                CARGAR ARCHIVO RESPALDO
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="error-tag animate-fade-in">
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}
                    {successMsg && importing && (
                        <div className="success-tag animate-fade-in">
                            <Check size={14} /> {successMsg}
                        </div>
                    )}
                </div>

                {/* LANGUAGE CARD */}
                <div className="card glass settings-card">
                    <div className="card-header">
                        <Languages className="text-blue-400" size={24} />
                        <h3>{t('settings.language')}</h3>
                    </div>
                    <p className="card-desc">
                        {t('settings.language_desc')}
                    </p>
                    <div className="language-selector">
                        <button
                            className={`lang-btn ${i18n.language === 'es' ? 'active' : ''}`}
                            onClick={() => i18n.changeLanguage('es')}
                        >
                            🇪🇸 Español
                        </button>
                        <button
                            className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
                            onClick={() => i18n.changeLanguage('en')}
                        >
                            🇺🇸 English
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .settings-view {
                    padding: 1.5rem;
                    max-width: 1000px;
                    margin: 0 auto;
                }
                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 2rem;
                    margin-top: 2rem;
                }
                .settings-card {
                    padding: 2rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    border-radius: 16px;
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .card-header h3 {
                    font-size: 1.25rem;
                    font-weight: 700;
                    color: white;
                }
                .card-desc {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.6;
                }
                
                .stats-row {
                    display: flex;
                    gap: 1rem;
                    padding: 1rem;
                    background: rgba(0,0,0,0.2);
                    border-radius: 8px;
                    justify-content: space-around;
                }
                .mini-stat {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                }
                .mini-stat .label {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                }
                .mini-stat .val {
                    font-weight: 700;
                    color: white;
                }

                .warning-box {
                    background: rgba(245, 158, 11, 0.1);
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    padding: 1rem;
                    border-radius: 8px;
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                }

                .success-tag {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #4ade80;
                    font-size: 0.85rem;
                    font-weight: 600;
                    background: rgba(74, 222, 128, 0.1);
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    margin-top: 0.5rem;
                }
                .error-tag {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #f87171;
                    font-size: 0.85rem;
                    font-weight: 600;
                    background: rgba(248, 113, 113, 0.1);
                    padding: 0.5rem 1rem;
                    border-radius: 8px;
                    margin-top: 0.5rem;
                }

                .language-selector {
                    display: flex;
                    gap: 1rem;
                }
                
                .lang-btn {
                    flex: 1;
                    padding: 1rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    color: var(--text-secondary);
                    font-weight: 600;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.5rem;
                    transition: all 0.2s ease;
                }
                
                .lang-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }
                
                .lang-btn.active {
                    background: rgba(59, 130, 246, 0.15);
                    border-color: #3b82f6;
                    color: #3b82f6;
                    box-shadow: 0 0 15px rgba(59, 130, 246, 0.2);
                }
            `}</style>
        </div>
    );
};
