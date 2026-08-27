import React, { useState, useEffect, useMemo } from 'react';
import { X, QrCode, Copy, Check } from 'lucide-react';
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

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(16, 20, 31, 0.98), rgba(9, 12, 18, 0.99))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '20px',
                maxWidth: '480px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.1)',
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
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={16} />
                </button>

                {/* Header */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                        <QrCode size={22} />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                        Compartir Ficha con Entrenador
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)', maxWidth: '360px' }}>
                        Tu preparador físico o entrenador puede escanear este código QR o abrir el enlace para auditar tus medidas en vivo sin necesidad de crear cuenta.
                    </p>
                </div>

                {/* QR Code Container */}
                {qrUrl ? (
                    <div style={{
                        padding: '0.85rem',
                        background: '#ffffff',
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.2)',
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

                {/* Copy Link Input Strip */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(0, 0, 0, 0.4)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
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
                            padding: '0.5rem 0.85rem',
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
            </div>
        </div>
    );
};
