// Jamespot API adapter - uses Tauri HTTP plugin in desktop, fetch in browser
// This provides proper cookie handling in Tauri desktop app

import { invoke } from '@tauri-apps/api/core'

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

export interface Article {
  uri: string
  title: string
  description?: string
  dateCreation?: string
  author?: string
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

class HttpError extends Error {
  constructor(public status: number, public data?: ApiResponse<unknown>) {
    super(`HTTP ${status}`)
  }
}

function sanitizeError(err: unknown): string {
  if (err instanceof HttpError) {
    if (err.status === 401 || err.status === 403) {
      return 'Identifiants invalides'
    }
    if (err.status >= 500) {
      return 'Erreur serveur, veuillez réessayer'
    }
    return `Erreur HTTP ${err.status}`
  }
  if (err instanceof Error) {
    if (err.message.includes('fetch') || err.message.includes('network')) {
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
    const isLocalhost = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'

    if (parsed.protocol === 'https:') {
      return { valid: true }
    }
    if (parsed.protocol === 'http:' && isLocalhost) {
      return { valid: true }
    }

    return {
      valid: false,
      error: isLocalhost
        ? 'Seul le protocole HTTP est autorisé en local'
        : 'Seules les connexions HTTPS sont autorisées'
    }
  } catch {
    return { valid: false, error: 'URL invalide' }
  }
}

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window

// Tauri HTTP fetch wrapper
async function tauriFetch<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await invoke<{ status: number; headers: Record<string, string>; data: string }>('plugin:http|fetch', {
    url,
    method: (options.method as string) || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
    body: options.body ? { type: 'Text', content: options.body as string } : undefined,
  })

  const data = JSON.parse(response.data) as ApiResponse<T>

  if (response.status >= 400) {
    throw new HttpError(response.status, data)
  }

  return data
}

// Browser fetch wrapper
async function browserFetch<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const data = await response.json().catch(() => undefined)
    throw new HttpError(response.status, data)
  }

  return response.json() as Promise<ApiResponse<T>>
}

// Unified fetch function
async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  if (isTauri) {
    return tauriFetch<T>(url, options)
  }
  return browserFetch<T>(url, options)
}

class JamespotApiClient {
  private baseUrl: string = ''
  private initialized = false

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    return apiFetch<T>(`${this.baseUrl}${endpoint}`, options)
  }

  async initialize(url: string, email: string, password: string): Promise<LoginResult> {
    const urlValidation = validateUrl(url)
    if (!urlValidation.valid) {
      return { success: false, error: urlValidation.error }
    }

    this.baseUrl = url.replace(/\/$/, '')

    try {
      const loginResponse = await this.request<{ uri?: string }>('/api/user/signin', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })

      if (loginResponse.error !== 0 || !loginResponse.result?.uri) {
        return {
          success: false,
          error: loginResponse.errorMsg || 'Identifiants invalides',
        }
      }

      this.initialized = true

      const user = await this.getUser(loginResponse.result.uri)
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

  private async getUser(uri: string): Promise<UserInfo> {
    const response = await this.request<UserInfo>('/api/user/get', {
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

  async getArticles(limit = 20, page = 1): Promise<Article[]> {
    const response = await this.request<{ data?: Article[] }>('/api/objectlist/article', {
      method: 'POST',
      body: JSON.stringify({
        limit,
        page,
        format: 'list',
        orders: [{ name: 'dateCreation', sort: 'DESC' }],
      }),
    })

    return response.error === 0 ? (response.result.data || []) : []
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
