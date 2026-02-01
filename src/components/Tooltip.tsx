import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string | React.ReactNode
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  width?: string
  containerStyle?: React.CSSProperties
}

export function Tooltip({ content, children, position = 'top', width = 'max-content', containerStyle = {} }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const anchorRef = React.useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      let top = 0
      let left = 0

      // Basic positioning logic vs viewport
      switch (position) {
        case 'top':
          top = rect.top + window.scrollY - 8
          left = rect.left + window.scrollX + rect.width / 2
          break
        case 'bottom':
          top = rect.bottom + window.scrollY + 8
          left = rect.left + window.scrollX + rect.width / 2
          break
        case 'left':
          top = rect.top + window.scrollY + rect.height / 2
          left = rect.left + window.scrollX - 8
          break
        case 'right':
          top = rect.top + window.scrollY + rect.height / 2
          left = rect.right + window.scrollX + 8
          break
      }
      setCoords({ top, left })
    }
  }

  const show = () => {
    updatePosition()
    setIsVisible(true)
  }

  const hide = () => setIsVisible(false)

  // Recalculate if scrolled or resized while visible
  useEffect(() => {
    if (isVisible) {
      window.addEventListener('scroll', updatePosition)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isVisible])

  return (
    <div
      ref={anchorRef}
      className="tooltip-wrapper"
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={() => setIsVisible(!isVisible)} // Mobile toggle
      style={{ position: 'relative', display: 'inline-flex', cursor: 'pointer', ...containerStyle }}
    >
      {children}

      {isVisible && createPortal(
        <div
          className={`tooltip-portal-content ${position}`}
          style={{
            top: coords.top,
            left: coords.left,
            width: width === 'max-content' ? 'auto' : width,
            maxWidth: '250px'
          }}
        >
          {content}
          <div className={`tooltip-arrow-portal ${position}`} />
          <style>{`
            .tooltip-portal-content {
              position: absolute;
              background: rgba(13, 13, 15, 0.95);
              backdrop-filter: blur(10px);
              -webkit-backdrop-filter: blur(10px);
              color: var(--text-primary);
              padding: 0.6rem 0.9rem;
              border-radius: 8px;
              font-size: 0.8rem;
              z-index: 9999; /* Portal moves it to body, ensuring top z-index */
              border: 1px solid var(--border-color);
              box-shadow: 0 4px 20px rgba(0,0,0,0.6);
              pointer-events: none;
              line-height: 1.5;
              animation: tooltipFade 0.2s ease-out;
            }

            .tooltip-portal-content.top { transform: translateX(-50%) translateY(-100%); }
            .tooltip-portal-content.bottom { transform: translateX(-50%) translateY(0); }
            .tooltip-portal-content.left { transform: translateX(-100%) translateY(-50%); }
            .tooltip-portal-content.right { transform: translateX(0) translateY(-50%); }

            @keyframes tooltipFade {
              from { opacity: 0; transform: scale(0.98); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>,
        document.body
      )}
    </div>
  )
}
