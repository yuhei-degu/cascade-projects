// lib/qr.ts
// RamenFlow QRコード生成 + Supabase Storage 保存
// Server Actions からのみ呼び出すこと（Node.js 環境が必要）

import QRCode from 'qrcode'
import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET = 'qr-codes'

/**
 * QRコードを生成して Supabase Storage に保存し、公開URLを返す
 *
 * @param tableId   - テーブルのUUID（Storageのファイル名に使用）
 * @param tableNumber - 席番号（QRに埋め込むURLのパラメータ）
 * @returns Storage上の公開URL
 */
export async function generateAndStoreQR(
  tableId: string,
  tableNumber: string
): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const orderUrl = `${appUrl}/order?table=${encodeURIComponent(tableNumber)}`

  // PNG バッファを生成
  const pngBuffer = await QRCode.toBuffer(orderUrl, {
    type: 'png',
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark:  '#2C1810', // brand-dark（墨色）
      light: '#FDF6E3', // brand-cream（和紙色）
    },
  })

  // Supabase Storage へアップロード（上書き）
  const supabase = createAdminClient()
  const filePath = `${tableId}.png`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, pngBuffer, {
      contentType: 'image/png',
      upsert: true,       // 既存ファイルを上書き
      cacheControl: '3600',
    })

  if (uploadError) {
    throw new Error(
      `QRコードのアップロードに失敗しました: ${uploadError.message}`
    )
  }

  // 公開URLを取得
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Storage から QRコードを削除する
 * 席削除時に呼び出す
 */
export async function deleteQR(tableId: string): Promise<void> {
  const supabase = createAdminClient()
  const filePath = `${tableId}.png`

  await supabase.storage.from(BUCKET).remove([filePath])
  // 削除失敗はログだけ出して握り潰す（ファイルが存在しない場合もある）
}

/**
 * QRコードのデータURL（base64）を返す
 * 印刷プレビュー用（ブラウザ表示専用・Storageを使わない）
 */
export async function generateQRDataUrl(tableNumber: string): Promise<string> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const orderUrl = `${appUrl}/order?table=${encodeURIComponent(tableNumber)}`

  return QRCode.toDataURL(orderUrl, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark:  '#2C1810',
      light: '#FDF6E3',
    },
  })
}
