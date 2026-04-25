import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-security';

export async function POST(request: NextRequest) {
  try {
    // ── AUTH GATE: Require admin or superadmin ──
    const { user: authUser, error: authError } = await requireRole(request, ['admin', 'superadmin']);
    if (authError) return authError;

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'البريد الإلكتروني مطلوب' },
        { status: 400 }
      );
    }

    const { error } = await supabaseServer
      .from('banned_users')
      .delete()
      .eq('email', email);

    if (error) {
      console.error('Error unbanning user:', error);
      return NextResponse.json(
        { success: false, error: 'حدث خطأ أثناء إلغاء الحظر' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unban user error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
