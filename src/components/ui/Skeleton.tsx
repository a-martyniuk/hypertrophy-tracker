import React from 'react';

interface SkeletonProps {
    className?: string;
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
}

export const Skeleton = ({ className = '', width, height, style }: SkeletonProps) => {
    return (
        <div
            className={`skeleton-loader ${className}`}
            style={{
                width,
                height,
                ...style
            }}
        />
    );
};

/* CSS Style injected via style tag in component or global CSS */
export const SkeletonStyles = `
  .skeleton-loader {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
    animation: skeleton-pulse 1.5s infinite ease-in-out;
  }

  @keyframes skeleton-pulse {
    0% { opacity: 0.6; background: rgba(255, 255, 255, 0.05); }
    50% { opacity: 1; background: rgba(255, 255, 255, 0.1); }
    100% { opacity: 0.6; background: rgba(255, 255, 255, 0.05); }
  }
`;
