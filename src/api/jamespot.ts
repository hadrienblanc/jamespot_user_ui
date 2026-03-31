// Jamespot API adapter for browser/Tauri environment
// Note: For proper cookie handling in Tauri, use tauri-plugin-http

export interface UserInfo {
  uri: string
  email: string
  firstName?: string
  lastName?: string
  displayName?: string
  avatar?: string
}

export interface Group {
  uri: string
  title: string
  description?: string
  memberCount?: number
  type?: string
}

export interface LoginResult {
  success: boolean
  user?: UserInfo
  error?: string
}

interface ApiResponse<T> {
  error: number
  errorMsg?: string
  result: T
}

function sanitizeError(err: unknown): string {
  if (err instanceof Error) {
    // Map common errors to user-friendly messages
    if (err.message.includes('fetch')) {
      return 'Impossible de contacter le serveur'
    }
    if (err.message.includes('JSON')) {
      return 'Réponse invalide du serveur'
    }
    return 'Une erreur est survenue'
  }
  return 'Erreur inconnue'
}

function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url)
    // Allow https and localhost for development
    if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost' && parsed.hostname !== '127.0.0.1') {
      return { valid: false, error: 'Seules les connexions HTTPS sont autorisées' }
    }
    return { valid: true }
  } catch {
    return { valid: false, error: 'URL invalide' }
  }
}

// Simple fetch-based API client
// TODO: Replace with tauri-plugin-http for proper cookie handling in production
class JamespotApiClient {
  private baseUrl: string = ''
  private initialized = false

  async initialize(url: string, email: string, password: string): Promise<LoginResult> {
    // Validate URL first
    const urlValidation = validateUrl(url)
    if (!urlValidation.valid) {
      return { success: false, error: urlValidation.error }
    }

    this.baseUrl = url.replace(/\/$/, '')
    this.initialized = false

    try {
      // Login request
      const loginResponse = await fetch(`${this.baseUrl}/api/user/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      })

      if (!loginResponse.ok) {
        return {
          success: false,
          error: loginResponse.status === 401 ? 'Identifiants invalides' : 'Erreur serveur',
        }
      }

      const data: ApiResponse<{ uri?: string }> = await loginResponse.json()

      if (data.error !== 0 || !data.result?.uri) {
        return {
          success: false,
          error: data.errorMsg || 'Identifiants invalides',
        }
      }

      this.initialized = true

      // Fetch user info
      const user = await this.getUser(data.result.uri)
      return {
        success: true,
        user,
      }
    } catch (err) {
      return {
        success: false,
        error: sanitizeError(err),
      }
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    if (!this.initialized) {
      throw new Error('API not initialized. Call login first.')
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return response.json()
  }

  async getUser(uri: string): Promise<UserInfo> {
    const response = await this.request<UserInfo>(`/api/user/get`, {
      method: 'POST',
      body: JSON.stringify({ uri }),
    })

    if (response.error !== 0) {
      throw new Error(response.errorMsg || 'Failed to get user')
    }

    return response.result
  }

  async getCurrentUser(): Promise<UserInfo | null> {
    try {
      const response = await this.request<UserInfo>('/api/user/current')
      return response.error === 0 ? response.result : null
    } catch {
      return null
    }
  }

  async getGroups(limit = 50, query?: string): Promise<Group[]> {
    const body: Record<string, unknown> = { type: 'spot', limit }
    if (query) {
      body.query = query
    }

    const response = await this.request<{ list?: Group[] }>('/api/group/list', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    return response.error === 0 ? (response.result.list || []) : []
  }

  async searchUsers(query: string, limit = 10): Promise<UserInfo[]> {
    const response = await this.request<{ list?: UserInfo[] }>('/api/user/autocomplete', {
      method: 'POST',
      body: JSON.stringify({ query, limit }),
    })

    return response.error === 0 ? (response.result.list || []) : []
  }

  reset(): void {
    this.baseUrl = ''
    this.initialized = false
  }

  get isInitialized(): boolean {
    return this.initialized
  }
}

export const jamespotApi = new JamespotApiClient()
