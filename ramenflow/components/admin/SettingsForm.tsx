'use client'
// components/admin/SettingsForm.tsx
// 店舗基本設定フォーム（A4）

import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { updateStoreSettings } from '@/actions/settings'
import { cn } from '@/lib/utils'

const schema = z.object({
  store_name: z.string().min(1, '店舗名を入力してください').max(50),
  description: z.string().max(200).optional(),
  staff_count: z
    .number({ invalid_type_error: '数値を入力してください' })
    .int()
    .min(1, '1人以上で設定してください')
    .max(20),
  parallel_cooking_capacity: z
    .number({ invalid_type_error: '数値を入力してください' })
    .int()
    .min(1, '1以上で設定してください')
    .max(30),
})

type FormValues = z.infer<typeof schema>

interface SettingsFormProps {
  defaultValues: FormValues
}

// ---- フォームフィールドの共通スタイル ----
function FieldWrapper({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block font-sans font-bold text-base text-brand-dark mb-1.5">
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-base font-sans text-red-600">{error}</p>
      )}
    </div>
  )
}

const inputClass = cn(
  'w-full h-14 px-4 rounded-xl border-2 font-sans text-lg text-brand-dark',
  'bg-white outline-none transition-colors',
  'border-gray-200 focus:border-brand-red',
  'placeholder:text-gray-300'
)

export function SettingsForm({ defaultValues }: SettingsFormProps) {
  const [isPending, startTransition] = useTransition()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      setSuccessMsg(null)
      setErrorMsg(null)

      const result = await updateStoreSettings(data)
      if ('error' in result) {
        setErrorMsg(result.error)
        return
      }
      setSuccessMsg('設定を保存しました')
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-5">

      {/* 店舗名 */}
      <FieldWrapper label="店舗名" error={errors.store_name?.message}>
        <input
          {...register('store_name')}
          type="text"
          placeholder="例：博多ラーメン 一風堂"
          className={cn(inputClass, errors.store_name && 'border-red-400')}
        />
      </FieldWrapper>

      {/* 紹介文 */}
      <FieldWrapper label="店舗紹介文（省略可）" error={errors.description?.message}>
        <textarea
          {...register('description')}
          rows={3}
          placeholder="ホームページに表示される店舗の紹介文を入力してください"
          className={cn(
            'w-full px-4 py-3 rounded-xl border-2 font-sans text-lg text-brand-dark',
            'bg-white outline-none transition-colors resize-none',
            'border-gray-200 focus:border-brand-red',
            'placeholder:text-gray-300'
          )}
        />
      </FieldWrapper>

      {/* スタッフ人数 */}
      <FieldWrapper label="本日のスタッフ人数" error={errors.staff_count?.message}>
        <div className="flex items-center gap-3">
          <input
            {...register('staff_count', { valueAsNumber: true })}
            type="number"
            min={1}
            max={20}
            className={cn(inputClass, 'w-28 text-center text-2xl font-bold', errors.staff_count && 'border-red-400')}
          />
          <span className="font-sans text-sm text-gray-500">人（1〜20）</span>
        </div>
      </FieldWrapper>

      {/* 同時調理可能数 */}
      <FieldWrapper label="同時調理可能数" error={errors.parallel_cooking_capacity?.message}>
        <div className="flex items-center gap-3">
          <input
            {...register('parallel_cooking_capacity', { valueAsNumber: true })}
            type="number"
            min={1}
            max={30}
            className={cn(inputClass, 'w-28 text-center text-2xl font-bold', errors.parallel_cooking_capacity && 'border-red-400')}
          />
          <span className="font-sans text-sm text-gray-500">杯（コンロ・鍋の数が目安）</span>
        </div>
      </FieldWrapper>

      {/* フィードバック */}
      {successMsg && (
        <p className="text-base font-sans text-status-delivered bg-green-50 rounded-xl px-4 py-2.5">
          ✓ {successMsg}
        </p>
      )}
      {errorMsg && (
        <p className="text-base font-sans text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
          {errorMsg}
        </p>
      )}

      {/* 保存ボタン */}
      <button
        type="submit"
        disabled={isPending || !isDirty}
        className={cn(
          'w-full h-14 rounded-xl font-sans font-bold text-lg transition-all',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isDirty
            ? 'bg-brand-red text-white hover:bg-red-700'
            : 'bg-gray-100 text-gray-400'
        )}
      >
        {isPending ? '保存中...' : '設定を保存する'}
      </button>
    </form>
  )
}
