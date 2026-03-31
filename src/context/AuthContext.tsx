import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { jamespotApi, type UserInfo } from '../api/jamespot'

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

interface SavedCredentials {
  url: string
  email: string
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  user: UserInfo | null
  savedCredentials: SavedCredentials | null
  login: (url: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  loadSavedCredentials: () => Promise<void>
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
  const [savedCredentials, setSavedCredentials] = useState<SavedCredentials | null>(null)

  const loadSavedCredentials = useCallback(async () => {
    if (!isTauri) return
    try {
      const creds = await invoke<SavedCredentials | null>('get_credentials')
      setSavedCredentials(creds)
    } catch (err) {
      console.error('Failed to load credentials:', err)
    }
  }, [])

  const login = useCallback(async (url: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await jamespotApi.initialize(url, email, password)
      if (result.success && result.user) {
        setUser(result.user)
        setIsAuthenticated(true)
        // Save credentials (url + email only, never password)
        if (isTauri) {
          try {
            await invoke('save_credentials', { url, email })
            setSavedCredentials({ url, email })
          } catch (err) {
            console.error('Failed to save credentials:', err)
          }
        }
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
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        error,
        user,
        savedCredentials,
        login,
        logout,
        loadSavedCredentials,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
