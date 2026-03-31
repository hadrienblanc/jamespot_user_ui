// Jamespot API adapter for browser/Tauri environment
// The jamespot-user-api is designed for browsers and needs window polyfill in Node
// In Tauri/browser, window exists natively

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

// Simple fetch-based API client
// In production, this would use the actual jamespot-user-api package
class JamespotApiClient {
  private baseUrl: string = ''
  private cookies: string = ''
  private initialized = false

  async initialize(url: string, email: string, password: string): Promise<LoginResult> {
    this.baseUrl = url.replace(/\/$/, '')
    this.cookies = ''
    this.initialized = false

    try {
      // Login request
      const loginResponse = await fetch(`${this.baseUrl}/api/user/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      // Extract cookies from response
      const setCookie = loginResponse.headers.get('set-cookie')
      if (setCookie) {
        this.cookies = setCookie
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
        error: err instanceof Error ? err.message : 'Erreur de connexion',
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
        ...(this.cookies ? { Cookie: this.cookies } : {}),
        ...options.headers,
      },
    })

    // Update cookies if new ones are set
    const setCookie = response.headers.get('set-cookie')
    if (setCookie) {
      this.cookies = setCookie
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
    this.cookies = ''
    this.initialized = false
  }

  get isInitialized(): boolean {
    return this.initialized
  }
}

export const jamespotApi = new JamespotApiClient()
