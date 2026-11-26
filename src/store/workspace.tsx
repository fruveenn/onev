import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

interface WorkspaceContextValue {
  favorites: string[]
  recent: string[]
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  recordVisit: (id: string) => void
  clearRecent: () => void
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useLocalStorage<string[]>('onev:favorites', [])
  const [recent, setRecent] = useLocalStorage<string[]>('onev:recent', [])

  const toggleFavorite = useCallback(
    (id: string) => {
      setFavorites((current) =>
        current.includes(id) ? current.filter((item) => item !== id) : [id, ...current],
      )
    },
    [setFavorites],
  )

  const recordVisit = useCallback(
    (id: string) => {
      setRecent((current) => [id, ...current.filter((item) => item !== id)].slice(0, 8))
    },
    [setRecent],
  )

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      favorites,
      recent,
      toggleFavorite,
      isFavorite: (id) => favorites.includes(id),
      recordVisit,
      clearRecent: () => setRecent([]),
    }),
    [favorites, recent, toggleFavorite, recordVisit, setRecent],
  )

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext)
  if (!context) throw new Error('useWorkspace must be used inside WorkspaceProvider')
  return context
}
