import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, Copy, Check, Share2, Link as LinkIcon, Sparkles, Wand2, Zap, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';
import { encodeAthleteData, getPublicShareBaseUrl } from '../../utils/shareEncoder';
import { shortenUrl } from '../../utils/urlShortener';
import { AthleteStoryCardModal } from './AthleteStoryCard';
import type { MeasurementRecord } from '../../types/measurements';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    latestRecord?: MeasurementRecord;
    records?: MeasurementRecord[];
    userName?: string;
    sex?: 'male' | 'female';
}

export const ShareReportModal: React.FC<Props> = ({
    isOpen,
    onClose,
    latestRecord,
    records = [],
    userName = 'Atleta',
    sex = 'male'
}) => {
    const [qrUrl, setQrUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [shortCopied, setShortCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'link' | 'qr'>('link');
    const [showStoryModal, setShowStoryModal] = useState(false);
    const [includeHistory, setIncludeHistory] = useState(false);
    const [shortUrl, setShortUrl] = useState<string>('');
    const [isShortening, setIsShortening] = useState(false);

    const shareUrl = useMemo(() => {
        if (!isOpen || !latestRecord) return '';
        const recordsToEncode = includeHistory && records.length > 0 ? records : [latestRecord];
        const encoded = encodeAthleteData(userName, latestRecord, sex, recordsToEncode);
        const baseUrl = getPublicShareBaseUrl();
        return `${baseUrl}#/share?data=${encoded}`;
    }, [isOpen, latestRecord, userName, sex, records, includeHistory]);

    // Reset shortUrl when underlying data changes
    useEffect(() => {
        setShortUrl('');
    }, [shareUrl]);

    // Generate QR with the best available URL
    useEffect(() => {
        const effectiveUrl = shortUrl || shareUrl;
        if (!effectiveUrl) return;

        QRCode.toDataURL(effectiveUrl, {
            width: 240,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            }
        })
            .then(url => setQrUrl(url))
            .catch(err => console.error('Error generating QR code:', err));
    }, [shareUrl, shortUrl]);

    if (!isOpen || !latestRecord) return null;

    const handleCopy = (urlToCopy: string, isShort: boolean = false) => {
        if (!urlToCopy) return;
        navigator.clipboard.writeText(urlToCopy);
        if (isShort) {
            setShortCopied(true);
            setTimeout(() => setShortCopied(false), 2000);
        } else {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShorten = async () => {
        if (!shareUrl || isShortening) return;
        setIsShortening(true);
        try {
            const short = await shortenUrl(shareUrl);
            setShortUrl(short);
        } catch (e) {
            console.error('Error shortening URL:', e);
        } finally {
            setIsShortening(false);
        }
    };

    const handleNativeShare = async (urlToShare: string) => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: `Ficha de ${userName} - Hypertrophy Tracker`,
                    text: `Evolución física y biometría interactiva:`,
                    url: urlToShare
                });
            } catch (err) {
                console.log('Share dismissed:', err);
            }
        } else {
            handleCopy(urlToShare);
        }
    };

    const hasNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.82)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '1rem'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: 'linear-gradient(135deg, rgba(16, 22, 36, 0.98), rgba(9, 13, 22, 0.99))',
                    border: '1.5px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '20px',
                    maxWidth: '460px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    padding: '1.5rem',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '1.25rem',
                    position: 'relative'
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        borderRadius: '10px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(56, 189, 248, 0.2))',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fbbf24'
                    }}>
                        <Share2 size={22} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                        Compartir Ficha
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        Comparte tu reporte mediante enlace o código QR.
                    </p>
                </div>

                {/* Tab Selector */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    width: '100%'
                }}>
                    <button
                        onClick={() => setActiveTab('link')}
                        style={{
                            flex: 1,
                            padding: '0.55rem 0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'link' ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'transparent',
                            color: activeTab === 'link' ? '#0f172a' : '#94a3b8',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <LinkIcon size={15} />
                        <span>Compartir Enlace</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('qr')}
                        style={{
                            flex: 1,
                            padding: '0.55rem 0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTab === 'qr' ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'transparent',
                            color: activeTab === 'qr' ? '#0f172a' : '#94a3b8',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <QrCode size={15} />
                        <span>Código QR</span>
                    </button>
                </div>

                {/* Tab 1: Link */}
                {activeTab === 'link' && (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {/* Scope Selector: Snapshot (Express) vs Full History */}
                        {records.length > 1 && (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '6px',
                                background: 'rgba(0, 0, 0, 0.4)',
                                padding: '4px',
                                borderRadius: '10px',
                                border: '1px solid rgba(255, 255, 255, 0.06)'
                            }}>
                                <button
                                    type="button"
                                    onClick={() => setIncludeHistory(false)}
                                    style={{
                                        padding: '0.45rem 0.5rem',
                                        fontSize: '0.74rem',
                                        fontWeight: 800,
                                        borderRadius: '7px',
                                        border: 'none',
                                        background: !includeHistory ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'transparent',
                                        color: !includeHistory ? '#000' : '#94a3b8',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <Zap size={13} />
                                    <span>Medición Actual</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIncludeHistory(true)}
                                    style={{
                                        padding: '0.45rem 0.5rem',
                                        fontSize: '0.74rem',
                                        fontWeight: 800,
                                        borderRadius: '7px',
                                        border: 'none',
                                        background: includeHistory ? 'linear-gradient(135deg, #38bdf8, #0284c7)' : 'transparent',
                                        color: includeHistory ? '#fff' : '#94a3b8',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <span>Historial Completo ({records.length})</span>
                                </button>
                            </div>
                        )}

                        {/* Short Link Generator Box (Optimized for Instagram Bio & DMs) */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(56, 189, 248, 0.05))',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            borderRadius: '14px',
                            padding: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.6rem',
                            textAlign: 'left'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Wand2 size={15} style={{ color: '#fbbf24' }} />
                                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#f8fafc' }}>
                                        Enlace Corto para Instagram Bio & DMs
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px' }}>
                                    Anti-Largo
                                </span>
                            </div>

                            {shortUrl ? (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    background: 'rgba(0, 0, 0, 0.6)',
                                    border: '1px solid rgba(16, 185, 129, 0.4)',
                                    borderRadius: '10px',
                                    padding: '0.35rem 0.5rem'
                                }}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={shortUrl}
                                        style={{
                                            flex: 1,
                                            background: 'transparent',
                                            border: 'none',
                                            color: '#34d399',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                            fontFamily: 'var(--font-mono)',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        onClick={() => handleCopy(shortUrl, true)}
                                        className="btn-primary"
                                        style={{
                                            padding: '0.45rem 0.75rem',
                                            fontSize: '0.74rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            background: shortCopied ? '#10b981' : undefined
                                        }}
                                    >
                                        {shortCopied ? <Check size={13} /> : <Copy size={13} />}
                                        <span>{shortCopied ? '¡Listo!' : 'Copiar'}</span>
                                    </button>
                                    {hasNativeShare && (
                                        <button
                                            onClick={() => handleNativeShare(shortUrl)}
                                            className="btn-secondary"
                                            style={{
                                                padding: '0.45rem 0.65rem',
                                                fontSize: '0.74rem',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            title="Compartir enlace corto"
                                        >
                                            <Share2 size={13} />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleShorten}
                                    disabled={isShortening}
                                    style={{
                                        width: '100%',
                                        padding: '0.6rem',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(245, 158, 11, 0.4)',
                                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))',
                                        color: '#fbbf24',
                                        fontSize: '0.78rem',
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        cursor: isShortening ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isShortening ? (
                                        <>
                                            <Loader2 size={14} className="spin" />
                                            <span>Generando enlace de ~25 caracteres...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 size={14} />
                                            <span>🪄 Generar Enlace Ultracorto (TinyURL)</span>
                                        </>
                                    )}
                                </button>
                            )}
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                ✨ Ideal para la biografía de Instagram, stickers de historias y mensajes directos.
                            </div>
                        </div>

                        {/* Standard Base64 Full URL box */}
                        <div style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '0.4rem 0.5rem 0.4rem 0.85rem'
                        }}>
                            <input
                                type="text"
                                readOnly
                                value={shareUrl}
                                style={{
                                    flex: 1,
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#cbd5e1',
                                    fontSize: '0.74rem',
                                    fontFamily: 'var(--font-mono)',
                                    outline: 'none',
                                    textOverflow: 'ellipsis'
                                }}
                            />
                            <button
                                onClick={() => handleCopy(shareUrl)}
                                className="btn-secondary"
                                style={{
                                    padding: '0.45rem 0.75rem',
                                    fontSize: '0.74rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {copied ? <Check size={13} /> : <Copy size={13} />}
                                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                            </button>
                        </div>

                        {/* Native Share button if supported */}
                        {hasNativeShare && (
                            <button
                                onClick={() => handleNativeShare(shortUrl || shareUrl)}
                                className="btn-secondary"
                                style={{
                                    width: '100%',
                                    padding: '0.7rem',
                                    borderRadius: '12px',
                                    fontSize: '0.82rem',
                                    fontWeight: 800,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Share2 size={15} />
                                <span>Compartir Directo...</span>
                            </button>
                        )}

                        {/* Story Card 9:16 Action */}
                        <button
                            onClick={() => setShowStoryModal(true)}
                            className="btn-secondary"
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(56, 189, 248, 0.1))',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                color: '#fbbf24'
                            }}
                        >
                            <Sparkles size={16} />
                            <span>Exportar Story 9:16 (Instagram / WhatsApp)</span>
                        </button>
                    </div>
                )}

                {/* Tab 2: QR Code */}
                {activeTab === 'qr' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem', width: '100%' }}>
                        {qrUrl ? (
                            <div style={{
                                padding: '0.75rem',
                                background: '#ffffff',
                                borderRadius: '16px',
                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <img src={qrUrl} alt="Código QR Ficha de Atleta" style={{ width: '180px', height: '180px', display: 'block' }} />
                            </div>
                        ) : (
                            <div style={{ width: '180px', height: '180px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                Generando QR...
                            </div>
                        )}

                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                            Escanea con la cámara para abrir la ficha interactiva.
                        </p>

                        <button
                            onClick={() => handleCopy(shortUrl || shareUrl)}
                            className="btn-secondary"
                            style={{ width: '100%', padding: '0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                        </button>
                    </div>
                )}

                {/* Athlete Story Card 9:16 Modal */}
                {showStoryModal && (
                    <AthleteStoryCardModal
                        record={latestRecord}
                        records={records}
                        userName={userName}
                        sex={sex}
                        isOpen={showStoryModal}
                        onClose={() => setShowStoryModal(false)}
                    />
                )}
            </div>
        </div>,
        document.body
    );
};
