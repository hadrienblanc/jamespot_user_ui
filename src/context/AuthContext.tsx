import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { jamespotApi, type UserInfo } from '../api/jamespot'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  user: UserInfo | null
  login: (url: string, email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserInfo | null>(null)

  const login = useCallback(async (url: string, email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await jamespotApi.initialize(url, email, password)
      if (result.success && result.user) {
        setUser(result.user)
        setIsAuthenticated(true)
        return true
      } else {
        setError(result.error || 'Échec de la connexion')
        return false
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    jamespotApi.reset()
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, error, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
