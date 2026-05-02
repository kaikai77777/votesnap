'use client'

import { useEffect } from 'react'

export function Heartbeat() {
  useEffect(() => {
    const ping = () => fetch('/api/heartbeat', { method: 'POST' }).catch(() => {})
    ping()
    const timer = setInterval(ping, 60_000)
    return () => clearInterval(timer)
  }, [])
  return null
}
