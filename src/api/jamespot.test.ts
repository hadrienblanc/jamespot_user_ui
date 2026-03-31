import { describe, it, expect, vi, beforeEach } from 'vitest'
import { jamespotApi } from './jamespot'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Jamespot API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset()
    jamespotApi.reset()
  })

  describe('URL validation', () => {
    it('rejects non-HTTPS URLs (except localhost)', async () => {
      const result = await jamespotApi.initialize('http://example.com', 'test@test.com', 'pass')
      expect(result.success).toBe(false)
      expect(result.error).toContain('HTTPS')
    })

    it('accepts HTTPS URLs', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 0, result: { uri: 'user:123' } }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 0, result: { uri: 'user:123', email: 'test@test.com' } }),
      })

      const result = await jamespotApi.initialize('https://example.com', 'test@test.com', 'pass')
      expect(result.success).toBe(true)
    })

    it('accepts localhost HTTP for development', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 0, result: { uri: 'user:123' } }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ error: 0, result: { uri: 'user:123', email: 'test@test.com' } }),
      })

      const result = await jamespotApi.initialize('http://localhost:3000', 'test@test.com', 'pass')
      expect(result.success).toBe(true)
    })

    it('rejects invalid URL format', async () => {
      const result = await jamespotApi.initialize('not-a-url', 'test@test.com', 'pass')
      expect(result.success).toBe(false)
      expect(result.error).toContain('invalide')
    })
  })

  describe('error handling', () => {
    it('returns user-friendly error on network failure', async () => {
      mockFetch.mockRejectedValue(new Error('fetch failed'))

      const result = await jamespotApi.initialize('https://example.com', 'test@test.com', 'pass')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Impossible de contacter le serveur')
    })

    it('returns user-friendly error on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      const result = await jamespotApi.initialize('https://example.com', 'test@test.com', 'pass')
      expect(result.success).toBe(false)
      expect(result.error).toContain('Identifiants')
    })
  })
})
