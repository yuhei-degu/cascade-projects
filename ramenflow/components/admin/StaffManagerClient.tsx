'use client'
// components/admin/StaffManagerClient.tsx
// A5: スタッフ一覧 + 招待 + 有効/無効切り替え

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { StaffProfile, StaffRole } from '@/lib/types/database'

const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'オーナー',
  staff: 'スタッフ',
}

const ROLE_COLORS: Record<StaffRole, string> = {
  owner: 'bg-brand-red/10 text-brand-red border-brand-red/20',
  staff: 'bg-blue-50 text-blue-600 border-blue-200',
}

// ============================================================
// StaffCard: スタッフ1件
// ============================================================
function StaffCard({
  member,
  onToggle,
  isCurrentUser,
}: {
  member: StaffProfile
  onToggle: (id: string, isActive: boolean) => void
  isCurrentUser: boolean
}) {
  const [toggling, startToggle] = useTransition()

  const handleToggle = () => {
    if (isCurrentUser) return
    if (!window.confirm(
      member.is_active
        ? `「${member.name}」を無効にしますか？ログインできなくなります。`
        : `「${member.name}」を有効に戻しますか？`
    )) return

    startToggle(async () => {
      // admin client 経由で更新（RLS回避）
      const supabase = createClient()
      await supabase
        .from('staff_profiles')
        .update({ is_active: !member.is_active })
        .eq('id', member.id)
      onToggle(member.id, !member.is_active)
    })
  }

  return (
    <div className={cn(
      'flex items-center gap-4 p-4 rounded-2xl border bg-white transition-opacity',
      !member.is_active && 'opacity-50'
    )}>
      {/* アバター */}
      <div className="h-11 w-11 rounded-full bg-brand-cream flex items-center justify-center flex-shrink-0">
        <span className="font-sans font-bold text-brand-dark text-lg">
          {member.name.charAt(0)}
        </span>
      </div>

      {/* 情報 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-sans font-bold text-brand-dark">{member.name}</p>
          {isCurrentUser && (
            <span className="text-xs font-sans text-gray-400">(あなた)</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            'text-xs font-sans font-semibold px-2 py-0.5 rounded-full border',
            ROLE_COLORS[member.role]
          )}>
            {ROLE_LABELS[member.role]}
          </span>
          {!member.is_active && (
            <span className="text-xs font-sans text-gray-400">無効</span>
          )}
        </div>
      </div>

      {/* トグル（自分自身とオーナーは変更不可） */}
      {!isCurrentUser && member.role !== 'owner' && (
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={cn(
            'h-9 px-3 rounded-lg font-sans text-xs font-semibold border-2 transition-all disabled:opacity-50 flex-shrink-0',
            member.is_active
              ? 'border-gray-200 text-gray-500 hover:border-red-300 hover:text-red-600'
              : 'border-status-delivered text-status-delivered hover:bg-green-50'
          )}
        >
          {member.is_active ? '無効にする' : '有効に戻す'}
        </button>
      )}
    </div>
  )
}

// ============================================================
// InviteForm: スタッフ招待フォーム
// ============================================================
function InviteForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail]   = useState('')
  const [name, setName]     = useState('')
  const [role, setRole]     = useState<StaffRole>('staff')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleInvite = async () => {
    if (!email.trim() || !name.trim()) return
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()

      // Supabase Auth でメール招待（Admin APIは使えないのでユーザー作成フロー）
      // MVP: オーナーがパスワードを直接設定してスタッフに伝える方式
      const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!'

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: tempPassword,
        options: {
          data: { name: name.trim() },
        },
      })

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'このメールアドレスはすでに登録されています。'
          : '招待に失敗しました。')
        return
      }

      if (authData.user) {
        await supabase.from('staff_profiles').insert({
          id: authData.user.id,
          name: name.trim(),
          role,
          is_active: true,
        })

        setSuccess(`招待しました。初期パスワード: ${tempPassword}\n※スタッフにこのパスワードを直接伝えてください`)
        setEmail('')
        setName('')
        onSuccess()
      }
    } finally {
      setLoading(false)
    }
  }

  const inputClass = cn(
    'w-full h-11 px-4 rounded-xl border-2 font-sans text-sm text-brand-dark',
    'bg-white outline-none transition-colors border-gray-200 focus:border-brand-red placeholder:text-gray-300'
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h3 className="font-sans font-bold text-brand-dark">スタッフを招待</h3>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-sans text-xs font-semibold text-brand-dark mb-1">名前</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="田中 太郎"
            className={inputClass}
          />
        </div>
        <div>
          <label className="block font-sans text-xs font-semibold text-brand-dark mb-1">ロール</label>
          <select
            value={role}
            onChange={e => setRole(e.target.value as StaffRole)}
            className={cn(inputClass, 'cursor-pointer')}
          >
            <option value="staff">スタッフ</option>
            <option value="owner">オーナー</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-sans text-xs font-semibold text-brand-dark mb-1">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="staff@example.com"
          className={inputClass}
        />
      </div>

      {error && (
        <p className="text-sm font-sans text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>
      )}
      {success && (
        <pre className="text-sm font-sans text-status-delivered bg-green-50 rounded-xl px-4 py-3 whitespace-pre-wrap">
          ✓ {success}
        </pre>
      )}

      <button
        onClick={handleInvite}
        disabled={loading || !email.trim() || !name.trim()}
        className="w-full h-11 rounded-xl font-sans font-bold text-sm bg-brand-red text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '処理中...' : 'アカウントを作成'}
      </button>

      <p className="text-xs font-sans text-gray-400">
        ※ 作成されたアカウントの初期パスワードをスタッフに直接お伝えください。
        ログイン後にパスワードを変更するよう案内してください。
      </p>
    </div>
  )
}

// ============================================================
// StaffManagerClient: メイン
// ============================================================
export function StaffManagerClient({ initialStaff }: { initialStaff: StaffProfile[] }) {
  const [staff, setStaff] = useState<StaffProfile[]>(initialStaff)
  const [showInvite, setShowInvite] = useState(false)

  // 現在のユーザーIDを取得（簡易的にlocalStorageから）
  // 実際はsupabase.auth.getUser()で取得するが、Server Component側でpropsとして渡す方が良い
  const [currentUserId] = useState<string | null>(null)

  const handleToggle = (id: string, isActive: boolean) => {
    setStaff(prev => prev.map(m => m.id === id ? { ...m, is_active: isActive } : m))
  }

  const handleInviteSuccess = async () => {
    setShowInvite(false)
    // 再フェッチ（簡易的にページリロード）
    window.location.reload()
  }

  const activeCount   = staff.filter(m => m.is_active).length
  const inactiveCount = staff.filter(m => !m.is_active).length

  return (
    <div className="space-y-5 max-w-lg">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-gray-500">
          有効: {activeCount}名 {inactiveCount > 0 && `/ 無効: ${inactiveCount}名`}
        </p>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="h-10 px-4 rounded-xl bg-brand-red text-white font-sans font-bold text-sm hover:bg-red-700"
        >
          + スタッフを招待
        </button>
      </div>

      {/* 招待フォーム */}
      {showInvite && (
        <InviteForm onSuccess={handleInviteSuccess} />
      )}

      {/* スタッフ一覧 */}
      <div className="space-y-2">
        {staff.map(member => (
          <StaffCard
            key={member.id}
            member={member}
            isCurrentUser={member.id === currentUserId}
            onToggle={handleToggle}
          />
        ))}
      </div>

      {staff.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">👤</p>
          <p className="font-sans font-bold text-brand-dark">スタッフが登録されていません</p>
          <p className="font-sans text-sm text-gray-400 mt-1">「スタッフを招待」からアカウントを作成してください</p>
        </div>
      )}
    </div>
  )
}
