'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { prepareOrderConfirmation, submitOrder } from '@/actions/order'
import { CustomerLayout } from '@/components/layout/CustomerLayout'
import { formatPrice } from '@/hooks/useCart'
import { cn } from '@/lib/utils'
import type { CartState } from '@/lib/types/database'

function CustomerErrorPage({
  message,
  onRestart,
}: {
  message: string
  onRestart: () => void
}) {
  return (
    <CustomerLayout title="エラー">
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full rounded-2xl bg-white border border-red-100 p-6 text-center shadow-sm">
          <p className="text-4xl mb-4">!</p>
          <h1 className="font-sans font-black text-xl text-brand-dark mb-3">
            注文内容を確認できません
          </h1>
          <p className="font-sans text-sm leading-6 text-brand-dark/60">
            {message}
          </p>
          <button
            onClick={onRestart}
            className="mt-6 w-full h-12 rounded-2xl bg-brand-red text-white font-sans font-bold"
          >
            最初からやり直す
          </button>
        </div>
      </div>
    </CustomerLayout>
  )
}

export default function OrderConfirmPage() {
  const router = useRouter()
  const [cart, setCart] = useState<CartState | null>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    async function initialize() {
      const raw = sessionStorage.getItem('rf_cart')
      if (!raw) {
        router.replace('/order')
        return
      }

      const parsed = JSON.parse(raw) as CartState
      if (!parsed.items || parsed.items.length === 0) {
        router.replace('/order/menu')
        return
      }

      const tableId = sessionStorage.getItem('rf_table_id') ?? parsed.tableId
      const result = await prepareOrderConfirmation({ tableId })

      if ('error' in result) {
        setPageError(result.error)
        setInitializing(false)
        return
      }

      setCart({ ...parsed, tableId, tableNumber: result.data.tableNumber })
      setInitializing(false)
    }

    initialize().catch(() => {
      setPageError('注文内容の確認中にエラーが発生しました。QRコードを読み取り直してください。')
      setInitializing(false)
    })
  }, [router])

  if (pageError) {
    return (
      <CustomerErrorPage
        message={pageError}
        onRestart={() => router.replace('/')}
      />
    )
  }

  if (initializing || !cart) {
    return (
      <CustomerLayout title="注文確認">
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-brand-red/30 border-t-brand-red animate-spin" />
          <p className="font-sans text-sm text-brand-dark/50">注文内容を確認しています</p>
        </div>
      </CustomerLayout>
    )
  }

  const totalAmount = cart.items.reduce((sum, item) => {
    const optsDelta = item.selectedOptions.reduce((s, option) => s + option.price_delta, 0)
    return sum + (item.unitPrice + optsDelta) * item.quantity
  }, 0)

  const totalCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  const handleSubmit = async () => {
    if (loading) return
    setLoading(true)
    setError(null)

    const result = await submitOrder({
      tableId: cart.tableId,
      items: cart.items.map(item => ({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        selectedOptions: item.selectedOptions,
        notes: item.notes,
      })),
    })

    if ('error' in result) {
      setError(result.error)
      setLoading(false)
      return
    }

    sessionStorage.removeItem('rf_cart')
    router.push(`/order/status/${result.data.orderId}`)
  }

  return (
    <CustomerLayout title="注文確認" onBack={() => router.back()}>
      <div className="flex-1 flex flex-col">
        <div className="mx-4 mt-4 px-4 py-3 bg-brand-light rounded-2xl flex items-center gap-3 border border-brand-dark/10">
          <span className="text-xl">席</span>
          <div>
            <p className="font-sans text-xs text-brand-dark/50">お席</p>
            <p className="font-sans font-black text-xl text-brand-dark leading-none">
              {cart.tableNumber}
            </p>
          </div>
        </div>

        <div className="flex-1 px-4 mt-4 space-y-3 overflow-y-auto pb-4">
          <h2 className="font-sans font-bold text-sm text-brand-dark/50">ご注文内容</h2>
          {cart.items.map(item => {
            const optsDelta = item.selectedOptions.reduce((sum, option) => sum + option.price_delta, 0)
            const lineTotal = (item.unitPrice + optsDelta) * item.quantity
            return (
              <div key={item.cartItemId} className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-bold text-brand-dark">{item.menuItemName}</p>
                    {item.selectedOptions.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.selectedOptions.map(option => (
                          <span key={option.option_id} className="text-xs font-sans bg-brand-cream text-brand-dark/60 px-2 py-0.5 rounded-full">
                            {option.group_name}: {option.option_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-sans font-bold text-brand-dark text-base">{formatPrice(lineTotal)}</p>
                    <p className="font-sans text-xs text-gray-400">{formatPrice(item.unitPrice + optsDelta)} × {item.quantity}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-4 pb-10 border-t border-gray-100 pt-4 bg-brand-cream bottom-safe-area">
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans font-bold text-brand-dark">{totalCount}品 合計</p>
            <p className="font-sans font-black text-2xl text-brand-red">{formatPrice(totalAmount)}</p>
          </div>

          {error && (
            <div className="mb-3 px-4 py-3 bg-red-50 rounded-xl text-sm font-sans text-red-700">{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={cn(
              'w-full h-16 rounded-2xl font-sans font-black text-xl text-white',
              'bg-brand-red transition-all duration-150',
              'hover:bg-red-700 active:bg-red-800',
              'disabled:opacity-60 disabled:cursor-not-allowed',
              'flex items-center justify-center gap-2',
              'shadow-lg shadow-brand-red/20'
            )}
          >
            {loading ? (
              <>
                <span className="h-6 w-6 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <span>送信中...</span>
              </>
            ) : '注文を確定する'}
          </button>
          <p className="font-sans text-xs text-brand-dark/30 text-center mt-2">確定後の取り消しはスタッフにお声がけください</p>
        </div>
      </div>
    </CustomerLayout>
  )
}
