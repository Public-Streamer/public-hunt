import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser } from '@/lib/auth/whoami'

export function useIdentityGuard() {
  const navigate = useNavigate()
  const lastKnownUserRef = useRef<string | null>(null)

  const checkIdentity = async () => {
    const currentUser = await getCurrentUser()
    
    if (!currentUser) {
      // User logged out - redirect to login
      lastKnownUserRef.current = null
      navigate('/login')
      return
    }

    // Check if user changed (identity switch)
    if (lastKnownUserRef.current && lastKnownUserRef.current !== currentUser.email) {
      console.log('Identity changed from', lastKnownUserRef.current, 'to', currentUser.email)
      // Force a page reload to clear any cached user state
      window.location.reload()
      return
    }

    lastKnownUserRef.current = currentUser.email
  }

  useEffect(() => {
    // Check identity on mount
    checkIdentity()

    // Check identity on focus/visibility changes
    const onFocus = () => checkIdentity()
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkIdentity()
      }
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [navigate])

  return { checkIdentity }
}