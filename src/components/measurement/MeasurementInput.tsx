import type { BilateralMeasurement } from '../../types/measurements';


interface Props {
    label: string;
    value: number | BilateralMeasurement;
    onChange: (val: any) => void;
    id?: string;
    previousValue?: number | BilateralMeasurement;
    className?: string;
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
    className
}: Props) => {
    // Robust check: any non-null object is treated as bilateral to prevent [object Object] rendering
    const isDouble = typeof value === 'object' && value !== null;

    if (isDouble) {
        const val = value as BilateralMeasurement;
        const prev = previousValue as BilateralMeasurement | undefined;
        return (
            <div className={`hud-input-group-double ${className || ''}`} id={id}>
                <div className="hud-label-row">
                    <label>{label}</label>
                    <div className="trends">
                        <TrendIndicator current={val.left || 0} previous={prev?.left} />
                        <TrendIndicator current={val.right || 0} previous={prev?.right} />
                    </div>
                </div>
                <div className="hud-double-inputs">
                    <input
                        type="number"
                        placeholder="Izq"
                        className="hud-input-l"
                        min="0"
                        value={val.left || ''}
                        onChange={(e) => onChange({ ...val, left: parseFloat(e.target.value) || 0 })}
                    />
                    <input
                        type="number"
                        placeholder="Der"
                        className="hud-input-r"
                        min="0"
                        value={val.right || ''}
                        onChange={(e) => onChange({ ...val, right: parseFloat(e.target.value) || 0 })}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className={`hud-input-group ${className || ''}`} id={id}>
            <div className="hud-label-row">
                <label>{label}</label>
                <TrendIndicator current={value as number} previous={previousValue as number} />
            </div>
            <input
                type="number"
                min="0"
                value={(value as number) || ''}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            />
        </div>
    );
};
