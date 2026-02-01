import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Share2, Check, Loader2, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { HudButton } from './ui/HudButton';
import type { MeasurementRecord } from '../types/measurements';

interface Props {
    beforeRecord?: MeasurementRecord;
    afterRecord?: MeasurementRecord;
    userName?: string;
}

export const SocialShare = ({ beforeRecord, afterRecord, userName = 'ATHLETE' }: Props) => {
    const { t } = useTranslation();
    const cardRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<'idle' | 'generating' | 'success'>('idle');

    const handleShare = async () => {
        if (!cardRef.current) return;

        setStatus('generating');
        try {
            const dataUrl = await toPng(cardRef.current, {
                quality: 0.95,
                pixelRatio: 2,
                backgroundColor: '#030305'
            });

            const link = document.createElement('a');
            link.download = `progress-card-${new Date().getTime()}.png`;
            link.href = dataUrl;
            link.click();

            setStatus('success');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error('Failed to generate image', err);
            setStatus('idle');
        }
    };

    if (!beforeRecord || !afterRecord) return null;

    const beforePhoto = beforeRecord.photos?.find(p => p.angle === 'front')?.url;
    const afterPhoto = afterRecord.photos?.find(p => p.angle === 'front')?.url;

    if (!beforePhoto || !afterPhoto) return null;

    return (
        <div className="social-share-container">
            <HudButton
                onClick={handleShare}
                variant="primary"
                className="w-full"
                disabled={status === 'generating'}
            >
                {status === 'generating' ? <Loader2 className="animate-spin" size={18} /> : (status === 'success' ? <Check size={18} /> : <Share2 size={18} />)}
                {status === 'generating' ? t('common.sharing.generating') : (status === 'success' ? t('common.sharing.saved') : t('common.sharing.btn'))}
            </HudButton>

            {/* Hidden Card for export */}
            <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
                <div
                    ref={cardRef}
                    className="shareable-card-capture"
                    style={{
                        width: '1080px',
                        height: '1350px', // Instagram Portrait
                        backgroundColor: '#030305',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '60px',
                        color: 'white',
                        fontFamily: "'Inter', sans-serif"
                    }}
                >
                    {/* Header */}
                    <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                        <div>
                            <h2 style={{ fontSize: '48px', margin: 0, letterSpacing: '2px', color: '#f59e0b' }}>HYPERTROPHY</h2>
                            <p style={{ fontSize: '24px', opacity: 0.6, margin: 0 }}>PROGRESS REPORT // {userName}</p>
                        </div>
                        <Sparkles size={48} color="#f59e0b" />
                    </header>

                    {/* Photos */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', flex: 1, marginBottom: '40px' }}>
                        <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.1)' }}>
                            <img src={beforePhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Before" />
                            <div style={{ position: 'absolute', bottom: '30px', left: '30px', background: 'rgba(0,0,0,0.8)', padding: '10px 20px', borderRadius: '12px', fontSize: '24px' }}>
                                {new Date(beforeRecord.date).toLocaleDateString()}
                            </div>
                        </div>
                        <div style={{ position: 'relative', borderRadius: '24px', overflow: 'hidden', border: '2px solid #f59e0b' }}>
                            <img src={afterPhoto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="After" />
                            <div style={{ position: 'absolute', bottom: '30px', left: '30px', background: '#f59e0b', color: 'black', fontWeight: 'bold', padding: '10px 20px', borderRadius: '12px', fontSize: '24px' }}>
                                {new Date(afterRecord.date).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        {[
                            { label: 'WEIGHT', val: `${afterRecord.measurements.weight}kg`, diff: (afterRecord.measurements.weight - beforeRecord.measurements.weight).toFixed(1) },
                            { label: 'WAIST', val: `${afterRecord.measurements.waist}cm`, diff: (afterRecord.measurements.waist - beforeRecord.measurements.waist).toFixed(1) },
                            { label: 'BICEPS', val: `${afterRecord.measurements.arm.right}cm`, diff: (afterRecord.measurements.arm.right - beforeRecord.measurements.arm.right).toFixed(1) }
                        ].map((s, i) => (
                            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', padding: '30px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <label style={{ fontSize: '18px', color: '#888', marginBottom: '10px', display: 'block' }}>{s.label}</label>
                                <div style={{ fontSize: '36px', fontWeight: 'bold' }}>{s.val}</div>
                                <div style={{ color: parseFloat(s.diff) > 0 ? '#f59e0b' : '#ef4444', fontSize: '20px', marginTop: '5px' }}>
                                    {parseFloat(s.diff) > 0 ? '+' : ''}{s.diff}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <footer style={{ marginTop: 'auto', display: 'flex', justifyContent: 'center', opacity: 0.4 }}>
                        <p style={{ fontSize: '18px' }}>POWERED BY HYPERTROPHY-TRACKER.COM</p>
                    </footer>
                </div>
            </div>

            <style>{`
                .social-share-container {
                    margin-top: 1rem;
                }
            `}</style>
        </div>
    );
};
