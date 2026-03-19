import { createContext, useContext, useState, useEffect } from 'react'
import { agentLogin } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('oem_token')
    const userData = localStorage.getItem('oem_user')
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData)
        // Only allow OEM agents
        if (parsed.isOEMAgent) {
          setUser(parsed)
        } else {
          localStorage.removeItem('oem_token')
          localStorage.removeItem('oem_user')
        }
      } catch {
        localStorage.removeItem('oem_token')
        localStorage.removeItem('oem_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    const res = await agentLogin(email, password)
    const { token } = res.data

    // Decode token to get user data
    const base64 = token.split('.')[1]
    const decoded = JSON.parse(atob(base64))

    if (!decoded.isOEMAgent) {
      throw new Error('Access denied. This portal is for OEM agents only.')
    }

    localStorage.setItem('oem_token', token)
    localStorage.setItem('oem_user', JSON.stringify(decoded))
    setUser(decoded)
    return decoded
  }

  const logout = () => {
    localStorage.removeItem('oem_token')
    localStorage.removeItem('oem_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
