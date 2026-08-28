import { HelpCircle } from 'lucide-react';
import { Tooltip } from '../Tooltip';
import type { BilateralMeasurement } from '../../types/measurements';

export const ANATOMICAL_GUIDES: Record<string, string> = {
    neck: 'Mide justo por debajo de la nuez de Adán manteniendo el cuello recto y relajado.',
    pecho: 'Pasa la cinta métrica horizontalmente a la altura de los pezones con respiración neutra.',
    back: 'Mide cruzando por debajo de las axilas y los dorsales en su punto de máxima apertura.',
    waist: 'Mide en el punto más estrecho del abdomen (o sobre el ombligo), sin apretar ni meter panza.',
    hips: 'Mide en la zona de mayor volumen de los glúteos manteniendo los pies juntos.',
    arm: 'Mide en la cúspide más alta del bíceps flexionado a 90° con contracción máxima.',
    forearm: 'Mide en la parte más ancha del antebrazo con la mano cerrada en puño.',
    wrist: 'Mide en la parte más estrecha justo antes de la mano (chasis óseo de referencia).',
    thigh: 'Mide en la zona más ancha del cuádriceps de pie con el peso repartido en ambas piernas.',
    calf: 'Mide en la máxima circunferencia del gemelo/pantorrilla de pie.',
    ankle: 'Mide en la parte más fina justo por encima de los huesos del tobillo (maléolos).'
};

interface Props {
    label: string;
    value: number | BilateralMeasurement;
    onChange: (val: any) => void;
    id?: string;
    previousValue?: number | BilateralMeasurement;
    className?: string;
    tooltip?: string;
    onFocus?: () => void;
    onBlur?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

const TrendIndicator = ({ current, previous }: { current: number; previous?: number }) => {
    if (!previous || current === 0) return null;
    const diff = current - previous;
    if (Math.abs(diff) < 0.1) return <span className="trend-eq">=</span>;
    return diff > 0 ?
        <span className="trend-up">↑ {diff.toFixed(1)}</span> :
        <span className="trend-down">↓ {Math.abs(diff).toFixed(1)}</span>;
};

export const MeasurementInput = ({
    label,
    value,
    onChange,
    id,
    previousValue,
    className,
    tooltip,
    onFocus,
    onBlur,
    onMouseEnter,
    onMouseLeave
}: Props) => {
    // Robust check: any non-null object is treated as bilateral to prevent [object Object] rendering
    const isDouble = typeof value === 'object' && value !== null;

    // Resolve guide text from id or prop
    const cleanId = id?.replace('input-', '') || '';
    const guideText = tooltip || (cleanId && ANATOMICAL_GUIDES[cleanId]);

    if (isDouble) {
        const val = value as BilateralMeasurement;
        const prev = previousValue as BilateralMeasurement | undefined;
        return (
            <div
                className={`hud-input-group-double ${className || ''}`}
                id={id}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div className="hud-label-row">
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span>{label}</span>
                        {guideText && (
                            <Tooltip content={guideText} position="top" width="220px">
                                <HelpCircle size={13} style={{ opacity: 0.6, cursor: 'help', color: 'var(--primary-color)' }} />
                            </Tooltip>
                        )}
                    </label>
                    <div className="trends">
                        <TrendIndicator current={val.left || 0} previous={prev?.left} />
                        <TrendIndicator current={val.right || 0} previous={prev?.right} />
                    </div>
                </div>
                <div className="hud-double-inputs">
                    <div className="hud-input-col">
                        <div className="side-badge left" title="Tu extremidad izquierda (Perspectiva anatómica propia)">
                            <span>IZQ</span>
                            <span className="side-code">(L)</span>
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            placeholder="0.0"
                            className="hud-input-l"
                            min="0"
                            value={val.left || ''}
                            onChange={(e) => onChange({ ...val, left: parseFloat(e.target.value) || 0 })}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            title="Tu extremidad izquierda (Perspectiva anatómica propia)"
                        />
                    </div>
                    <div className="hud-input-col">
                        <div className="side-badge right" title="Tu extremidad derecha (Perspectiva anatómica propia)">
                            <span>DER</span>
                            <span className="side-code">(R)</span>
                        </div>
                        <input
                            type="number"
                            step="0.1"
                            inputMode="decimal"
                            placeholder="0.0"
                            className="hud-input-r"
                            min="0"
                            value={val.right || ''}
                            onChange={(e) => onChange({ ...val, right: parseFloat(e.target.value) || 0 })}
                            onFocus={onFocus}
                            onBlur={onBlur}
                            title="Tu extremidad derecha (Perspectiva anatómica propia)"
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`hud-input-group ${className || ''}`}
            id={id}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div className="hud-label-row">
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span>{label}</span>
                    {guideText && (
                        <Tooltip content={guideText} position="top" width="220px">
                            <HelpCircle size={13} style={{ opacity: 0.6, cursor: 'help', color: 'var(--primary-color)' }} />
                        </Tooltip>
                    )}
                </label>
                <TrendIndicator current={value as number} previous={previousValue as number} />
            </div>
            <input
                type="number"
                step="0.1"
                inputMode="decimal"
                min="0"
                value={(value as number) || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        </div>
    );
};
