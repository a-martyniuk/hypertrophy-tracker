import { useState } from 'react';
import { Camera, X } from 'lucide-react';
import { useStorage } from '../hooks/useStorage';
import type { BodyPhoto, PhotoAngle } from '../types/measurements';

interface Props {
  userId: string;
  recordId: string;
  existingPhotos?: BodyPhoto[];
  onPhotosUpdated: (photos: BodyPhoto[]) => void;
}

export const PhotoUpload = ({ userId, recordId, existingPhotos = [], onPhotosUpdated }: Props) => {
  const { uploadPhoto, deletePhoto } = useStorage();
  const [uploading, setUploading] = useState<PhotoAngle | null>(null);

  const angles: PhotoAngle[] = ['front', 'side', 'back'];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, angle: PhotoAngle) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(angle);
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
    }
    setUploading(null);
  };

  const removePhoto = async (photo: BodyPhoto) => {
    // Extract path from URL (Supabase path is typically at the end)
    const urlParts = photo.url.split('body_photos/');
    const path = urlParts[1];

    if (path) {
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
          const angleLabels: Record<string, string> = {
            front: 'Frente',
            side: 'Perfil',
            back: 'Espalda'
          };

          return (
            <div key={angle} className={`photo-slot glass ${photo ? 'has-photo' : ''}`}>
              <div className="slot-label capitalize">{angleLabels[angle]}</div>

              {photo ? (
                <div className="photo-preview">
                  <img src={photo.url} alt={angle} />
                  <button className="btn-remove" onClick={() => removePhoto(photo)}>
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <label className="upload-trigger">
                  {uploading === angle ? (
                    <div className="spinner animate-spin"></div>
                  ) : (
                    <>
                      <Camera size={24} />
                      <span>Subir Foto</span>
                    </>
                  )}
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
        .spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--primary-color);
          border-top-color: transparent;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};
