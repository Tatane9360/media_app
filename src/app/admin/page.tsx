'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminPage() {
  const router = useRouter()

  useEffect(() => {
    router.push('/admin/dashboard')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Redirecting to dashboard...</div>
    </div>
  )
}
