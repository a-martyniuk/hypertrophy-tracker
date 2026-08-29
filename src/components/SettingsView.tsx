import { useState, useRef, useEffect } from 'react';
import {
    Download,
    Upload,
    AlertTriangle,
    Check,
    Database,
    FileJson,
    RefreshCw,
    Languages,
    User,
    Shield,
    Globe,
    Lock,
    FileText,
    Share2,
    Layers,
    QrCode,
    Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useProfile } from '../hooks/useProfile';
import type { MeasurementRecord, GrowthGoal, UserProfile } from '../types/measurements';
import { getMeasurementsStorageKey, getProfileStorageKey, getGoalsStorageKey } from '../utils/storageKeys';
import { generateAthletePDFReport } from '../utils/pdfReportGenerator';
import { ShareReportModal } from './share/ShareReportModal';
import { AthleteStoryCardModal } from './share/AthleteStoryCard';

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
    const [activeSection, setActiveSection] = useState<'all' | 'profile' | 'privacy' | 'export' | 'system'>('all');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

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

    const latestRecord = records[0];
    const previousRecord = records[1];

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

                if (!json.measurements && !json.profile) {
                    throw new Error(t('settings.error_format'));
                }

                if (json.localSettings) {
                    Object.entries(json.localSettings).forEach(([key, val]) => {
                        if (val) localStorage.setItem(key, val as string);
                    });
                }

                if (json.measurements) localStorage.setItem(getMeasurementsStorageKey(user?.uid), JSON.stringify(json.measurements));
                if (json.goals) localStorage.setItem(getGoalsStorageKey(user?.uid), JSON.stringify(json.goals));
                if (json.profile) localStorage.setItem(getProfileStorageKey(user?.uid), JSON.stringify(json.profile));

                setSuccessMsg(t('settings.success_import'));

                setTimeout(() => {
                    window.location.reload();
                }, 1500);

            } catch (err: any) {
                console.error(err);
                setError(err.message || t('settings.error_read'));
            } finally {
                setImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };
        reader.readAsText(file);
    };

    const showProfile = activeSection === 'all' || activeSection === 'profile';
    const showPrivacy = activeSection === 'all' || activeSection === 'privacy';
    const showExport = activeSection === 'all' || activeSection === 'export';
    const showSystem = activeSection === 'all' || activeSection === 'system';

    return (
        <div className="settings-view animate-fade">
            {/* Header with Account Status */}
            <div className="settings-header-banner">
                <div className="settings-title-group">
                    <h2>
                        <Database size={26} style={{ color: 'var(--primary-color)' }} />
                        <span>{t('settings.title')} & Centro de Datos</span>
                    </h2>
                    <p>
                        Administración de perfil, privacidad comunitaria, exportación de reportes y copias de seguridad.
                    </p>
                </div>

                <div className="settings-status-chips">
                    <span className={`settings-chip ${user ? 'online' : 'local'}`}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: user ? '#10b981' : '#f59e0b', display: 'inline-block' }} />
                        {user ? '☁️ Sincronización en la Nube' : '💾 Modo Local (Invitado)'}
                    </span>
                    <span className="settings-chip">
                        <span>📊 {records.length} Auditorías</span>
                    </span>
                    <span className="settings-chip">
                        <span>🎯 {goals.length} Metas</span>
                    </span>
                </div>
            </div>

            {/* Sub-Navigation Tabs */}
            <div className="settings-tabs-bar">
                <button
                    className={`settings-tab-btn ${activeSection === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveSection('all')}
                >
                    <Layers size={15} />
                    <span>Ver Todo</span>
                </button>
                <button
                    className={`settings-tab-btn ${activeSection === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveSection('profile')}
                >
                    <User size={15} />
                    <span>Perfil & Biometría</span>
                </button>
                <button
                    className={`settings-tab-btn ${activeSection === 'privacy' ? 'active' : ''}`}
                    onClick={() => setActiveSection('privacy')}
                >
                    <Shield size={15} />
                    <span>Privacidad & Duelos</span>
                </button>
                <button
                    className={`settings-tab-btn ${activeSection === 'export' ? 'active' : ''}`}
                    onClick={() => setActiveSection('export')}
                >
                    <Download size={15} />
                    <span>Centro de Exportación & Salidas</span>
                </button>
                <button
                    className={`settings-tab-btn ${activeSection === 'system' ? 'active' : ''}`}
                    onClick={() => setActiveSection('system')}
                >
                    <Languages size={15} />
                    <span>Idioma & Sistema</span>
                </button>
            </div>

            <div className="settings-grid">
                {/* 1. PROFILE & BIOMETRICS CARD */}
                {showProfile && (
                    <div className="card glass settings-card animate-fade">
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
                )}

                {/* 2. PRIVACY & COMMUNITY CARD */}
                {showPrivacy && (
                    <div className="card glass settings-card animate-fade">
                        <div className="card-header">
                            <Shield className="text-cyan-400" size={24} />
                            <div>
                                <h3 style={{ margin: 0 }}>Privacidad & Duelos Comunitarios</h3>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Controla tu visibilidad para comparativas Head-to-Head</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                )}

                {/* 3. CONSOLIDATED DATA EXPORT & SHARING HUB */}
                {showExport && (
                    <div className="card glass settings-card animate-fade" style={{ gridColumn: activeSection === 'export' ? '1 / -1' : undefined }}>
                        <div className="card-header">
                            <Download className="text-emerald-400" size={24} />
                            <div>
                                <h3 style={{ margin: 0 }}>Centro de Exportación & Difusión de Telemetría</h3>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Dossiers clínicos en PDF, enlaces virales y respaldos de datos</span>
                            </div>
                        </div>

                        <div className="export-hub-grid">
                            {/* Option 1: PDF Clinical Report */}
                            <div className="export-item-card">
                                <div className="export-item-top">
                                    <h4 className="export-item-title">
                                        <FileText size={16} style={{ color: '#fbbf24' }} />
                                        <span>Dossier Antropométrico Oficial (PDF)</span>
                                    </h4>
                                    <span className="export-badge pdf">2 Páginas Vectorizadas</span>
                                </div>
                                <p className="export-item-desc">
                                    Informe técnico de grado clínico con diagnóstico biomédico, límites genéticos Casey Butt, ratios Steve Reeves, balance simétrico y prescripción de entrenamiento.
                                </p>
                                <button
                                    onClick={() => generateAthletePDFReport({ latestRecord, previousRecord, records, userName: name, sex: activeProfile?.sex || 'male' })}
                                    className="export-item-btn pdf-btn"
                                >
                                    <Download size={15} />
                                    <span>Descargar Informe PDF Completo</span>
                                </button>
                            </div>

                            {/* Option 2: Viral Social Link & QR Code */}
                            <div className="export-item-card">
                                <div className="export-item-top">
                                    <h4 className="export-item-title">
                                        <Share2 size={16} style={{ color: '#38bdf8' }} />
                                        <span>Ficha Pública de Atleta & Difusión Viral</span>
                                    </h4>
                                    <span className="export-badge social">Instagram, WhatsApp & QR</span>
                                </div>
                                <p className="export-item-desc">
                                    Genera un enlace visualmente optimizado para historias de Instagram, biografía, estados de WhatsApp o código QR con simulador de duelos versus interactivo y CTA de registro gratis.
                                </p>
                                <button
                                    onClick={() => setIsShareModalOpen(true)}
                                    className="export-item-btn social-btn"
                                >
                                    <QrCode size={15} />
                                    <span>Abrir Centro de Difusión (Link / QR)</span>
                                </button>
                            </div>

                            {/* Option 3: Raw JSON Backup & Restore */}
                            <div className="export-item-card">
                                <div className="export-item-top">
                                    <h4 className="export-item-title">
                                        <FileJson size={16} style={{ color: '#34d399' }} />
                                        <span>Copia de Respaldo de Base de Datos (JSON)</span>
                                    </h4>
                                    <span className="export-badge json">Custodia & Migración</span>
                                </div>
                                <p className="export-item-desc">
                                    Descarga un archivo estructurado con todas tus auditorías antropométricas, metas y ajustes para transferirlos a otro dispositivo o archivarlos.
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                                    <button
                                        onClick={handleExport}
                                        className="export-item-btn json-btn"
                                    >
                                        <Download size={14} />
                                        <span>Descargar JSON</span>
                                    </button>
                                    <button
                                        onClick={handleImportClick}
                                        disabled={importing}
                                        className="export-item-btn"
                                        style={{ background: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.12)', color: '#cbd5e1' }}
                                    >
                                        {importing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                                        <span>{importing ? 'Procesando...' : 'Cargar JSON'}</span>
                                    </button>
                                </div>
                            </div>

                            {/* Option 4: 9:16 Vertical Story Card for Instagram & WhatsApp */}
                            <div className="export-item-card">
                                <div className="export-item-top">
                                    <h4 className="export-item-title">
                                        <Sparkles size={16} style={{ color: '#fbbf24' }} />
                                        <span>Ficha Visual 9:16 (Instagram Story & WhatsApp)</span>
                                    </h4>
                                    <span className="export-badge social" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', borderColor: 'rgba(245, 158, 11, 0.3)' }}>Formato Vertical HD</span>
                                </div>
                                <p className="export-item-desc">
                                    Exporta una tarjeta estética vertical de alta resolución (1080×1920 px) estilo Cyberpunk / Spotify Wrapped con tus 4 métricas maestras y código QR incrustado para redes.
                                </p>
                                <button
                                    onClick={() => setIsStoryModalOpen(true)}
                                    className="export-item-btn social-btn"
                                    style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(56, 189, 248, 0.15))', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}
                                >
                                    <Sparkles size={15} />
                                    <span>Generar Story Card 9:16</span>
                                </button>
                            </div>
                        </div>

                        {/* Hidden file input for import */}
                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={processImport}
                        />

                        {error && (
                            <div className="error-tag animate-fade-in">
                                <AlertTriangle size={14} /> {error}
                            </div>
                        )}
                        {successMsg && (
                            <div className="success-tag animate-fade-in">
                                <Check size={14} /> {successMsg}
                            </div>
                        )}
                    </div>
                )}

                {/* 4. LANGUAGE & PREFERENCES CARD */}
                {showSystem && (
                    <div className="card glass settings-card animate-fade">
                        <div className="card-header">
                            <Languages className="text-blue-400" size={24} />
                            <div>
                                <h3 style={{ margin: 0 }}>{t('settings.language')} & Sistema</h3>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Configuración regional de la aplicación</span>
                            </div>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
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
                )}
            </div>

            {/* Share Athlete Report Modal */}
            <ShareReportModal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                latestRecord={latestRecord}
                records={records}
                userName={name}
                sex={activeProfile?.sex || 'male'}
            />

            {/* Athlete Story Card 9:16 Modal */}
            {isStoryModalOpen && latestRecord && (
                <AthleteStoryCardModal
                    record={latestRecord}
                    records={records}
                    userName={name}
                    sex={activeProfile?.sex || 'male'}
                    isOpen={isStoryModalOpen}
                    onClose={() => setIsStoryModalOpen(false)}
                />
            )}

            <style>{`
                .settings-view {
                    padding: 1.5rem;
                    max-width: 1050px;
                    margin: 0 auto;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .settings-header-banner {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                    padding-bottom: 1.25rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                }

                .settings-title-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.35rem;
                }

                .settings-title-group h2 {
                    font-size: 1.75rem;
                    font-weight: 800;
                    color: #ffffff;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                }

                .settings-title-group p {
                    font-size: 0.85rem;
                    color: var(--text-secondary);
                    margin: 0;
                }

                .settings-status-chips {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .settings-chip {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    font-family: var(--font-mono);
                    font-weight: 700;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: #cbd5e1;
                }

                .settings-chip.online {
                    background: rgba(16, 185, 129, 0.12);
                    border-color: rgba(16, 185, 129, 0.3);
                    color: #34d399;
                }

                .settings-chip.local {
                    background: rgba(245, 158, 11, 0.12);
                    border-color: rgba(245, 158, 11, 0.3);
                    color: #fbbf24;
                }

                /* Tab Navigation Switcher */
                .settings-tabs-bar {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    overflow-x: auto;
                    padding-bottom: 0.35rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
                    scrollbar-width: none;
                }
                .settings-tabs-bar::-webkit-scrollbar {
                    display: none;
                }

                .settings-tab-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1.1rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    color: #94a3b8;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.06);
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                }

                .settings-tab-btn:hover {
                    color: #ffffff;
                    background: rgba(255, 255, 255, 0.06);
                    border-color: rgba(255, 255, 255, 0.12);
                }

                .settings-tab-btn.active {
                    color: #000000;
                    background: var(--primary-color);
                    border-color: var(--primary-color);
                    box-shadow: 0 0 16px rgba(245, 158, 11, 0.3);
                }

                /* Settings Layout Grid */
                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                    gap: 1.5rem;
                }

                .settings-card {
                    padding: 1.75rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1.25rem;
                    border-radius: 16px;
                    background: rgba(18, 18, 24, 0.65);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    position: relative;
                    overflow: hidden;
                }

                .settings-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.4), transparent);
                    opacity: 0.5;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 0.85rem;
                }

                .card-header h3 {
                    font-size: 1.15rem;
                    font-weight: 800;
                    color: #ffffff;
                    margin: 0;
                }

                .card-header span {
                    font-size: 0.75rem;
                    color: #94a3b8;
                }

                .settings-input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border-radius: 10px;
                    background: rgba(0, 0, 0, 0.35);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                    color: #ffffff;
                    font-family: inherit;
                    font-size: 0.9rem;
                    outline: none;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }

                .settings-input:focus {
                    border-color: var(--primary-color);
                    box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.2);
                }

                /* Export Hub Specific Styles */
                .export-hub-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }

                .export-item-card {
                    padding: 1.25rem;
                    border-radius: 14px;
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.07);
                    display: flex;
                    flex-direction: column;
                    gap: 0.85rem;
                    transition: all 0.2s ease;
                }

                .export-item-card:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.12);
                }

                .export-item-top {
                    display: flex;
                    align-items: flex-start;
                    justify-content: space-between;
                    gap: 0.75rem;
                }

                .export-item-title {
                    font-size: 0.95rem;
                    font-weight: 800;
                    color: #ffffff;
                    margin: 0;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .export-badge {
                    font-size: 0.68rem;
                    font-family: var(--font-mono);
                    font-weight: 700;
                    padding: 0.2rem 0.5rem;
                    border-radius: 6px;
                    text-transform: uppercase;
                }

                .export-badge.pdf {
                    background: rgba(245, 158, 11, 0.15);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    color: #fbbf24;
                }

                .export-badge.social {
                    background: rgba(56, 189, 248, 0.15);
                    border: 1px solid rgba(56, 189, 248, 0.3);
                    color: #38bdf8;
                }

                .export-badge.json {
                    background: rgba(52, 211, 153, 0.15);
                    border: 1px solid rgba(52, 211, 153, 0.3);
                    color: #34d399;
                }

                .export-item-desc {
                    font-size: 0.78rem;
                    color: #94a3b8;
                    line-height: 1.4;
                    margin: 0;
                }

                .export-item-btn {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    padding: 0.65rem 1.1rem;
                    border-radius: 10px;
                    font-size: 0.82rem;
                    font-weight: 800;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 1px solid transparent;
                }

                .export-item-btn.pdf-btn {
                    background: rgba(245, 158, 11, 0.2);
                    border-color: rgba(245, 158, 11, 0.5);
                    color: #fbbf24;
                }
                .export-item-btn.pdf-btn:hover {
                    background: #fbbf24;
                    color: #000000;
                }

                .export-item-btn.social-btn {
                    background: rgba(56, 189, 248, 0.2);
                    border-color: rgba(56, 189, 248, 0.5);
                    color: #38bdf8;
                }
                .export-item-btn.social-btn:hover {
                    background: #38bdf8;
                    color: #000000;
                }

                .export-item-btn.json-btn {
                    background: rgba(52, 211, 153, 0.2);
                    border-color: rgba(52, 211, 153, 0.5);
                    color: #34d399;
                }
                .export-item-btn.json-btn:hover {
                    background: #34d399;
                    color: #000000;
                }

                .success-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 0.85rem;
                    border-radius: 8px;
                    background: rgba(16, 185, 129, 0.15);
                    border: 1px solid rgba(16, 185, 129, 0.3);
                    color: #34d399;
                    font-size: 0.78rem;
                    font-weight: 600;
                }

                .error-tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.4rem;
                    padding: 0.5rem 0.85rem;
                    border-radius: 8px;
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #f87171;
                    font-size: 0.78rem;
                    font-weight: 600;
                }

                .language-selector {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                }

                .lang-btn {
                    padding: 0.75rem;
                    border-radius: 12px;
                    font-size: 0.85rem;
                    font-weight: 700;
                    cursor: pointer;
                    background: rgba(255, 255, 255, 0.04);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    color: #cbd5e1;
                    transition: all 0.2s ease;
                }

                .lang-btn.active {
                    background: rgba(56, 189, 248, 0.15);
                    border-color: #38bdf8;
                    color: #38bdf8;
                }

                @media (max-width: 768px) {
                    .settings-view {
                        padding: 1rem;
                        gap: 1rem;
                    }
                    .settings-grid {
                        grid-template-columns: 1fr;
                    }
                    .settings-card {
                        padding: 1.25rem;
                    }
                }
            `}</style>
        </div>
    );
};
