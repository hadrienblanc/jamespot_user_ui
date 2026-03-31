interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  message?: string
}

export function LoadingSpinner({ size = 'medium', message }: LoadingSpinnerProps) {
  const sizeMap = {
    small: '20px',
    medium: '32px',
    large: '48px',
  }

  return (
    <div className="loading-spinner" role="status" aria-live="polite">
      <div
        className="spinner"
        style={{ width: sizeMap[size], height: sizeMap[size] }}
        aria-hidden="true"
      />
      {message && <span className="loading-message">{message}</span>}
      {!message && <span className="sr-only">Chargement</span>}
      <style>{`
        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 24px;
        }

        .spinner {
          border: 3px solid var(--color-border);
          border-top-color: var(--color-accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .loading-message {
          color: var(--color-text-muted);
          font-size: 14px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>
    </div>
  )
}
