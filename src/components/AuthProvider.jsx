// AuthProvider.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { SUPABASE } from "../config/config";
import { useNavigate } from 'react-router-dom'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const initSession = async () => {
      const { data: { session }, error } = await SUPABASE.auth.getSession()
      if (error) console.error('Initial session error:', error)
      setSession(session)
    }

    initSession()

    const { data: authListener } = SUPABASE.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)

        if (event === 'TOKEN_REFRESH_FAILED') {
          console.warn('Token refresh failed.')
          alert('User cannot be started. Please try again later')
          await SUPABASE.auth.signOut()
          navigate('/login')
        }

        if (event === 'SIGNED_OUT') {
          navigate('/login')
        }
      }
    )

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [navigate])

  return (
    <AuthContext.Provider value={{ session }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
