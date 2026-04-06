// app/admin/tables/page.tsx
// A3: 席管理・QRコード生成画面

import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { TableManagerClient } from '@/components/admin/TableManagerClient'

export const dynamic = 'force-dynamic'

export default async function AdminTablesPage() {
  const supabase = await createClient()
  const { data: tables } = await supabase
    .from('tables')
    .select('*')
    .order('table_number', { ascending: true })

  return (
    <AdminLayout title="席・QRコード管理">
      <TableManagerClient initialTables={tables ?? []} />
    </AdminLayout>
  )
}
