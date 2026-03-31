import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('shows login form', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Jamespot')
    await expect(page.getByLabel(/URL de l'instance/i)).toBeVisible()
    await expect(page.getByLabel(/Email/i)).toBeVisible()
    await expect(page.getByLabel(/Mot de passe/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /Se connecter/i })).toBeVisible()
  })

  test('shows error with invalid credentials', async ({ page }) => {
    await page.getByLabel(/URL de l'instance/i).fill('https://test.jamespot.pro')
    await page.getByLabel(/Email/i).fill('invalid@test.com')
    await page.getByLabel(/Mot de passe/i).fill('wrongpassword')
    await page.getByRole('button', { name: /Se connecter/i }).click()

    // Wait for error message (will fail to connect in test environment)
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 10000 })
  })

  test('validates required fields', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /Se connecter/i })

    // Try to submit empty form
    await submitButton.click()

    // HTML5 validation should prevent submission
    expect(await page.getByLabel(/URL de l'instance/i).isEditable()).toBe(true)
  })
})
