import { describe, it, expect, vi, beforeEach } from 'vitest'
import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dashboard } from './Dashboard'
import { jamespotApi } from '../api/jamespot'

// Mock the API
vi.mock('../api/jamespot', () => ({
  jamespotApi: {
    getGroups: vi.fn(),
    searchUsers: vi.fn(),
  },
}))

// Mock useAuth
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { displayName: 'Test User', email: 'test@test.com', uri: 'user-1' },
    logout: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(jamespotApi.getGroups).mockResolvedValue([])
    vi.mocked(jamespotApi.searchUsers).mockResolvedValue([])
  })

  it('loads groups on mount', async () => {
    vi.mocked(jamespotApi.getGroups).mockResolvedValue([
      { uri: 'group-1', title: 'Test Group' },
    ])

    render(<Dashboard />)

    await waitFor(() => {
      expect(jamespotApi.getGroups).toHaveBeenCalledWith(50)
    })
  })

  it('displays groups after loading', async () => {
    vi.mocked(jamespotApi.getGroups).mockResolvedValue([
      { uri: 'group-1', title: 'Engineering' },
      { uri: 'group-2', title: 'Marketing', description: 'Team marketing' },
    ])

    render(<Dashboard />)

    await waitFor(() => {
      expect(screen.getByText('Engineering')).toBeInTheDocument()
      expect(screen.getByText('Marketing')).toBeInTheDocument()
      expect(screen.getByText('Team marketing')).toBeInTheDocument()
    })
  })

  it('shows user search section', () => {
    render(<Dashboard />)

    expect(screen.getByPlaceholderText('Rechercher un utilisateur...')).toBeInTheDocument()
    expect(screen.getByText('Utilisateurs')).toBeInTheDocument()
  })

  it('calls searchUsers when searching', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)

    vi.mocked(jamespotApi.searchUsers).mockResolvedValue([
      { uri: 'user-2', displayName: 'John Doe', email: 'john@test.com' },
    ])

    const input = screen.getByPlaceholderText('Rechercher un utilisateur...')
    await user.type(input, 'john')

    const buttons = screen.getAllByRole('button', { name: 'Rechercher' })
    await user.click(buttons[1]) // Second Rechercher button is for user search

    await waitFor(() => {
      expect(jamespotApi.searchUsers).toHaveBeenCalledWith('john', 20)
    })
  })

  it('displays search results', async () => {
    const user = userEvent.setup()
    render(<Dashboard />)

    vi.mocked(jamespotApi.searchUsers).mockResolvedValue([
      { uri: 'user-2', displayName: 'John Doe', email: 'john@test.com' },
    ])

    const input = screen.getByPlaceholderText('Rechercher un utilisateur...')
    await user.type(input, 'john')

    const buttons = screen.getAllByRole('button', { name: 'Rechercher' })
    await user.click(buttons[1])

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@test.com')).toBeInTheDocument()
    })
  })
})
