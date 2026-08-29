import React, { useState, useEffect, useMemo } from 'react';
import { X, QrCode, Copy, Check, Share2, Instagram, MessageCircle, Swords, Sparkles } from 'lucide-react';
import QRCode from 'qrcode';
import { encodeAthleteData } from '../../utils/shareEncoder';
import type { MeasurementRecord } from '../../types/measurements';
import type { ComparisonProfile } from '../../utils/athleteComparison';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    currentRecord?: MeasurementRecord;
    records?: MeasurementRecord[];
    userName?: string;
    sex?: 'male' | 'female';
    profileA: ComparisonProfile;
    profileB: ComparisonProfile;
    verdict: {
        scoreA: number;
        scoreB: number;
        summary: string;
        winner: string;
        vTaperA: number;
        vTaperB: number;
        geneticCeilingA: number;
        geneticCeilingB: number;
        bioA: { ffmi: number };
        bioB: { ffmi: number };
    };
}

export const ShareDuelModal: React.FC<Props> = ({
    isOpen,
    onClose,
    currentRecord,
    records = [],
    userName = 'Atleta',
    sex = 'male',
    profileA,
    profileB,
    verdict
}) => {
    const [qrUrl, setQrUrl] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [activeChannel, setActiveChannel] = useState<'social' | 'qr'>('social');

    // Build the visual Duel link
    const duelShareUrl = useMemo(() => {
        if (!isOpen || !currentRecord) return '';
        const athleteName = profileA.name || userName || 'Atleta';
        const encoded = encodeAthleteData(athleteName, currentRecord, sex, records);
        if (!encoded) return '';
        const origin = window.location.origin;
        const basePath = window.location.pathname.replace(/\/index\.html$/, '').replace(/\/+$/, '');
        return `${origin}${basePath}/#/share?data=${encoded}&tab=versus&rival=${profileB.id}`;
    }, [isOpen, currentRecord, profileA.name, userName, sex, records, profileB.id]);

    const socialShareText = useMemo(() => {
        const title = `⚔️ ¡DUELO HEAD-TO-HEAD!: ${profileA.name} vs ${profileB.name}`;
        const score = `🏆 Marcador: ${verdict.scoreA} a ${verdict.scoreB} (${verdict.summary})`;
        const details = `⚡ FFMI: ${verdict.bioA.ffmi} vs ${verdict.bioB.ffmi} | 📐 V-Taper: ${verdict.vTaperA.toFixed(2)}x vs ${verdict.vTaperB.toFixed(2)}x`;
        return `${title}\n${score}\n${details}\n\n👉 Mira la comparativa interactiva en vivo y rétenos en Hypertrophy Tracker:\n${duelShareUrl}`;
    }, [profileA.name, profileB.name, verdict, duelShareUrl]);

    useEffect(() => {
        if (!duelShareUrl) return;

        QRCode.toDataURL(duelShareUrl, {
            width: 260,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: {
                dark: '#0f172a',
                light: '#ffffff'
            }
        })
            .then(url => setQrUrl(url))
            .catch(err => console.error('Error generating Duel QR code:', err));
    }, [duelShareUrl]);

    if (!isOpen || !currentRecord) return null;

    const handleCopy = () => {
        if (!duelShareUrl) return;
        navigator.clipboard.writeText(duelShareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Duelo: ${profileA.name} vs ${profileB.name}`,
                    text: `⚔️ ¡Mira nuestro duelo antropométrico (${verdict.scoreA} a ${verdict.scoreB}) en Hypertrophy Tracker!:`,
                    url: duelShareUrl
                });
            } catch (err) {
                console.log('Share dismissed:', err);
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
            backgroundColor: 'rgba(0, 0, 0, 0.82)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(16, 22, 36, 0.98), rgba(9, 13, 22, 0.99))',
                border: '1.5px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '24px',
                maxWidth: '520px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(245, 158, 11, 0.2)',
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

                {/* Header Icon & Title */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(56, 189, 248, 0.2))',
                        border: '1px solid rgba(245, 158, 11, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fbbf24',
                        boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)'
                    }}>
                        <Swords size={24} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                        Compartir Duelo Head-to-Head
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)', maxWidth: '420px', lineHeight: 1.4 }}>
                        Comparte el enlace interactivo para que vean la comparativa visual completa dentro de la app.
                    </p>
                </div>

                {/* Matchup Summary Card */}
                <div style={{
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    borderRadius: '14px',
                    padding: '0.85rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem'
                }}>
                    <div style={{ textAlign: 'left', flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                            Tú ({profileA.name})
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            {verdict.scoreA} pts
                        </div>
                    </div>

                    <div style={{
                        padding: '0.25rem 0.6rem',
                        borderRadius: '8px',
                        background: 'rgba(245, 158, 11, 0.15)',
                        border: '1px solid rgba(245, 158, 11, 0.4)',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        color: '#fbbf24',
                        fontFamily: 'var(--font-mono)'
                    }}>
                        VS
                    </div>

                    <div style={{ textAlign: 'right', flex: 1 }}>
                        <div style={{ fontSize: '0.7rem', color: '#f43f5e', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                            {profileB.name}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            {verdict.scoreB} pts
                        </div>
                    </div>
                </div>

                {/* Tab Switcher: Direct Link vs QR */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '4px',
                    borderRadius: '12px',
                    width: '100%',
                    gap: '4px'
                }}>
                    <button
                        onClick={() => setActiveChannel('social')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeChannel === 'social' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                            color: activeChannel === 'social' ? '#fbbf24' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <Share2 size={15} />
                        <span>Link Interactivo & Redes</span>
                    </button>
                    <button
                        onClick={() => setActiveChannel('qr')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeChannel === 'qr' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
                            color: activeChannel === 'qr' ? '#fbbf24' : 'var(--text-secondary)',
                            fontWeight: 700,
                            fontSize: '0.82rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <QrCode size={15} />
                        <span>Código QR de Duelo</span>
                    </button>
                </div>

                {/* Channel 1: Link & Social Networks */}
                {activeChannel === 'social' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', width: '100%' }}>
                        {/* URL Box */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '0.4rem 0.5rem 0.4rem 0.85rem',
                            gap: '0.5rem'
                        }}>
                            <input
                                type="text"
                                readOnly
                                value={duelShareUrl}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#ffffff',
                                    fontSize: '0.8rem',
                                    fontFamily: 'var(--font-mono)',
                                    width: '100%',
                                    textOverflow: 'ellipsis'
                                }}
                            />
                            <button
                                onClick={handleCopy}
                                style={{
                                    background: copied ? '#10b981' : 'var(--primary-color)',
                                    color: copied ? '#ffffff' : '#030305',
                                    border: 'none',
                                    padding: '0.55rem 0.9rem',
                                    borderRadius: '8px',
                                    fontWeight: 800,
                                    fontSize: '0.8rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
                            </button>
                        </div>

                        {/* Social Buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', width: '100%' }}>
                            <button
                                onClick={handleWhatsAppShare}
                                style={{
                                    background: 'rgba(37, 211, 102, 0.15)',
                                    border: '1px solid rgba(37, 211, 102, 0.4)',
                                    color: '#25d366',
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <MessageCircle size={16} />
                                <span>WhatsApp</span>
                            </button>

                            <button
                                onClick={handleNativeShare}
                                style={{
                                    background: 'linear-gradient(135deg, rgba(225, 48, 108, 0.15), rgba(131, 58, 180, 0.15))',
                                    border: '1px solid rgba(225, 48, 108, 0.4)',
                                    color: '#f43f5e',
                                    padding: '0.75rem',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '0.82rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Instagram size={16} />
                                <span>Instagram / Redes</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Channel 2: QR Code */}
                {activeChannel === 'qr' && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.85rem',
                        width: '100%'
                    }}>
                        {qrUrl ? (
                            <div style={{
                                background: '#ffffff',
                                padding: '12px',
                                borderRadius: '16px',
                                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
                            }}>
                                <img
                                    src={qrUrl}
                                    alt="QR Duelo Head-to-Head"
                                    style={{ width: '180px', height: '180px', display: 'block' }}
                                />
                            </div>
                        ) : (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Generando código QR...
                            </div>
                        )}
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '340px' }}>
                            Escanea con la cámara de cualquier teléfono para abrir el duelo en vivo.
                        </p>
                    </div>
                )}

                {/* Conversion & Viral Note */}
                <div style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px dashed rgba(245, 158, 11, 0.35)',
                    borderRadius: '12px',
                    padding: '0.75rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    textAlign: 'left'
                }}>
                    <Sparkles size={18} style={{ color: '#fbbf24', flexShrink: 0 }} />
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
                        Quien abra el enlace verá la <strong style={{ color: '#ffffff' }}>interfaz visual completa</strong> y al final encontrará la opción para <strong style={{ color: '#fbbf24' }}>crear su cuenta gratis</strong> y retarte con sus propias medidas.
                    </div>
                </div>
            </div>
        </div>
    );
};
