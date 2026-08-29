import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, QrCode, Copy, Check, Share2, Link as LinkIcon } from 'lucide-react';
import QRCode from 'qrcode';
import { encodeAthleteData } from '../../utils/shareEncoder';
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
    const [activeTab, setActiveTab] = useState<'link' | 'qr'>('link');

    const shareUrl = useMemo(() => {
        if (!isOpen || !latestRecord) return '';
        const encoded = encodeAthleteData(userName, latestRecord, sex, records);
        const origin = window.location.origin;
        const basePath = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '');
        return `${origin}${basePath}/#/share?data=${encoded}`;
    }, [isOpen, latestRecord, userName, sex, records]);

    useEffect(() => {
        if (!shareUrl) return;

        QRCode.toDataURL(shareUrl, {
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
    }, [shareUrl]);

    if (!isOpen || !latestRecord) return null;

    const handleCopy = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleNativeShare = async () => {
        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: `Ficha de ${userName} - Hypertrophy Tracker`,
                    text: `Evolución física y biometría interactiva:`,
                    url: shareUrl
                });
            } catch (err) {
                console.log('Share dismissed:', err);
            }
        } else {
            handleCopy();
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
                        {/* URL input + Copy */}
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
                                    fontSize: '0.78rem',
                                    fontFamily: 'var(--font-mono)',
                                    outline: 'none',
                                    textOverflow: 'ellipsis'
                                }}
                            />
                            <button
                                onClick={handleCopy}
                                className="btn-primary"
                                style={{
                                    padding: '0.55rem 0.95rem',
                                    fontSize: '0.78rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                            </button>
                        </div>

                        {/* Native Share button if supported */}
                        {hasNativeShare && (
                            <button
                                onClick={handleNativeShare}
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
                                    gap: '8px'
                                }}
                            >
                                <Share2 size={16} />
                                <span>Compartir...</span>
                            </button>
                        )}
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
                            onClick={handleCopy}
                            className="btn-secondary"
                            style={{ width: '100%', padding: '0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
