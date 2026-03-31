import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { jamespotApi, type Group } from '../api/jamespot'

export function Dashboard() {
  const { user, logout } = useAuth()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setLoading(true)
    try {
      const data = await jamespotApi.getGroups(50)
      setGroups(data)
    } catch (err) {
      console.error('Failed to load groups:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadGroups()
      return
    }
    setLoading(true)
    try {
      const data = await jamespotApi.getGroups(50, searchQuery)
      setGroups(data)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
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
        <section className="section">
          <div className="section-header">
            <h2>Groupes</h2>
            <div className="search-bar">
              <input
                type="text"
                placeholder="Rechercher un groupe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="btn-small">
                Rechercher
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading">Chargement...</div>
          ) : groups.length === 0 ? (
            <div className="empty">Aucun groupe trouvé</div>
          ) : (
            <div className="group-list">
              {groups.map((group) => (
                <div key={group.uri} className="group-card">
                  <div className="group-icon">
                    {group.title?.charAt(0).toUpperCase() || 'G'}
                  </div>
                  <div className="group-info">
                    <h3>{group.title}</h3>
                    {group.description && <p>{group.description}</p>}
                    {group.memberCount !== undefined && (
                      <span className="member-count">{group.memberCount} membres</span>
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
        }

        .section {
          max-width: 1200px;
          margin: 0 auto;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
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

        .btn-small:hover {
          background: var(--color-accent-hover);
        }

        .loading, .empty {
          padding: 48px;
          text-align: center;
          color: var(--color-text-muted);
        }

        .group-list {
          display: grid;
          gap: 12px;
        }

        .group-card {
          display: flex;
          gap: 16px;
          padding: 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          transition: border-color 0.15s;
        }

        .group-card:hover {
          border-color: var(--color-text-muted);
        }

        .group-icon {
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

        .group-info {
          flex: 1;
          min-width: 0;
        }

        .group-info h3 {
          font-size: 15px;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .group-info p {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .member-count {
          font-size: 12px;
          color: var(--color-text-muted);
        }
      `}</style>
    </div>
  )
}
