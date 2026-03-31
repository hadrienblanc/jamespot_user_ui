import { describe, it, expect, vi } from 'vitest'
import { render, screen } from './test/TestProvider'
import App from './App'

// Mock the jamespot API
vi.mock('./api/jamespot', () => ({
  jamespotApi: {
    initialize: vi.fn(),
    reset: vi.fn(),
    isInitialized: false,
  },
}))

describe('App', () => {
  it('renders login screen when not authenticated', () => {
    render(<App />)
    expect(screen.getByText('Jamespot')).toBeInTheDocument()
    expect(screen.getByText('Connectez-vous à votre espace')).toBeInTheDocument()
  })

  it('has URL input field', () => {
    render(<App />)
    expect(screen.getByLabelText(/URL de l'instance/i)).toBeInTheDocument()
  })

  it('has email input field', () => {
    render(<App />)
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument()
  })

  it('has password input field', () => {
    render(<App />)
    expect(screen.getByLabelText(/Mot de passe/i)).toBeInTheDocument()
  })

  it('has submit button', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument()
  })
})
