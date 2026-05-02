'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CATEGORIES } from '@/types'

const ADMIN_EMAIL = 'jchenkai29@gmail.com'

type Tab = 'overview' | 'reports' | 'questions' | 'bank'

interface BankQuestion {
  id: string
  question_text: string
  option_a: string
  option_b: string
  category: string
  duration_minutes: number
  created_at: string
  is_priority: boolean
}

interface Stats {
  totalQuestions: number
  totalVotes: number
  totalUsers: number
  totalReports: number
  activeQuestions: number
  todayRegistrations: number
  onlineUsers: number
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
  const [deleteModal, setDeleteModal] = useState<{ id: string; text: string } | null>(null)
  const [deleteReason, setDeleteReason] = useState('inappropriate')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchModal, setBatchModal] = useState(false)
  const [batchReason, setBatchReason] = useState('inappropriate')
  const [batchLoading, setBatchLoading] = useState(false)

  // User list
  const [users, setUsers] = useState<{ id: string; email: string; created_at: string; last_sign_in_at: string | null }[]>([])
  const [usersOpen, setUsersOpen] = useState(false)
  const [usersLoading, setUsersLoading] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  // Question bank
  const [bankQuestions, setBankQuestions] = useState<BankQuestion[]>([])
  const [bankLoading, setBankLoading] = useState(false)
  const [bankSaving, setBankSaving] = useState(false)
  const [bankDeleting, setBankDeleting] = useState<string | null>(null)
  const [bankPrioritizing, setBankPrioritizing] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ question_text: '', option_a: '', option_b: '', category: '生活', duration_minutes: 1440 })
  const [editSaving, setEditSaving] = useState(false)
  const [showBankForm, setShowBankForm] = useState(false)
  const [newQ, setNewQ] = useState({ question_text: '', option_a: '', option_b: '', category: '生活', duration_minutes: 1440 })
  const [autoStatus, setAutoStatus] = useState<{ nextFireAt: string; remaining: number; nextQuestions: BankQuestion[] } | null>(null)
  const [countdown, setCountdown] = useState('')

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

  useEffect(() => {
    if (!autoStatus?.nextFireAt) return
    const update = () => {
      const diff = new Date(autoStatus.nextFireAt).getTime() - Date.now()
      if (diff <= 0) { setCountdown('即將發文...'); return }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setCountdown(`${h > 0 ? `${h} 小時 ` : ''}${m} 分 ${s} 秒`)
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [autoStatus?.nextFireAt])

  async function loadUsers() {
    setUsersLoading(true)
    const data = await fetch('/api/admin/users').then(r => r.json()).catch(() => [])
    setUsers(Array.isArray(data) ? data : [])
    setUsersLoading(false)
  }

  const loadBank = useCallback(async () => {
    setBankLoading(true)
    const [bankData, statusData] = await Promise.all([
      fetch('/api/admin/question-bank').then(r => r.json()),
      fetch('/api/admin/auto-post-status').then(r => r.json()),
    ])
    setBankQuestions(Array.isArray(bankData) ? bankData : [])
    if (!statusData.error) setAutoStatus(statusData)
    setBankLoading(false)
  }, [])

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
    if (tab === 'bank') loadBank()
  }, [authed, tab, loadReports, loadQuestions, loadBank])

  function showToast(msg: string, type: 'success' | 'error' = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  function openDeleteModal(id: string, text: string) {
    setDeleteReason('inappropriate')
    setDeleteModal({ id, text })
  }

  async function confirmDelete() {
    if (!deleteModal) return
    const { id } = deleteModal
    setDeleteModal(null)
    setActionId(id + ':delete')
    const res = await fetch('/api/admin/questions/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, reason: deleteReason }),
    })
    setActionId(null)
    if (res.ok) {
      showToast('已刪除題目，若發問者有開啟推播將收到通知')
      loadReports()
      loadQuestions()
      setStats(s => s ? { ...s, totalQuestions: s.totalQuestions - 1, totalReports: Math.max(0, s.totalReports - 1) } : s)
    } else {
      const d = await res.json().catch(() => ({}))
      showToast(`刪除失敗: ${d.error ?? res.status}`, 'error')
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelectedIds(new Set(questions.map(q => q.id)))
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  async function confirmBatchDelete() {
    if (selectedIds.size === 0) return
    setBatchLoading(true)
    const res = await fetch('/api/admin/questions/batch-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds), reason: batchReason }),
    })
    setBatchLoading(false)
    setBatchModal(false)
    if (res.ok) {
      const d = await res.json()
      showToast(`已批量刪除 ${d.count} 則問題`)
      setSelectedIds(new Set())
      loadQuestions()
      setStats(s => s ? { ...s, totalQuestions: s.totalQuestions - (d.count ?? 0) } : s)
    } else {
      const d = await res.json().catch(() => ({}))
      showToast(`批量刪除失敗: ${d.error ?? res.status}`, 'error')
    }
  }

  async function addBankQuestion() {
    if (!newQ.question_text.trim() || !newQ.option_a.trim() || !newQ.option_b.trim()) return
    setBankSaving(true)
    const res = await fetch('/api/admin/question-bank', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQ),
    })
    setBankSaving(false)
    if (res.ok) {
      const data = await res.json()
      setBankQuestions(prev => [data, ...prev])
      setNewQ({ question_text: '', option_a: '', option_b: '', category: '生活', duration_minutes: 1440 })
      setShowBankForm(false)
      showToast('✓ 已新增到題庫')
    } else {
      const d = await res.json().catch(() => ({}))
      showToast(d.error ?? '新增失敗', 'error')
    }
  }

  async function deleteBankQuestion(id: string) {
    setBankDeleting(id)
    const res = await fetch('/api/admin/question-bank/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setBankDeleting(null)
    if (res.ok) {
      setBankQuestions(prev => prev.filter(q => q.id !== id))
      showToast('已從題庫移除')
    } else {
      showToast('刪除失敗', 'error')
    }
  }

  function startEdit(q: BankQuestion) {
    setEditingId(q.id)
    setEditForm({ question_text: q.question_text, option_a: q.option_a, option_b: q.option_b, category: q.category, duration_minutes: q.duration_minutes })
  }

  async function saveEdit() {
    if (!editingId) return
    setEditSaving(true)
    const res = await fetch('/api/admin/question-bank/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingId, ...editForm }),
    })
    setEditSaving(false)
    if (res.ok) {
      const updated = await res.json()
      setBankQuestions(prev => prev.map(q => q.id === editingId ? { ...q, ...updated } : q))
      setEditingId(null)
      showToast('✓ 已儲存')
    } else {
      const d = await res.json().catch(() => ({}))
      showToast(d.error ?? '儲存失敗', 'error')
    }
  }

  async function togglePriority(id: string, current: boolean) {
    setBankPrioritizing(id)
    const res = await fetch('/api/admin/question-bank/set-priority', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_priority: !current }),
    })
    setBankPrioritizing(null)
    if (res.ok) {
      setBankQuestions(prev => prev.map(q => q.id === id ? { ...q, is_priority: !current } : q))
      showToast(!current ? '⚡ 已設為優先發文' : '已取消優先')
    } else {
      showToast('操作失敗', 'error')
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
    { key: 'questions', label: '📋 問題' },
    { key: 'bank', label: '📚 題庫' },
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

      {/* Delete reason modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold mb-1">確認刪除</h3>
            <p className="text-gray-400 text-sm mb-4 leading-snug">「{deleteModal.text.slice(0, 40)}{deleteModal.text.length > 40 ? '…' : ''}」</p>
            <p className="text-xs text-gray-500 mb-2">選擇刪除原因（將透過推播通知發問者）</p>
            <div className="space-y-2 mb-5">
              {[
                { value: 'spam', label: '垃圾訊息' },
                { value: 'inappropriate', label: '不當內容' },
                { value: 'hate', label: '仇恨言論' },
                { value: 'harassment', label: '騷擾霸凌' },
                { value: 'misinformation', label: '散佈錯誤資訊' },
                { value: 'other', label: '其他違規' },
              ].map(({ value, label }) => (
                <label key={value} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all ${deleteReason === value ? 'border-red-500/40 bg-red-500/10' : 'border-white/6 hover:bg-white/5'}`}>
                  <input type="radio" name="deleteReason" value={value} checked={deleteReason === value}
                    onChange={() => setDeleteReason(value)} className="accent-red-500" />
                  <span className="text-sm text-white">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-gray-400 hover:bg-white/5 transition-colors">
                取消
              </button>
              <button onClick={confirmDelete}
                className="flex-1 py-2.5 rounded-xl text-sm bg-red-500 text-white hover:bg-red-600 transition-colors font-medium">
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch delete modal */}
      {batchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-white font-bold mb-1">批量刪除確認</h3>
            <p className="text-gray-400 text-sm mb-4">即將刪除 <span className="text-red-400 font-bold">{selectedIds.size}</span> 則問題</p>
            <p className="text-xs text-gray-500 mb-2">選擇刪除原因</p>
            <div className="space-y-2 mb-5">
              {[
                { value: 'spam', label: '垃圾訊息' },
                { value: 'inappropriate', label: '不當內容' },
                { value: 'hate', label: '仇恨言論' },
                { value: 'harassment', label: '騷擾霸凌' },
                { value: 'misinformation', label: '散佈錯誤資訊' },
                { value: 'other', label: '其他違規' },
              ].map(({ value, label }) => (
                <label key={value} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer border transition-all ${batchReason === value ? 'border-red-500/40 bg-red-500/10' : 'border-white/6 hover:bg-white/5'}`}>
                  <input type="radio" name="batchReason" value={value} checked={batchReason === value}
                    onChange={() => setBatchReason(value)} className="accent-red-500" />
                  <span className="text-sm text-white">{label}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setBatchModal(false)}
                className="flex-1 py-2.5 rounded-xl text-sm border border-white/10 text-gray-400 hover:bg-white/5 transition-colors">
                取消
              </button>
              <button onClick={confirmBatchDelete} disabled={batchLoading}
                className="flex-1 py-2.5 rounded-xl text-sm bg-red-500 text-white hover:bg-red-600 transition-colors font-medium disabled:opacity-50">
                {batchLoading ? '刪除中...' : `確認刪除 ${selectedIds.size} 則`}
              </button>
            </div>
          </div>
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

            {/* User stats row */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="card p-5 border-green-500/15">
                <p className="text-xs text-gray-500 mb-1">今日新增用戶</p>
                <p className="text-3xl font-bold text-green-400">{stats?.todayRegistrations ?? '—'}</p>
                <p className="text-xs text-gray-600 mt-1">今天 0:00 起</p>
              </div>
              <div className="card p-5">
                <p className="text-xs text-gray-500 mb-1">總註冊人數</p>
                <p className="text-3xl font-bold text-white">{stats?.totalUsers ?? '—'}</p>
                <p className="text-xs text-gray-600 mt-1">累積用戶</p>
              </div>
              <div className="card p-5 border-violet-500/20 relative overflow-hidden">
                <div className="absolute top-3 right-3 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs text-green-400">即時</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">實時線上人數</p>
                <p className="text-3xl font-bold gradient-text">{stats?.onlineUsers ?? '—'}</p>
                <p className="text-xs text-gray-600 mt-1">5 分鐘內活躍</p>
              </div>
            </div>

            {/* Platform stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: '總問題數', value: stats?.totalQuestions ?? '—', sub: `進行中 ${stats?.activeQuestions ?? 0}` },
                { label: '總投票數', value: stats?.totalVotes?.toLocaleString() ?? '—', sub: '累積' },
                { label: '待處理檢舉', value: stats?.totalReports ?? '—', sub: '需人工審核', warn: (stats?.totalReports ?? 0) > 0 },
                { label: '題庫剩餘', value: autoStatus?.remaining ?? '—', sub: '未發出的題目' },
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

            {/* User list dropdown */}
            <div className="card overflow-hidden mt-4">
              <button
                onClick={() => {
                  const next = !usersOpen
                  setUsersOpen(next)
                  if (next && users.length === 0) loadUsers()
                }}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-300">👤 註冊用戶清單</span>
                  <span className="text-xs text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                    {stats?.totalUsers ?? 0} 人
                  </span>
                </div>
                <span className={`text-gray-500 text-sm transition-transform duration-200 ${usersOpen ? 'rotate-180' : ''}`}>▼</span>
              </button>

              {usersOpen && (
                <div className="border-t border-white/5 px-5 pb-4">
                  <div className="flex items-center gap-2 mt-3 mb-3">
                    <input
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      placeholder="搜尋 Email..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-violet-500/40"
                    />
                    <button onClick={loadUsers} className="text-xs text-gray-500 hover:text-white transition-colors px-3 py-2">
                      ↻
                    </button>
                  </div>

                  {usersLoading ? (
                    <div className="flex justify-center py-6">
                      <div className="w-6 h-6 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                      {users
                        .filter(u => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                        .map((u, i) => (
                          <div key={u.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/4 transition-colors group">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs text-gray-600 w-5 shrink-0">{i + 1}</span>
                              <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center shrink-0">
                                <span className="text-xs text-violet-400 font-medium">
                                  {u.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm text-gray-200 truncate">{u.email}</span>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <p className="text-xs text-gray-500">
                                {new Date(u.created_at).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                              </p>
                              {u.last_sign_in_at && (
                                <p className="text-xs text-gray-600">
                                  登入 {new Date(u.last_sign_in_at).toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      {users.filter(u => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase())).length === 0 && (
                        <p className="text-center text-gray-600 text-sm py-6">找不到符合的用戶</p>
                      )}
                    </div>
                  )}
                </div>
              )}
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
                          onClick={() => openDeleteModal(q.id, q.question_text)}
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

            {/* Batch action toolbar */}
            {questions.length > 0 && (
              <div className="flex items-center gap-3 mb-3 px-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-white transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === questions.length && questions.length > 0}
                    onChange={e => e.target.checked ? selectAll() : clearSelection()}
                    className="accent-violet-500 w-4 h-4"
                  />
                  全選
                </label>
                {selectedIds.size > 0 && (
                  <>
                    <span className="text-xs text-gray-500">已選 <span className="text-white font-medium">{selectedIds.size}</span> 則</span>
                    <button
                      onClick={clearSelection}
                      className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      取消選擇
                    </button>
                    <button
                      onClick={() => { setBatchReason('inappropriate'); setBatchModal(true) }}
                      className="ml-auto px-4 py-1.5 rounded-xl text-xs bg-red-500 text-white hover:bg-red-600 transition-colors font-medium"
                    >
                      🗑 批量刪除 ({selectedIds.size})
                    </button>
                  </>
                )}
              </div>
            )}

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
                  <div key={q.id} className={`card p-4 flex items-center gap-3 transition-all ${selectedIds.has(q.id) ? 'border-red-500/30 bg-red-500/5' : ''}`}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(q.id)}
                      onChange={() => toggleSelect(q.id)}
                      className="accent-red-500 w-4 h-4 shrink-0"
                    />
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
                        onClick={() => openDeleteModal(q.id, q.question_text)}
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
        {/* Question Bank */}
        {tab === 'bank' && (
          <div>
            {/* Next auto-post status */}
            {autoStatus && (
              <div className="rounded-2xl border border-violet-500/25 bg-violet-500/8 p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  <p className="text-xs font-semibold text-violet-300">下次自動發文</p>
                  <span className="ml-auto text-xs text-gray-500">題庫剩 {autoStatus.remaining} 題可用</span>
                </div>
                <p className="text-2xl font-bold text-white tabular-nums mb-3">{countdown || '計算中...'}</p>
                {autoStatus.nextQuestions.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-1.5">下一批將發：</p>
                    {autoStatus.nextQuestions.map((q, i) => (
                      <div key={q.id} className="flex items-start gap-2.5 bg-white/5 rounded-xl px-3 py-2.5">
                        <span className="text-xs text-violet-400 font-bold shrink-0 mt-0.5">#{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-white text-xs font-medium leading-snug">{q.question_text}</p>
                          <p className="text-gray-500 text-xs mt-0.5">A: {q.option_a} / B: {q.option_b}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-red-400">⚠️ 題庫已用完，請新增更多題目</p>
                )}
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold">自動發文題庫</h2>
                <p className="text-xs text-gray-500 mt-0.5">共 {bankQuestions.length} 題 · 每天台灣 8am–10pm 每小時自動發 2 則</p>
              </div>
              <button
                onClick={() => setShowBankForm(v => !v)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${showBankForm ? 'bg-white/10 text-gray-300' : 'gradient-bg text-white'}`}
              >
                {showBankForm ? '✕ 收起' : '＋ 新增題目'}
              </button>
            </div>

            {/* Add form */}
            {showBankForm && (
              <div className="card p-5 mb-4 border-violet-500/20">
                <p className="text-xs text-violet-400 font-medium mb-4">新增問題到題庫</p>

                {/* Question text */}
                <div className="mb-3">
                  <label className="text-xs text-gray-500 mb-1.5 block">問題內容 *</label>
                  <textarea
                    value={newQ.question_text}
                    onChange={e => setNewQ(q => ({ ...q, question_text: e.target.value }))}
                    placeholder="例如：你是夜貓族還是早鳥族？"
                    rows={2}
                    className="w-full bg-[#252525] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder-gray-600 resize-none"
                  />
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">選項 A *</label>
                    <input
                      value={newQ.option_a}
                      onChange={e => setNewQ(q => ({ ...q, option_a: e.target.value }))}
                      placeholder="例如：夜貓族"
                      className="w-full bg-[#252525] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">選項 B *</label>
                    <input
                      value={newQ.option_b}
                      onChange={e => setNewQ(q => ({ ...q, option_b: e.target.value }))}
                      placeholder="例如：早鳥族"
                      className="w-full bg-[#252525] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-violet-500/50 placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Category + Duration */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">分類</label>
                    <select
                      value={newQ.category}
                      onChange={e => setNewQ(q => ({ ...q, category: e.target.value }))}
                      className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1.5 block">發布時長</label>
                    <select
                      value={newQ.duration_minutes}
                      onChange={e => setNewQ(q => ({ ...q, duration_minutes: Number(e.target.value) }))}
                      className="w-full bg-[#252525] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-gray-300 focus:outline-none"
                    >
                      <option value={720}>12 小時</option>
                      <option value={1440}>1 天</option>
                      <option value={2880}>2 天</option>
                      <option value={4320}>3 天</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={addBankQuestion}
                  disabled={bankSaving || !newQ.question_text.trim() || !newQ.option_a.trim() || !newQ.option_b.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold gradient-bg text-white disabled:opacity-40 transition-all"
                >
                  {bankSaving ? '新增中...' : '＋ 加入題庫'}
                </button>
              </div>
            )}

            {/* List */}
            {bankLoading ? (
              <div className="flex justify-center mt-16">
                <div className="w-8 h-8 border-2 border-violet-500/40 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : bankQuestions.length === 0 ? (
              <div className="text-center mt-16 text-gray-600">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm mb-4">題庫是空的</p>
                <button onClick={() => setShowBankForm(true)} className="btn-gradient px-6 py-2.5 rounded-xl text-sm">
                  新增第一題
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {bankQuestions.map(q => (
                  <div key={q.id} className={`card p-4 transition-all ${q.is_priority ? 'border-amber-500/30 bg-amber-500/5' : ''}`}>
                    {editingId === q.id ? (
                      /* Edit mode */
                      <div className="space-y-2.5">
                        <textarea
                          value={editForm.question_text}
                          onChange={e => setEditForm(f => ({ ...f, question_text: e.target.value }))}
                          rows={2}
                          className="w-full bg-[#1e1e1e] border border-violet-500/40 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none resize-none"
                          placeholder="問題內容"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            value={editForm.option_a}
                            onChange={e => setEditForm(f => ({ ...f, option_a: e.target.value }))}
                            className="bg-[#1e1e1e] border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                            placeholder="選項 A"
                          />
                          <input
                            value={editForm.option_b}
                            onChange={e => setEditForm(f => ({ ...f, option_b: e.target.value }))}
                            className="bg-[#1e1e1e] border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none"
                            placeholder="選項 B"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={editForm.category}
                            onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))}
                            className="bg-[#1e1e1e] border border-white/15 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none"
                          >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select
                            value={editForm.duration_minutes}
                            onChange={e => setEditForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                            className="bg-[#1e1e1e] border border-white/15 rounded-xl px-3 py-2 text-sm text-gray-300 focus:outline-none"
                          >
                            <option value={720}>12 小時</option>
                            <option value={1440}>1 天</option>
                            <option value={2880}>2 天</option>
                            <option value={4320}>3 天</option>
                          </select>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setEditingId(null)}
                            className="flex-1 py-2 rounded-xl text-sm border border-white/10 text-gray-400 hover:bg-white/5 transition-colors">
                            取消
                          </button>
                          <button onClick={saveEdit} disabled={editSaving}
                            className="flex-1 py-2 rounded-xl text-sm gradient-bg text-white font-medium disabled:opacity-50 transition-all">
                            {editSaving ? '儲存中...' : '✓ 儲存'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View mode */
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          {q.is_priority && (
                            <span className="inline-block px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/25 font-medium mb-1.5">⚡ 優先</span>
                          )}
                          <p className="text-white text-sm font-medium leading-snug mb-2">{q.question_text}</p>
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            <span className="px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-300 text-xs font-medium">A: {q.option_a}</span>
                            <span className="px-2.5 py-1 rounded-lg bg-white/8 text-gray-300 text-xs font-medium">B: {q.option_b}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <span className="px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{q.category}</span>
                            <span>·</span>
                            <span>{q.duration_minutes >= 1440 ? `${q.duration_minutes / 1440} 天` : `${q.duration_minutes / 60} 小時`}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            onClick={() => startEdit(q)}
                            className="w-8 h-8 rounded-xl bg-white/8 text-gray-400 hover:bg-violet-500/20 hover:text-violet-400 transition-colors flex items-center justify-center text-sm"
                            title="編輯"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => togglePriority(q.id, q.is_priority)}
                            disabled={bankPrioritizing === q.id}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-colors disabled:opacity-40 ${
                              q.is_priority
                                ? 'bg-amber-500/30 text-amber-400 hover:bg-amber-500/50'
                                : 'bg-white/8 text-gray-500 hover:bg-amber-500/20 hover:text-amber-400'
                            }`}
                            title={q.is_priority ? '取消優先' : '設為優先發文'}
                          >
                            {bankPrioritizing === q.id ? '·' : '⚡'}
                          </button>
                          <button
                            onClick={() => deleteBankQuestion(q.id)}
                            disabled={bankDeleting === q.id}
                            className="w-8 h-8 rounded-xl bg-red-500/15 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center text-sm disabled:opacity-40"
                          >
                            {bankDeleting === q.id ? '·' : '🗑'}
                          </button>
                        </div>
                      </div>
                    )}
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
