import { Save, X, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    isSaving: boolean;
    onCancel: () => void;
}

export const FormActions = ({ isSaving, onCancel }: Props) => {
    const { t } = useTranslation();
    return (
        <div className="form-actions glass">
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSaving}>
                <X size={18} /> {t('common.form.btn_cancel')}
            </button>
            <button type="submit" className="btn-primary" disabled={isSaving}>
                {isSaving ? (
                    <>
                        <Activity size={18} className="animate-spin" /> {t('common.form.saving')}
                    </>
                ) : (
                    <>
                        <Save size={18} /> {t('common.form.btn_confirm')}
                    </>
                )}
            </button>
        </div>
    );
};
