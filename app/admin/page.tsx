'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const ADMIN_EMAIL = 'jchenkai29@gmail.com'

type Tab = 'overview' | 'reports' | 'questions'

interface Stats {
  totalQuestions: number
  totalVotes: number
  totalUsers: number
  totalReports: number
  activeQuestions: number
}

interface ReportedQuestion {
  id: string
  question_text: string
  option_a: string
  option_b: string
  status: string
  created_at: string
  category: string
  reportCount: number
  reasons: string[]
  latestReport: string
}

interface Question {
  id: string
  question_text: string
  option_a: string
  option_b: string
  status: string
  created_at: string
  category: string
  expires_at: string
}

export default function AdminPage() {
  const router = useRouter()
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [stats, setStats] = useState<Stats | null>(null)
  const [reports, setReports] = useState<ReportedQuestion[]>([])
  const [reportError, setReportError] = useState<string | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || user.email !== ADMIN_EMAIL) { router.replace('/'); return }
      setAuthed(true)
    })
  }, [router])

  useEffect(() => {
    if (!authed) return
    fetch('/api/admin/stats').then(r => r.json()).then(d => {
      if (!d.error) setStats(d)
    })
  }, [authed])

  const loadReports = useCallback(async () => {
    setLoading(true)
    setReportError(null)
    try {
      const res = await fetch('/api/admin/reports')
      const data = await res.json()
      if (!res.ok || data.error) {
        setReportError(data.error ?? `HTTP ${res.status}`)
        setReports([])
      } else {
        setReports(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      setReportError(String(e))
    }
    setLoading(false)
  }, [])

  const loadQuestions = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('q', search)
    if (statusFilter) params.set('status', statusFilter)
    const data = await fetch(`/api/admin/questions?${params}`).then(r => r.json())
    setQuestions(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [search, statusFilter])

  useEffect(() => {
    if (!authed) return
    if (tab === 'reports') loadReports()
    if (tab === 'questions') loadQuestions()
  }, [authed, tab, loadReports, loadQuestions])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  async function deleteQuestion(id: string) {
    setActionId(id + ':delete')
    const res = await fetch('/api/admin/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setActionId(null)
    if (res.ok) {
      showToast('已刪除題目')
      loadReports()
      loadQuestions()
      setStats(s => s ? { ...s, totalQuestions: s.totalQuestions - 1, totalReports: Math.max(0, s.totalReports - 1) } : s)
    } else {
      showToast('刪除失敗', 'error')
    }
  }

  async function dismissReports(questionId: string) {
    setActionId(questionId + ':dismiss')
    const res = await fetch('/api/admin/reports/dismiss', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question_id: questionId }),
    })
    setActionId(null)
    if (res.ok) {
      showToast('已忽略，檢舉紀錄清除')
      setReports(prev => prev.filter(r => r.id !== questionId))
      setStats(s => s ? { ...s, totalReports: Math.max(0, s.totalReports - 1) } : s)
    } else {
      showToast('忽略失敗', 'error')
    }
  }

  if (!authed) return null

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview', label: '📊 概覽' },
    { key: 'reports', label: '🚨 檢舉' },
    { key: 'questions', label: '📋 問題管理' },
  ]

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-5 py-3 text-sm shadow-xl border ${
          toast.type === 'error'
            ? 'bg-red-500/20 border-red-500/30 text-red-400'
            : 'bg-green-500/20 border-green-500/30 text-green-400'
        }`}>
          {toast.msg}
        </div>
      )}

      <header className="border-b border-white/8 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold gradient-text">votesnap</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/20 font-medium">ADMIN</span>
        </div>
        <Link href="/vote" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">← 回到主站</Link>
      </header>

      <div className="flex gap-1 p-4 border-b border-white/6">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === key ? 'gradient-bg text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            {label}
            {key === 'reports' && (stats?.totalReports ?? 0) > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-red-500/80">{stats!.totalReports}</span>
            )}
          </button>
        ))}
      </div>

      <main className="p-6 max-w-5xl mx-auto">

        {/* Overview */}
        {tab === 'overview' && (
          <div>
            <h2 className="text-lg font-bold mb-4">平台數據</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: '總問題數', value: stats?.totalQuestions ?? '—', sub: `進行中 ${stats?.activeQuestions ?? 0}` },
                { label: '總投票數', value: stats?.totalVotes?.toLocaleString() ?? '—', sub: '累積' },
                { label: '總用戶數', value: stats?.totalUsers ?? '—', sub: '已註冊' },
                { label: '待處理檢舉', value: stats?.totalReports ?? '—', sub: '需人工審核', warn: (stats?.totalReports ?? 0) > 0 },
              ].map(({ label, value, sub, warn }) => (
                <div key={label} className={`card p-5 ${warn ? 'border-red-500/20' : ''}`}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${warn ? 'text-red-400' : 'text-white'}`}>{value}</p>
                  <p className="text-xs text-gray-600 mt-1">{sub}</p>
                </div>
              ))}
            </div>
            <div className="card p-5">
              <p className="text-sm text-gray-400 mb-3">快速連結</p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setTab('reports')} className="px-4 py-2 rounded-xl text-sm border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors">
                  🚨 查看所有檢舉
                </button>
                <button onClick={() => { setTab('questions'); setStatusFilter('active') }} className="px-4 py-2 rounded-xl text-sm border border-white/10 text-gray-300 hover:bg-white/5 transition-colors">
                  📋 進行中問題
                </button>
                <button onClick={() => { setTab('questions'); setStatusFilter('') }} className="px-4 py-2 rounded-xl text-sm border border-white/10 text-gray-300 hover:bg-white/5 transition-colors">
                  📋 所有問題
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reports */}
        {tab === 'reports' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">被檢舉問題</h2>
              <button onClick={loadReports} className="text-xs text-gray-500 hover:text-white transition-colors">↻ 重新整理</button>
            </div>

            {loading ? (
              <div className="flex justify-center mt-20">
                <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : reportError ? (
              <div className="card p-5 border-red-500/20 mt-4">
                <p className="text-red-400 text-sm font-medium mb-1">⚠️ 載入失敗</p>
                <p className="text-gray-500 text-xs font-mono">{reportError}</p>
                <p className="text-gray-600 text-xs mt-3">可能原因：reports 資料表不存在，請先在 Supabase 執行 migration。</p>
                <pre className="bg-white/4 rounded-xl p-3 text-xs text-gray-400 mt-2 overflow-x-auto">{`CREATE TABLE IF NOT EXISTS reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  reporter_id uuid REFERENCES auth.users(id),
  reason text,
  created_at timestamptz DEFAULT now()
);`}</pre>
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center mt-20 text-gray-600">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-sm">目前沒有待審核的檢舉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map(q => (
                  <div key={q.id} className="card p-5 border-red-500/15">
                    <div className="flex items-start gap-4">
                      {/* Report count badge */}
                      <div className="shrink-0 w-11 h-11 rounded-full bg-red-500/15 border border-red-500/20 flex flex-col items-center justify-center">
                        <span className="text-red-400 font-bold text-base leading-none">{q.reportCount}</span>
                        <span className="text-red-500/60 text-[9px]">檢舉</span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium leading-snug mb-0.5">{q.question_text}</p>
                        <p className="text-gray-500 text-xs mb-2">{q.option_a} / {q.option_b}</p>

                        <div className="flex flex-wrap items-center gap-2 text-xs mb-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${q.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-white/6 text-gray-500'}`}>
                            {q.status === 'active' ? '進行中' : q.status}
                          </span>
                          {q.category && <span className="text-gray-600">{q.category}</span>}
                          <span className="text-gray-700">{new Date(q.created_at).toLocaleDateString('zh-TW')}</span>
                        </div>

                        {q.reasons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-1.5">
                            {q.reasons.map(r => (
                              <span key={r} className="px-2 py-0.5 rounded-full text-xs bg-orange-500/15 text-orange-400 border border-orange-500/20">{r}</span>
                            ))}
                          </div>
                        )}
                        {q.latestReport && (
                          <p className="text-xs text-gray-700">最近：{new Date(q.latestReport).toLocaleString('zh-TW')}</p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0 min-w-[80px]">
                        <Link href={`/result/${q.id}`} target="_blank"
                          className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-gray-400 hover:bg-white/5 transition-colors text-center">
                          查看
                        </Link>
                        <button
                          onClick={() => dismissReports(q.id)}
                          disabled={actionId === q.id + ':dismiss'}
                          className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-gray-400 hover:bg-white/8 transition-colors disabled:opacity-40">
                          {actionId === q.id + ':dismiss' ? '...' : '忽略'}
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          disabled={actionId === q.id + ':delete'}
                          className="px-3 py-1.5 rounded-lg text-xs bg-red-500/80 text-white hover:bg-red-500 transition-colors disabled:opacity-40">
                          {actionId === q.id + ':delete' ? '...' : '刪除'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Questions */}
        {tab === 'questions' && (
          <div>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h2 className="text-lg font-bold">問題管理</h2>
              <div className="flex gap-2 flex-1 min-w-0">
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && loadQuestions()}
                  placeholder="搜尋問題..."
                  className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/40"
                />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none"
                >
                  <option value="">全部狀態</option>
                  <option value="active">進行中</option>
                  <option value="ended">已結束</option>
                </select>
                <button onClick={loadQuestions} className="px-4 py-2 rounded-xl text-sm gradient-bg text-white">搜尋</button>
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center mt-20">
                <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {questions.length === 0 && (
                  <div className="text-center mt-20 text-gray-600 text-sm">找不到問題</div>
                )}
                {questions.map(q => (
                  <div key={q.id} className="card p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{q.question_text}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span className={`px-2 py-0.5 rounded-full ${q.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-white/6 text-gray-500'}`}>
                          {q.status === 'active' ? '進行中' : q.status}
                        </span>
                        {q.category && <span>{q.category}</span>}
                        <span>{new Date(q.created_at).toLocaleDateString('zh-TW')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/result/${q.id}`} target="_blank"
                        className="px-3 py-1.5 rounded-lg text-xs border border-white/10 text-gray-400 hover:bg-white/5 transition-colors">
                        查看
                      </Link>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        disabled={actionId === q.id + ':delete'}
                        className="px-3 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/40 transition-colors disabled:opacity-50">
                        {actionId === q.id + ':delete' ? '...' : '刪除'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
