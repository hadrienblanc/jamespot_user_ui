import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { LoadingSpinner } from './LoadingSpinner'

describe('LoadingSpinner', () => {
  it('renders spinner with default size', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.querySelector('.spinner')).toBeInTheDocument()
  })

  it('renders with message', () => {
    render(<LoadingSpinner message="Chargement..." />)
    expect(screen.getByText('Chargement...')).toBeInTheDocument()
  })

  it('applies size variants', () => {
    const { container, rerender } = render(<LoadingSpinner size="small" />)
    const spinner = container.querySelector('.spinner') as HTMLElement
    expect(spinner.style.width).toBe('20px')

    rerender(<LoadingSpinner size="large" />)
    expect(spinner.style.width).toBe('48px')
  })
})
