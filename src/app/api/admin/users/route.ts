import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-security';

// This API route handles admin user management
// It uses the Supabase service role key to bypass RLS

export async function GET(request: NextRequest) {
  try {
    // ── AUTH GATE: Require admin or superadmin ──
    const { user: authUser, error: authError } = await requireRole(request, ['admin', 'superadmin']);
    if (authError) return authError;

    // Fetch all users using service role
    const { data, error } = await supabaseServer
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب المستخدمين' }, { status: 500 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Admin users GET error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // ── AUTH GATE: Require admin or superadmin ──
    const { user: authUser, error: authError } = await requireRole(request, ['admin', 'superadmin']);
    if (authError) return authError;

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    // Prevent self-deletion
    if (userId === authUser.id) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 400 }
      );
    }

    // Get the requester's role
    const { data: requesterProfile } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', authUser.id)
      .single();

    // Get the target user's role
    const { data: targetProfile } = await supabaseServer
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // Admin cannot delete superadmin
    if (targetProfile?.role === 'superadmin' && requesterProfile?.role !== 'superadmin') {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف مدير المنصة' },
        { status: 403 }
      );
    }

    // Admin cannot delete other admins
    if (targetProfile?.role === 'admin' && requesterProfile?.role === 'admin') {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف مشرف آخر' },
        { status: 403 }
      );
    }

    // Fetch the user's email before deleting
    const { data: userRecord } = await supabaseServer
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    const userEmail = userRecord?.email;

    const { error } = await supabaseServer.from('users').delete().eq('id', userId);
    if (error) return NextResponse.json({ success: false, error: 'حدث خطأ أثناء حذف المستخدم' }, { status: 500 });

    // Add the user's email to banned_users to prevent re-registration
    if (userEmail) {
      await supabaseServer
        .from('banned_users')
        .upsert(
          { email: userEmail, reason: 'تم الحذف بواسطة المشرف' },
          { onConflict: 'email' }
        )
        .catch(() => {}); // Non-critical
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin users DELETE error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ غير متوقع' }, { status: 500 });
  }
}
