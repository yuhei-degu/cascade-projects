'use client'
// components/admin/QRCodeDisplay.tsx
// QRコードのプレビューと印刷モーダル（A3）

import { useEffect, useState } from 'react'
import { generateQRDataUrl } from '@/lib/qr'
import type { Table } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface QRCodeDisplayProps {
  table: Table
  onClose: () => void
}

export function QRCodeDisplay({ table, onClose }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    generateQRDataUrl(table.table_number)
      .then(setQrDataUrl)
      .finally(() => setLoading(false))
  }, [table.table_number])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!qrDataUrl) return
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = `QR_${table.table_number}.png`
    a.click()
  }

  return (
    <>
      {/* 通常表示用モーダル */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />

        {/* モーダル本体 */}
        <div className="relative z-10 bg-white rounded-3xl p-6 shadow-2xl w-full max-w-xs">
          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-200"
          >
            ✕
          </button>

          <h3 className="font-sans font-bold text-brand-dark text-lg mb-1 text-center">
            席 {table.table_number}
          </h3>
          <p className="font-sans text-xs text-gray-400 text-center mb-5">
            お客様にこのQRコードを読み取っていただきます
          </p>

          {/* QRコード表示エリア */}
          <div className="bg-brand-cream rounded-2xl p-4 flex flex-col items-center qr-print-container">
            {loading ? (
              <div className="h-48 w-48 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full border-2 border-brand-red/30 border-t-brand-red animate-spin" />
              </div>
            ) : qrDataUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt={`席${table.table_number}のQRコード`}
                  className="w-48 h-48"
                />
                <p className="font-serif font-bold text-brand-dark text-lg mt-3">
                  席 {table.table_number}
                </p>
                <p className="font-sans text-xs text-brand-dark/50 mt-1">
                  QRコードを読み取って注文
                </p>
              </>
            ) : (
              <p className="text-sm text-red-500">QRコードの生成に失敗しました</p>
            )}
          </div>

          {/* アクションボタン */}
          <div className="flex gap-3 mt-5">
            <button
              onClick={handleDownload}
              disabled={!qrDataUrl}
              className={cn(
                'flex-1 h-11 rounded-xl font-sans font-semibold text-sm',
                'border-2 border-gray-200 text-gray-600',
                'hover:border-gray-400 transition-colors',
                'disabled:opacity-50'
              )}
            >
              ⬇ 保存
            </button>
            <button
              onClick={handlePrint}
              disabled={!qrDataUrl}
              className={cn(
                'flex-1 h-11 rounded-xl font-sans font-bold text-sm',
                'bg-brand-red text-white',
                'hover:bg-red-700 transition-colors',
                'disabled:opacity-50'
              )}
            >
              🖨 印刷
            </button>
          </div>
        </div>
      </div>

      {/* 印刷専用レイアウト（印刷時のみ表示） */}
      {qrDataUrl && (
        <div className="hidden print:block print:fixed print:inset-0 print:flex print:items-center print:justify-center">
          <div className="text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrDataUrl}
              alt={`席${table.table_number}のQRコード`}
              className="w-64 h-64 mx-auto"
            />
            <p className="font-serif font-bold text-brand-dark text-2xl mt-4">
              席 {table.table_number}
            </p>
            <p className="font-sans text-sm text-brand-dark/60 mt-2">
              QRコードをスマートフォンで読み取ってご注文ください
            </p>
          </div>
        </div>
      )}
    </>
  )
}
