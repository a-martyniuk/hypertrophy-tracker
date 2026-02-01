import React, { useState } from 'react'

interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  width?: string
  containerStyle?: React.CSSProperties
}

export function Tooltip({ content, children, position = 'top', width = 'max-content', containerStyle = {} }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  const show = () => setIsVisible(true)
  const hide = () => setIsVisible(false)

  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={() => setIsVisible(!isVisible)} // Mobile toggle
      style={{ position: 'relative', display: 'inline-flex', ...containerStyle }}
    >
      {children}

      {isVisible && (
        <div className={`tooltip-content ${position}`}>
          {content}
          <div className="tooltip-arrow" />
        </div>
      )}

      <style>{`
        .tooltip-content {
          position: absolute;
          background: rgba(13, 13, 15, 0.95);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          color: var(--text-primary);
          padding: 0.5rem 0.8rem;
          border-radius: 8px;
          font-size: 0.75rem;
          z-index: 1000;
          border: 1px solid var(--border-color);
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          width: ${width};
          max-width: 250px;
          pointer-events: none;
          line-height: 1.4;
          animation: tooltipFade 0.2s ease-out;
        }

        .tooltip-content.top {
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
        }

        .tooltip-content.bottom {
          top: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(8px);
        }

        .tooltip-content.left {
          right: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(-8px);
        }

        .tooltip-content.right {
          left: 100%;
          top: 50%;
          transform: translateY(-50%) translateX(8px);
        }

        @keyframes tooltipFade {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }

        /* Adjust transform for animation depending on position to keep centering */
        .tooltip-content.top { animation-name: fadeTop; }
        @keyframes fadeTop { from { opacity: 0; transform: translateX(-50%) translateY(0); } to { opacity: 1; transform: translateX(-50%) translateY(-8px); } }

        .tooltip-content.bottom { animation-name: fadeBottom; }
        @keyframes fadeBottom { from { opacity: 0; transform: translateX(-50%) translateY(0); } to { opacity: 1; transform: translateX(-50%) translateY(8px); } }
      `}</style>
    </div>
  )
}
