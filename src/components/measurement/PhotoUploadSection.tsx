import { PhotoUpload } from '../PhotoUpload';
import type { BodyPhoto } from '../../types/measurements';

interface Props {
    userId: string;
    recordId: string;
    existingPhotos: BodyPhoto[];
    onPhotosUpdated: (photos: BodyPhoto[]) => void;
}

import { useTranslation } from 'react-i18next';

export const PhotoUploadSection = ({ userId, recordId, existingPhotos, onPhotosUpdated }: Props) => {
    const { t } = useTranslation();
    return (
        <section className="form-section photos-section glass">
            <h3>{t('common.form.photos_title')}</h3>
            <PhotoUpload
                userId={userId}
                recordId={recordId}
                existingPhotos={existingPhotos}
                onPhotosUpdated={onPhotosUpdated}
            />
        </section>
    );
};
