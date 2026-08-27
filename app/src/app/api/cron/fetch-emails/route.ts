import { NextResponse } from 'next/server';
import { syncMailboxNow } from '@/app/actions/config-mail';

export async function GET(req: Request) {
  // Vérification optionnelle pour Cron Vercel
  const authHeader = req.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await syncMailboxNow();
  if (result.success) {
    return NextResponse.json(result);
  } else {
    return NextResponse.json(result, { status: 500 });
  }
}
