import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { jamespotApi, type Group, type UserInfo, type Article } from '../api/jamespot'
import { LoadingSpinner } from './LoadingSpinner'

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('fr-FR')
  } catch {
    return ''
  }
}

export function Dashboard() {
  const { user, logout } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<UserInfo[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingArticles, setLoadingArticles] = useState(true)
  const [groupSearchQuery, setGroupSearchQuery] = useState('')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [hasSearchedUsers, setHasSearchedUsers] = useState(false)
  const [articleSearchQuery, setArticleSearchQuery] = useState('')

  // Refs for keyboard shortcuts
  const groupSearchRef = useRef<HTMLInputElement>(null)
  const userSearchRef = useRef<HTMLInputElement>(null)
  const articleSearchRef = useRef<HTMLInputElement>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          ;(e.target as HTMLInputElement).blur()
        }
        return
      }

      // Skip if modifier keys are pressed or during IME composition
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing) {
        return
      }

      switch (e.key.toLowerCase()) {
        case 'g':
          groupSearchRef.current?.focus()
          e.preventDefault()
          break
        case 'u':
          userSearchRef.current?.focus()
          e.preventDefault()
          break
        case 'a':
          articleSearchRef.current?.focus()
          e.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    loadGroups()
    loadArticles()
  }, [])

  const loadArticles = async () => {
    setLoadingArticles(true)
    try {
      const data = await jamespotApi.getArticles(10, 1)
      setArticles(data)
    } catch (err) {
      console.error('Failed to load articles:', err)
    } finally {
      setLoadingArticles(false)
    }
  }

  const handleArticleSearch = async () => {
    if (!articleSearchQuery.trim()) {
      loadArticles()
      return
    }
    setLoadingArticles(true)
    try {
      const data = await jamespotApi.getArticles(10, 1, articleSearchQuery)
      setArticles(data)
    } catch (err) {
      console.error('Article search failed:', err)
    } finally {
      setLoadingArticles(false)
    }
  }

  const loadGroups = async () => {
    setLoadingGroups(true)
    try {
      const data = await jamespotApi.getGroups(50)
      setGroups(data)
    } catch (err) {
      console.error('Failed to load groups:', err)
    } finally {
      setLoadingGroups(false)
    }
  }

  const handleGroupSearch = async () => {
    if (!groupSearchQuery.trim()) {
      loadGroups()
      return
    }
    setLoadingGroups(true)
    try {
      const data = await jamespotApi.getGroups(50, groupSearchQuery)
      setGroups(data)
    } catch (err) {
      console.error('Group search failed:', err)
    } finally {
      setLoadingGroups(false)
    }
  }

  const handleUserSearch = async () => {
    const query = userSearchQuery.trim()
    if (!query) {
      setUsers([])
      setHasSearchedUsers(false)
      return
    }
    setLoadingUsers(true)
    try {
      const data = await jamespotApi.searchUsers(query, 20)
      setUsers(data)
      setHasSearchedUsers(true)
    } catch (err) {
      console.error('User search failed:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <h1>Jamespot</h1>
        </div>
        <div className="header-right">
          <span className="user-name">{user?.displayName || user?.email}</span>
          <button onClick={logout} className="btn-ghost">
            Déconnexion
          </button>
        </div>
      </header>

      <main className="dashboard-content">
        {/* User Profile Card */}
        <section className="section profile-section">
          <div className="profile-card">
            <div className="profile-avatar">
              {user?.displayName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="profile-info">
              <h2>{user?.displayName || 'Utilisateur'}</h2>
              {user?.email && <p className="profile-email">{user.email}</p>}
              {(user?.firstName || user?.lastName) && (
                <p className="profile-name">
                  {[user.firstName, user.lastName].filter(Boolean).join(' ')}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Groupes</h2>
            <div className="section-actions">
              <button onClick={loadGroups} className="btn-icon" disabled={loadingGroups} title="Rafraîchir" aria-label="Rafraîchir les groupes">
                ↻
              </button>
              <div className="search-bar">
              <input
                ref={groupSearchRef}
                type="text"
                placeholder="Rechercher un groupe..."
                title="Raccourci: G"
                value={groupSearchQuery}
                onChange={(e) => setGroupSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGroupSearch()}
              />
              <button onClick={handleGroupSearch} className="btn-small">
                Rechercher
              </button>
              </div>
            </div>
          </div>

          {loadingGroups ? (
            <LoadingSpinner message="Chargement des groupes..." />
          ) : groups.length === 0 ? (
            <div className="empty">Aucun groupe trouvé</div>
          ) : (
            <div className="item-list">
              {groups.map((group) => (
                <div key={group.uri} className="item-card">
                  <div className="item-icon">
                    {group.title?.charAt(0).toUpperCase() || 'G'}
                  </div>
                  <div className="item-info">
                    <h3>{group.title}</h3>
                    {group.description && <p>{group.description}</p>}
                    {group.memberCount !== undefined && (
                      <span className="meta">{group.memberCount} membres</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Utilisateurs</h2>
            <div className="search-bar">
              <input
                ref={userSearchRef}
                type="text"
                placeholder="Rechercher un utilisateur..."
                title="Raccourci: U"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUserSearch()}
              />
              <button onClick={handleUserSearch} className="btn-small" disabled={loadingUsers}>
                {loadingUsers ? '...' : 'Rechercher'}
              </button>
            </div>
          </div>

          {users.length === 0 && !loadingUsers ? (
            <div className="empty">
              {hasSearchedUsers
                ? 'Aucun utilisateur trouvé'
                : 'Entrez un terme de recherche pour trouver des utilisateurs'}
            </div>
          ) : (
            <div className="item-list">
              {users.map((u) => (
                <div key={u.uri} className="item-card">
                  <div className="item-icon">
                    {(u.displayName || u.email)?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="item-info">
                    <h3>{u.displayName || u.email}</h3>
                    {u.email && <p>{u.email}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="section">
          <div className="section-header">
            <h2>Articles récents</h2>
            <div className="section-actions">
              <button onClick={loadArticles} className="btn-icon" disabled={loadingArticles} title="Rafraîchir" aria-label="Rafraîchir les articles">
                ↻
              </button>
              <div className="search-bar">
                <input
                  ref={articleSearchRef}
                  type="text"
                  placeholder="Rechercher un article..."
                  title="Raccourci: A"
                  value={articleSearchQuery}
                  onChange={(e) => setArticleSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !loadingArticles && handleArticleSearch()}
                />
                <button onClick={handleArticleSearch} className="btn-small" disabled={loadingArticles}>
                  Rechercher
                </button>
              </div>
            </div>
          </div>

          {loadingArticles ? (
            <LoadingSpinner message="Chargement des articles..." />
          ) : articles.length === 0 ? (
            <div className="empty">Aucun article trouvé</div>
          ) : (
            <div className="item-list">
              {articles.map((article) => (
                <div key={article.uri} className="item-card">
                  <div className="item-icon">
                    {article.title?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="item-info">
                    <h3>{article.title}</h3>
                    {article.description && <p>{article.description}</p>}
                    {article.dateCreation && (
                      <span className="meta">
                        {formatDate(article.dateCreation)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <style>{`
        .dashboard {
          min-height: 100%;
          display: flex;
          flex-direction: column;
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 24px;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
        }

        .header-left h1 {
          font-size: 20px;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-name {
          font-size: 14px;
          color: var(--color-text-muted);
        }

        .btn-ghost {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          color: var(--color-text);
          font-size: 14px;
          transition: background 0.15s;
        }

        .btn-ghost:hover {
          background: var(--color-border);
        }

        .dashboard-content {
          flex: 1;
          padding: 24px;
          overflow: auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .section {
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 16px;
          flex-wrap: wrap;
        }

        .section-header h2 {
          font-size: 18px;
          font-weight: 500;
        }

        .search-bar {
          display: flex;
          gap: 8px;
        }

        .search-bar input {
          width: 280px;
          height: 36px;
          padding: 0 12px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          color: var(--color-text);
          font-size: 14px;
        }

        .search-bar input::placeholder {
          color: var(--color-text-muted);
        }

        .btn-small {
          height: 36px;
          padding: 0 16px;
          background: var(--color-accent);
          border: none;
          border-radius: var(--radius);
          color: white;
          font-size: 14px;
          font-weight: 500;
        }

        .btn-small:hover:not(:disabled) {
          background: var(--color-accent-hover);
        }

        .btn-small:disabled {
          opacity: 0.6;
        }

        .btn-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          color: var(--color-text-muted);
          font-size: 18px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-icon:hover:not(:disabled) {
          background: var(--color-surface);
          color: var(--color-text);
          border-color: var(--color-text-muted);
        }

        .btn-icon:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .section-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .loading, .empty {
          padding: 32px;
          text-align: center;
          color: var(--color-text-muted);
        }

        .item-list {
          display: grid;
          gap: 12px;
        }

        .item-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          transition: border-color 0.15s;
        }

        .item-card:hover {
          border-color: var(--color-text-muted);
        }

        .item-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent);
          border-radius: var(--radius);
          color: white;
          font-size: 20px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .item-info {
          flex: 1;
          min-width: 0;
        }

        .item-info h3 {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .item-info p {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .profile-section {
          margin-bottom: 0;
        }

        .profile-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          max-width: 600px;
        }

        .profile-avatar {
          width: 64px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-accent);
          border-radius: 50%;
          color: white;
          font-size: 28px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .profile-info {
          min-width: 0;
          overflow: hidden;
        }

        .profile-info h2 {
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .profile-email {
          color: var(--color-text-muted);
          font-size: 14px;
          margin-bottom: 2px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .profile-name {
          color: var(--color-text);
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .meta {
          font-size: 12px;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  )
}
