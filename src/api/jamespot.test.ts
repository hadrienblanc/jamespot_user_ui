import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { jamespotApi } from './jamespot'

// Store original globals
const originalWindow = globalThis.window
const originalTauri = (globalThis as Record<string, unknown>).__TAURI__

describe('Jamespot API Client', () => {
  beforeEach(() => {
    jamespotApi.reset()
    // Simulate Tauri environment
    ;(globalThis as Record<string, unknown>).__TAURI__ = {}
  })

  afterEach(() => {
    // Restore original environment
    if (originalTauri !== undefined) {
      ;(globalThis as Record<string, unknown>).__TAURI__ = originalTauri
    } else {
      delete (globalThis as Record<string, unknown>).__TAURI__
    }
    if (originalWindow !== undefined) {
      ;(globalThis as Record<string, unknown>).window = originalWindow
    } else {
      delete (globalThis as Record<string, unknown>).window
    }
  })

  describe('URL validation', () => {
    it('rejects non-HTTPS URLs (except localhost)', async () => {
      const result = await jamespotApi.initialize('http://example.com', 'test@test.com', 'pass')
      expect(result.success).toBe(false)
      expect(result.error).toContain('HTTPS')
    })

    it('rejects non-HTTP schemes on localhost (ftp, ws, etc.)', async () => {
      const ftpResult = await jamespotApi.initialize('ftp://localhost', 'test@test.com', 'pass')
      expect(ftpResult.success).toBe(false)

      const wsResult = await jamespotApi.initialize('ws://localhost', 'test@test.com', 'pass')
      expect(wsResult.success).toBe(false)

      const fileResult = await jamespotApi.initialize('file://localhost', 'test@test.com', 'pass')
      expect(fileResult.success).toBe(false)
    })

    it('rejects HTTP on non-localhost hosts', async () => {
      const result = await jamespotApi.initialize('http://192.168.1.1', 'test@test.com', 'pass')
      expect(result.success).toBe(false)
      expect(result.error).toContain('HTTPS')
    })

    it('rejects invalid URL format', async () => {
      const result = await jamespotApi.initialize('not-a-url', 'test@test.com', 'pass')
      expect(result.success).toBe(false)
      expect(result.error).toContain('invalide')
    })

    it('rejects empty URL', async () => {
      const result = await jamespotApi.initialize('', 'test@test.com', 'pass')
      expect(result.success).toBe(false)
    })
  })
})
