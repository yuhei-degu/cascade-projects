// app/admin/staff/page.tsx
// A5: スタッフアカウント管理画面

import { createClient } from '@/lib/supabase/server'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { StaffManagerClient } from '@/components/admin/StaffManagerClient'

export const dynamic = 'force-dynamic'

export default async function AdminStaffPage() {
  const supabase = await createClient()

  const { data: staff } = await supabase
    .from('staff_profiles')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <AdminLayout title="スタッフ管理">
      <StaffManagerClient initialStaff={staff ?? []} />
    </AdminLayout>
  )
}
