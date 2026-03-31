import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="error-boundary">
          <div className="error-content">
            <h1>Une erreur est survenue</h1>
            <p>Nous sommes désolés, quelque chose s'est mal passé.</p>
            <button onClick={this.handleRetry} className="btn-retry">
              Réessayer
            </button>
          </div>

          <style>{`
            .error-boundary {
              min-height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
            }

            .error-content {
              text-align: center;
              max-width: 400px;
            }

            .error-content h1 {
              font-size: 24px;
              font-weight: 600;
              margin-bottom: 12px;
            }

            .error-content p {
              color: var(--color-text-muted);
              margin-bottom: 24px;
            }

            .btn-retry {
              height: 44px;
              padding: 0 24px;
              background: var(--color-accent);
              color: white;
              border: none;
              border-radius: var(--radius);
              font-size: 15px;
              font-weight: 500;
            }

            .btn-retry:hover {
              background: var(--color-accent-hover);
            }
          `}</style>
        </div>
      )
    }

    return this.props.children
  }
}
