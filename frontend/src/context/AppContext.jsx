import { createContext, useContext, useReducer, useEffect } from 'react'

const AppContext = createContext(null)

function getInitialTheme() {
  try {
    const stored = localStorage.getItem('promptlab-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {}
  return 'dark'
}

const initialState = {
  user: null,
  progress: [],
  theme: getInitialTheme(),
  sidebarOpen: true,
}

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload }
    case 'UPDATE_PROGRESS':
      return { ...state, progress: action.payload }
    case 'TOGGLE_THEME':
      return { ...state, theme: state.theme === 'dark' ? 'light' : 'dark' }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_SIDEBAR':
      return { ...state, sidebarOpen: action.payload }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme)
    try { localStorage.setItem('promptlab-theme', state.theme) } catch {}
  }, [state.theme])

  // Set theme on initial load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const actions = {
    setUser: (user) => dispatch({ type: 'SET_USER', payload: user }),
    updateProgress: (progress) => dispatch({ type: 'UPDATE_PROGRESS', payload: progress }),
    toggleTheme: () => dispatch({ type: 'TOGGLE_THEME' }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setSidebar: (open) => dispatch({ type: 'SET_SIDEBAR', payload: open }),
  }

  return (
    <AppContext.Provider value={{ ...state, ...actions }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}

export default AppContext
