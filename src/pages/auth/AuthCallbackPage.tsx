import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

export function AuthCallbackPage() {
  const navigate = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigate(session ? '/library' : '/login', { replace: true })
    })
  }, [navigate])

  return (
    <div className="splash">
      <div className="spinner" />
    </div>
  )
}
