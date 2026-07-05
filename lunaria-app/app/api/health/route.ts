import { NextResponse } from 'next/server'
import { getHealthReport } from '@/lib/lunaria/health'
import { getAuthenticatedUserId } from '../_auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET() {
  const auth = await getAuthenticatedUserId()
  if ('response' in auth) return auth.response

  const report = await getHealthReport(auth.userId)
  return NextResponse.json(report, {
    status: report.status === 'ok' ? 200 : 503,
  })
}
