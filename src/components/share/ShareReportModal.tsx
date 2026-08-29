import React, { useState, useEffect, useMemo } from 'react';
import { X, QrCode, Copy, Check, Share2, Instagram, MessageCircle, Sparkles } from 'lucide-react';
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
    const [activeChannel, setActiveChannel] = useState<'social' | 'qr'>('social');

    const shareUrl = useMemo(() => {
        if (!isOpen || !latestRecord) return '';
        const encoded = encodeAthleteData(userName, latestRecord, sex, records);
        const origin = window.location.origin;
        const basePath = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '');
        return `${origin}${basePath}/#/share?data=${encoded}`;
    }, [isOpen, latestRecord, userName, sex, records]);

    const socialShareText = useMemo(() => {
        const weight = latestRecord?.measurements?.weight ? `${latestRecord.measurements.weight}kg` : '';
        return `📊 Mira mi evolución física y ratios antropométricos en Hypertrophy Tracker (${userName} ${weight}):\n${shareUrl}`;
    }, [userName, latestRecord, shareUrl]);

    useEffect(() => {
        if (!shareUrl) return;

        QRCode.toDataURL(shareUrl, {
            width: 260,
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
        setTimeout(() => setCopied(false), 2200);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Ficha Antropométrica de ${userName}`,
                    text: `📊 Mira mi evolución física y proporciones áureas en Hypertrophy Tracker:`,
                    url: shareUrl
                });
            } catch (err) {
                // User cancelled or share failed
                console.log('Share dismissed or not supported:', err);
            }
        } else {
            handleCopy();
        }
    };

    const handleWhatsAppShare = () => {
        const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(socialShareText)}`;
        window.open(url, '_blank');
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(16, 22, 36, 0.98), rgba(9, 13, 22, 0.99))',
                border: '1.5px solid rgba(245, 158, 11, 0.35)',
                borderRadius: '24px',
                maxWidth: '520px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8), 0 0 35px rgba(245, 158, 11, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '1.25rem',
                position: 'relative'
            }}>
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
                        width: '34px',
                        height: '34px',
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
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(56, 189, 248, 0.2))',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fbbf24',
                        boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)'
                    }}>
                        <Share2 size={24} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                        Compartir Perfil & Medición
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)', maxWidth: '400px', lineHeight: 1.4 }}>
                        Publica tu enlace en <strong style={{ color: '#fbbf24' }}>Instagram Stories, Bio o WhatsApp</strong> para mostrar tu progreso con telemetría visual.
                    </p>
                </div>

                {/* Mode Selector Tabs */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(0, 0, 0, 0.4)',
                    padding: '4px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    width: '100%'
                }}>
                    <button
                        onClick={() => setActiveChannel('social')}
                        style={{
                            flex: 1,
                            padding: '0.55rem 0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeChannel === 'social' ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'transparent',
                            color: activeChannel === 'social' ? '#0f172a' : '#94a3b8',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Instagram size={15} />
                        <span>Instagram & Redes</span>
                    </button>

                    <button
                        onClick={() => setActiveChannel('qr')}
                        style={{
                            flex: 1,
                            padding: '0.55rem 0.75rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeChannel === 'qr' ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'transparent',
                            color: activeChannel === 'qr' ? '#0f172a' : '#94a3b8',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.78rem',
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
                        <span>Código QR / Coach</span>
                    </button>
                </div>

                {activeChannel === 'social' ? (
                    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                        {/* Native Share Button on Mobile if available */}
                        {typeof navigator !== 'undefined' && 'share' in navigator && (
                            <button
                                onClick={handleNativeShare}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.85rem',
                                    borderRadius: '14px',
                                    fontSize: '0.9rem',
                                    fontWeight: 900,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Share2 size={18} />
                                <span>Compartir a Instagram Stories / Redes</span>
                            </button>
                        )}

                        {/* WhatsApp Quick Share Button */}
                        <button
                            onClick={handleWhatsAppShare}
                            style={{
                                width: '100%',
                                padding: '0.8rem',
                                borderRadius: '14px',
                                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                                color: '#ffffff',
                                border: 'none',
                                fontSize: '0.85rem',
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 800,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                            }}
                        >
                            <MessageCircle size={18} />
                            <span>Enviar por WhatsApp</span>
                        </button>

                        {/* Copy Link Input Strip */}
                        <div style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: 'rgba(0, 0, 0, 0.5)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '14px',
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
                                    fontSize: '0.75rem',
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
                                    fontSize: '0.75rem',
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

                        <div style={{
                            padding: '0.65rem 0.85rem',
                            borderRadius: '12px',
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            fontSize: '0.75rem',
                            color: '#e2e8f0',
                            textAlign: 'left',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '6px'
                        }}>
                            <Sparkles size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                            <span>
                                <strong>Tip para Instagram:</strong> Pega este link en el sticker <em>"Enlace / Link"</em> de tu historia o en tu biografía. ¡Tus seguidores podrán ver tu silueta 360° y retarte en duelo!
                            </span>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
                        {/* QR Code Container */}
                        {qrUrl ? (
                            <div style={{
                                padding: '0.85rem',
                                background: '#ffffff',
                                borderRadius: '18px',
                                boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6), 0 0 25px rgba(245, 158, 11, 0.25)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <img src={qrUrl} alt="Código QR Ficha de Atleta" style={{ width: '200px', height: '200px', display: 'block' }} />
                            </div>
                        ) : (
                            <div style={{ width: '200px', height: '200px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                Generando QR...
                            </div>
                        )}

                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                            Tu preparador físico puede escanear este QR en el gym para auditar tus medidas en vivo.
                        </p>

                        <button
                            onClick={handleCopy}
                            className="btn-secondary"
                            style={{ width: '100%', padding: '0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            {copied ? <Check size={14} /> : <Copy size={14} />}
                            <span>{copied ? '¡Enlace Copiado!' : 'Copiar Enlace Directo'}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
