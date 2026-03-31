import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'

export function LoginScreen() {
  const { login, isLoading, error } = useAuth()
  const [url, setUrl] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await login(url, email, password)
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Jamespot</h1>
          <p>Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="url">URL de l'instance</label>
            <input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://votre-instance.jamespot.pro"
              required
              disabled={isLoading}
              autoComplete="url"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              required
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading}>
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>

      <style>{`
        .login-container {
          min-height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          padding: 32px;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-header h1 {
          font-size: 28px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .login-header p {
          color: var(--color-text-muted);
          font-size: 14px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-size: 13px;
          font-weight: 500;
          color: var(--color-text-muted);
        }

        .form-group input {
          height: 44px;
          padding: 0 14px;
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          color: var(--color-text);
          font-size: 15px;
          transition: border-color 0.15s;
        }

        .form-group input::placeholder {
          color: var(--color-text-muted);
        }

        .form-group input:focus {
          border-color: var(--color-accent);
        }

        .form-group input:disabled {
          opacity: 0.6;
        }

        .btn-primary {
          height: 44px;
          background: var(--color-accent);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-size: 15px;
          font-weight: 500;
          transition: background 0.15s;
          margin-top: 8px;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--color-accent-hover);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          padding: 12px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--color-error);
          border-radius: var(--radius);
          color: var(--color-error);
          font-size: 14px;
        }
      `}</style>
    </div>
  )
}
