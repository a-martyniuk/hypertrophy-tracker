import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import muscleMapImg from '../../assets/muscle_map.png';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
}

export const MapModal = ({ isOpen, onClose, title }: Props) => {
    return (
        <AnimatePresence>
            {isOpen && createPortal(
                <div className="modal-overlay glass-overlay" onClick={onClose}>
                    <motion.div
                        className="map-modal glass animate-fade-in"
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="modal-header">
                            <h3>{title}</h3>
                            <button className="btn-close" onClick={onClose}>
                                <X size={20} />
                            </button>
                        </header>
                        <div className="modal-content">
                            <img src={muscleMapImg} alt={title} className="muscle-map-image" />
                        </div>
                    </motion.div>

                    <style>{`
            .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: rgba(0, 0, 0, 0.8);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 10000;
              backdrop-filter: blur(10px);
              padding: 2rem;
            }

            .map-modal {
              width: 100%;
              max-width: 600px;
              max-height: 90vh;
              display: flex;
              flex-direction: column;
              border-radius: 20px;
              border: 1px solid var(--border-color);
              overflow: hidden;
              background: rgba(13, 13, 15, 0.95);
              box-shadow: 0 0 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.1);
            }

            .modal-header {
              padding: 1.25rem 1.5rem;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 1px solid var(--border-color);
              background: rgba(255, 255, 255, 0.05);
            }

            .modal-header h3 {
              font-size: 1.1rem;
              color: var(--primary-color);
              margin: 0;
              letter-spacing: 0.5px;
            }

            .btn-close {
              background: transparent;
              border: none;
              color: var(--text-secondary);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 5px;
              border-radius: 8px;
              transition: all 0.2s ease;
            }

            .btn-close:hover {
              background: rgba(255, 255, 255, 0.1);
              color: white;
            }

            .modal-content {
              padding: 1.5rem;
              overflow-y: auto;
              display: flex;
              justify-content: center;
              align-items: center;
              background: radial-gradient(circle at center, rgba(245, 158, 11, 0.05) 0%, transparent 80%);
            }

            .muscle-map-image {
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
              border: 1px solid rgba(255, 255, 255, 0.05);
            }

            @media (max-width: 600px) {
              .modal-overlay {
                padding: 1rem;
              }
              .map-modal {
                max-width: 100%;
              }
            }
          `}</style>
                </div>,
                document.body
            )}
        </AnimatePresence>
    );
};
