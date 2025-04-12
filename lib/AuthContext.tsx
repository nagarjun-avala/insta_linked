"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  getSession,
  signIn as nextAuthSignIn, 
  signOut as nextAuthSignOut 
} from 'next-auth/react'

type User = {
  id: string
  email: string
  name: string
  role: string
  image?: string
}

interface AuthContextProps {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserFromSession = async () => {
      const session = await getSession()
      setUser(session?.user as User || null)
      setLoading(false)
    }

    loadUserFromSession()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const result = await nextAuthSignIn('credentials', {
        redirect: false,
        email,
        password,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      const session = await getSession()
      setUser(session?.user as User || null)
    } catch (error) {
      throw error
    }
  }

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)