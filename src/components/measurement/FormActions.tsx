import { Save, X, Activity } from 'lucide-react';

interface Props {
    isSaving: boolean;
    onCancel: () => void;
}

export const FormActions = ({ isSaving, onCancel }: Props) => {
    return (
        <div className="form-actions glass">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
                <X size={18} /> Salir
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? (
                    <>
                        <Activity size={18} className="animate-spin" /> Guardando...
                    </>
                ) : (
                    <>
                        <Save size={18} /> Confirmar Registro
                    </>
                )}
            </button>
        </div>
    );
};
