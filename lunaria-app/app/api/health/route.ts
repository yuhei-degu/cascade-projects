import { NextResponse } from 'next/server'
import { getHealthReport } from '@/lib/lunaria/health'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

export async function GET() {
  const report = await getHealthReport()
  return NextResponse.json(report, {
    status: report.status === 'ok' ? 200 : 503,
  })
}
