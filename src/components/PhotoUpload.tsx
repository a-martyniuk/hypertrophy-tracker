import { useState, useEffect } from 'react';
import { Camera, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useStorage } from '../hooks/useStorage';
import { useToast } from './ui/ToastProvider';
import type { BodyPhoto, PhotoAngle } from '../types/measurements';

const BUCKET_NAME = 'BODY_PHOTOS';

interface Props {
  userId: string;
  recordId: string;
  existingPhotos?: BodyPhoto[];
  onPhotosUpdated: (photos: BodyPhoto[]) => void;
}

export const PhotoUpload = ({ userId, recordId, existingPhotos = [], onPhotosUpdated }: Props) => {
  const { t } = useTranslation();
  const { uploadPhoto, deletePhoto } = useStorage();
  const { addToast } = useToast();
  const [uploading, setUploading] = useState<PhotoAngle | null>(null);
  const [localPreviews, setLocalPreviews] = useState<Record<string, string>>({});

  const angles: PhotoAngle[] = ['front', 'side', 'back'];

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(localPreviews).forEach(url => URL.revokeObjectURL(url));
    };
  }, [localPreviews]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, angle: PhotoAngle) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create local preview immediately
    const previewUrl = URL.createObjectURL(file);
    setLocalPreviews(prev => ({ ...prev, [angle]: previewUrl }));

    setUploading(angle);
    try {
      const fileName = `${userId}/${recordId}/${angle}_${Date.now()}.jpg`;
      const url = await uploadPhoto(file, fileName);

      if (url) {
        const newPhoto: BodyPhoto = {
          id: crypto.randomUUID(),
          url,
          angle,
          createdAt: new Date().toISOString()
        };

        const updatedPhotos = [...existingPhotos.filter(p => p.angle !== angle), newPhoto];
        onPhotosUpdated(updatedPhotos);

        // Remove local preview once remote is ready
        setLocalPreviews(prev => {
          const next = { ...prev };
          delete next[angle];
          return next;
        });
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      // More specific error for common setup issues
      const msg = err.message?.includes('bucket') || err.message?.includes('not found')
        ? 'Error: Cubeta "body_photos" no configurada'
        : t('common.error');
      addToast(msg, 'error');

      setLocalPreviews(prev => {
        const next = { ...prev };
        delete next[angle];
        return next;
      });
    } finally {
      setUploading(null);
    }
  };

  const removePhoto = async (photo: BodyPhoto) => {
    // Extract path from URL - more robust parsing
    // Split by the bucket name regardless of case if possible, or just the known structure
    const searchStr = `${BUCKET_NAME}/`;
    const lowerUrl = photo.url.toLowerCase();
    const index = lowerUrl.indexOf(searchStr.toLowerCase());

    if (index !== -1) {
      const path = photo.url.substring(index + searchStr.length);
      await deletePhoto(path);
      const updatedPhotos = existingPhotos.filter(p => p.id !== photo.id);
      onPhotosUpdated(updatedPhotos);
    }
  };

  return (
    <div className="photo-upload-section">
      <div className="angles-grid">
        {angles.map(angle => {
          const photo = existingPhotos.find(p => p.angle === angle);
          const previewUrl = localPreviews[angle];
          const isUploading = uploading === angle;

          const angleLabels: Record<string, string> = {
            front: t('compare.angles.front'),
            side: t('compare.angles.side'),
            back: t('compare.angles.back')
          };

          return (
            <div key={angle} className={`photo-slot glass ${(photo || previewUrl) ? 'has-photo' : ''}`}>
              <div className="slot-label capitalize">{angleLabels[angle]}</div>

              {(photo || previewUrl) ? (
                <div className="photo-preview">
                  <img src={previewUrl || photo?.url} alt={angle} className={isUploading ? 'preview-loading' : ''} />
                  {isUploading && (
                    <div className="preview-overlay">
                      <div className="spinner animate-spin"></div>
                    </div>
                  )}
                  {photo && !isUploading && (
                    <button className="btn-remove" onClick={() => removePhoto(photo)}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ) : (
                <label className="upload-trigger">
                  <Camera size={24} />
                  <span>{t('common.form.upload_photo')}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, angle)}
                    disabled={!!uploading}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .photo-upload-section {
          margin-top: 1rem;
        }
        .angles-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        @media (max-width: 600px) {
          .angles-grid {
             grid-template-columns: repeat(2, 1fr);
          }
        }
        .photo-slot {
          aspect-ratio: 3/4;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px dashed rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        .photo-slot.has-photo {
          border-style: solid;
          border-color: rgba(245, 158, 11, 0.3);
        }
        .slot-label {
          position: absolute;
          top: 8px;
          left: 8px;
          font-size: 0.6rem;
          color: var(--text-secondary);
          z-index: 10;
          background: rgba(0, 0, 0, 0.5);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .photo-preview {
          width: 100%;
          height: 100%;
          position: relative;
        }
        .photo-preview img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .btn-remove {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(239, 68, 68, 0.8);
          border: none;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .upload-trigger {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
          cursor: pointer;
          width: 100%;
          height: 100%;
          justify-content: center;
        }
        .upload-trigger input {
          display: none;
        }
        .upload-trigger:hover {
          color: var(--primary-color);
          background: rgba(245, 158, 11, 0.05);
        }
        .photo-preview img.preview-loading {
          opacity: 0.5;
          filter: grayscale(1);
        }
        .preview-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 0, 0, 0.3);
          z-index: 5;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--primary-color);
          border-top-color: transparent;
          border-radius: 50%;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.3);
        }
      `}</style>
    </div>
  );
};
