import { PhotoUpload } from '../PhotoUpload';
import type { BodyPhoto } from '../../types/measurements';

interface Props {
    userId: string;
    recordId: string;
    existingPhotos: BodyPhoto[];
    onPhotosUpdated: (photos: BodyPhoto[]) => void;
}

export const PhotoUploadSection = ({ userId, recordId, existingPhotos, onPhotosUpdated }: Props) => {
    return (
        <section className="form-section photos-section glass">
            <h3>Fotos de Progreso</h3>
            <PhotoUpload
                userId={userId}
                recordId={recordId}
                existingPhotos={existingPhotos}
                onPhotosUpdated={onPhotosUpdated}
            />
        </section>
    );
};
