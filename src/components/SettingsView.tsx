import { useState, useRef, useEffect } from 'react';
import { Download, Upload, AlertTriangle, Check, Database, FileJson, RefreshCw, Languages, User, RotateCcw, Shield, Globe, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import type { MeasurementRecord, GrowthGoal, UserProfile } from '../types/measurements';
import { CANONICAL_INITIAL_RECORDS, CANONICAL_INITIAL_PROFILE } from '../data/defaultRecords';
import { getMeasurementsStorageKey, getProfileStorageKey, getGoalsStorageKey } from '../utils/storageKeys';

interface Props {
    records: MeasurementRecord[];
    goals: GrowthGoal[];
    profile: UserProfile | null;
}

export const SettingsView = ({ records, goals, profile }: Props) => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const { profile: currentProfile, updateProfile } = useProfile();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Profile & Biometrics State
    const activeProfile = profile || currentProfile;
    const defaultUserName = activeProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Atleta';
    const isAlexis = defaultUserName.toLowerCase().includes('alexis') || defaultUserName.toLowerCase().includes('martyniuk') || user?.email?.toLowerCase().includes('martyniuk');

    const [name, setName] = useState(defaultUserName);
    const [age, setAge] = useState<number>(activeProfile?.age || (isAlexis ? 38 : 28));
    const [height, setHeight] = useState<number>(activeProfile?.height || (isAlexis ? 191 : (activeProfile?.sex === 'female' ? 165 : 178)));
    const [isPublic, setIsPublic] = useState<boolean>(activeProfile?.isPublic !== false);
    const [publicAlias, setPublicAlias] = useState<string>(activeProfile?.publicAlias || '');
    const [profileSaved, setProfileSaved] = useState(false);

    useEffect(() => {
        if (activeProfile) {
            if (activeProfile.name) setName(activeProfile.name);
            if (activeProfile.age) setAge(activeProfile.age);
            if (activeProfile.height) setHeight(activeProfile.height);
            setIsPublic(activeProfile.isPublic !== false);
            if (activeProfile.publicAlias) setPublicAlias(activeProfile.publicAlias);
        }
    }, [activeProfile]);

    const handleSaveProfile = async () => {
        await updateProfile({
            name: name.trim() || defaultUserName,
            age: Number(age) || (isAlexis ? 38 : 28),
            height: Number(height) || (isAlexis ? 191 : (activeProfile?.sex === 'female' ? 165 : 178)),
            isPublic,
            publicAlias: publicAlias.trim()
        });
        setProfileSaved(true);
        setTimeout(() => setProfileSaved(false), 2500);
    };

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

        setSuccessMsg(t('settings.success_export'));
        setTimeout(() => setSuccessMsg(null), 3000);
    };

    const handleImportClick = () => {
        if (confirm(t('settings.confirm_import'))) {
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
                    throw new Error(t('settings.error_format'));
                }

                // 1. Restore Local Storage Items
                if (json.localSettings) {
                    Object.entries(json.localSettings).forEach(([key, val]) => {
                        if (val) localStorage.setItem(key, val as string);
                    });
                }

                // 2. Restore Main Data structures to User-Scoped LocalStorage
                if (json.measurements) localStorage.setItem(getMeasurementsStorageKey(user?.uid), JSON.stringify(json.measurements));
                if (json.goals) localStorage.setItem(getGoalsStorageKey(user?.uid), JSON.stringify(json.goals));
                if (json.profile) localStorage.setItem(getProfileStorageKey(user?.uid), JSON.stringify(json.profile));

                setSuccessMsg(t('settings.success_import'));

                // 3. Force Reload to hydrate state from LocalStorage
                setTimeout(() => {
                    window.location.reload();
                }, 1500);

            } catch (err: any) {
                console.error(err);
                setError(err.message || t('settings.error_read'));
            } finally {
                setImporting(false);
                // Clear input
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const handleRestoreBaseline = () => {
        if (confirm('¿Deseas restaurar la ficha histórica y línea base del 20/08/2026 en tu cuenta?')) {
            const mKey = getMeasurementsStorageKey(user?.uid);
            const pKey = getProfileStorageKey(user?.uid);
            localStorage.setItem(mKey, JSON.stringify(CANONICAL_INITIAL_RECORDS));
            localStorage.setItem(pKey, JSON.stringify(CANONICAL_INITIAL_PROFILE));
            localStorage.setItem('skeletal_height', '191');
            localStorage.setItem('skeletal_frame_draft', JSON.stringify({ wrist: 17.5, ankle: 22.5, knee: 39 }));
            setSuccessMsg('¡Línea base histórica (20/08/2026) restaurada con éxito!');
            setTimeout(() => {
                window.location.reload();
            }, 1200);
        }
    };

    return (
        <div className="settings-view animate-fade">
            <div className="view-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-color)' }}>
                        <Database size={24} />
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{t('settings.title')}</h2>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        Gestión de copias de seguridad, exportación/importación de telemetría y configuración regional.
                    </p>
                </div>
            </div>

            <div className="settings-grid">
                {/* PROFILE & BIOMETRICS CARD */}
                <div className="card glass settings-card">
                    <div className="card-header">
                        <User className="text-amber-400" size={24} />
                        <div>
                            <h3 style={{ margin: 0 }}>Perfil del Atleta & Biometría</h3>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Datos base sincronizados con tu cuenta</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                                Nombre de Usuario
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="settings-input"
                                placeholder="Tu nombre"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                                    Edad (Años)
                                </label>
                                <input
                                    type="number"
                                    value={age || ''}
                                    onChange={(e) => setAge(Number(e.target.value))}
                                    className="settings-input"
                                    placeholder="28"
                                    min="10"
                                    max="110"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                                    Estatura Habitual (cm)
                                </label>
                                <input
                                    type="number"
                                    value={height || ''}
                                    onChange={(e) => setHeight(Number(e.target.value))}
                                    className="settings-input"
                                    placeholder="178"
                                    min="100"
                                    max="250"
                                />
                            </div>
                        </div>
                    </div>

                    <button className="btn-primary" onClick={handleSaveProfile} style={{ marginTop: '0.25rem' }}>
                        <Check size={18} className="mr-2" />
                        {profileSaved ? '¡Guardado Correctamente!' : 'Guardar Datos Biométricos'}
                    </button>
                    {profileSaved && (
                        <div className="success-tag animate-fade-in">
                            <Check size={14} /> Sincronizado en la nube y en el dispositivo
                        </div>
                    )}
                </div>

                {/* PRIVACY & COMMUNITY CARD */}
                <div className="card glass settings-card">
                    <div className="card-header">
                        <Shield className="text-cyan-400" size={24} />
                        <div>
                            <h3 style={{ margin: 0 }}>Privacidad & Duelos Comunitarios</h3>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Controla tu visibilidad para comparativas Head-to-Head</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {/* Privacy Toggle Options */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div
                                onClick={() => setIsPublic(true)}
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    background: isPublic ? 'rgba(34, 211, 238, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                                    border: isPublic ? '1.5px solid #22d3ee' : '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.35rem',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.82rem', color: isPublic ? '#22d3ee' : '#cbd5e1' }}>
                                        <Globe size={15} />
                                        <span>Público</span>
                                    </div>
                                    {isPublic && <Check size={15} style={{ color: '#22d3ee' }} />}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.35 }}>
                                    Apareces en el selector de la comunidad para duelos y comparativas.
                                </p>
                            </div>

                            <div
                                onClick={() => setIsPublic(false)}
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    cursor: 'pointer',
                                    background: !isPublic ? 'rgba(239, 68, 68, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                                    border: !isPublic ? '1.5px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.35rem',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.82rem', color: !isPublic ? '#ef4444' : '#cbd5e1' }}>
                                        <Lock size={15} />
                                        <span>Privado</span>
                                    </div>
                                    {!isPublic && <Check size={15} style={{ color: '#ef4444' }} />}
                                </div>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.35 }}>
                                    100% confidencial. Se oculta tu ficha de la base comunitaria.
                                </p>
                            </div>
                        </div>

                        {/* Public Alias Field */}
                        {isPublic && (
                            <div className="animate-fade-in">
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.35rem', fontWeight: 600 }}>
                                    Alias / Apodo Público en la Comunidad (Opcional)
                                </label>
                                <input
                                    type="text"
                                    value={publicAlias}
                                    onChange={(e) => setPublicAlias(e.target.value)}
                                    className="settings-input"
                                    placeholder="Ej: Alexis M. o IronTitan"
                                />
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.2rem' }}>
                                    Nombre mostrado a otros atletas al seleccionarte como rival.
                                </span>
                            </div>
                        )}

                        {/* Security and Privacy Guarantee Badge */}
                        <div style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '10px',
                            background: 'rgba(245, 158, 11, 0.07)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            fontSize: '0.71rem',
                            color: '#cbd5e1',
                            lineHeight: 1.35
                        }}>
                            <strong style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.15rem' }}>
                                <Shield size={12} /> Garantía de Privacidad Total:
                            </strong>
                            Nunca se comparten fotos corporales, correos ni notas privadas. Solo se comparan perímetros musculares de forma técnica.
                        </div>

                        <button className="btn-primary" onClick={handleSaveProfile} style={{ marginTop: '0.25rem' }}>
                            <Check size={18} className="mr-2" />
                            {profileSaved ? '¡Preferencia Guardada!' : 'Guardar Ajustes de Privacidad'}
                        </button>
                    </div>
                </div>

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
                            <span className="label">{t('settings.stats.records')}</span>
                            <span className="val">{records.length}</span>
                        </div>
                        <div className="mini-stat">
                            <span className="label">{t('settings.stats.goals')}</span>
                            <span className="val">{goals.length}</span>
                        </div>
                        <div className="mini-stat">
                            <span className="label">{t('settings.stats.profile')}</span>
                            <span className="val">{profile ? t('settings.stats.yes') : t('settings.stats.no')}</span>
                        </div>
                    </div>
                    <button className="btn-primary" onClick={handleExport}>
                        <FileJson size={18} className="mr-2" />
                        {t('settings.btn_download')}
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
                            <strong>{t('common.warning')}:</strong> {t('settings.warning_overwrite')}
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
                                {t('settings.btn_processing')}
                            </>
                        ) : (
                            <>
                                <Upload size={18} className="mr-2" />
                                {t('settings.btn_upload')}
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        className="btn-secondary"
                        style={{ borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24', marginTop: '0.25rem' }}
                        onClick={handleRestoreBaseline}
                    >
                        <RotateCcw size={18} className="mr-2" />
                        Restaurar Histórico Inicial (20/08/2026)
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
                    background: rgba(245, 158, 11, 0.15);
                    border-color: #f59e0b;
                    color: #fbbf24;
                    box-shadow: 0 0 15px rgba(245, 158, 11, 0.25);
                }

                .settings-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: rgba(0, 0, 0, 0.35);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    border-radius: 8px;
                    color: #ffffff;
                    font-size: 0.95rem;
                    font-weight: 500;
                    outline: none;
                    transition: border-color 0.2s, box-shadow 0.2s;
                    box-sizing: border-box;
                }
                .settings-input:focus {
                    border-color: #f59e0b;
                    box-shadow: 0 0 10px rgba(245, 158, 11, 0.25);
                }
            `}</style>
        </div>
    );
};
