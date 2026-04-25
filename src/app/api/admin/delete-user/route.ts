import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireRole } from '@/lib/api-security';

export async function POST(request: NextRequest) {
  try {
    // ── AUTH GATE: Require admin or superadmin ──
    const { user: authUser, error: authError } = await requireRole(request, ['admin', 'superadmin']);
    if (authError) return authError;

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
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

    // First, fetch the user's email before deleting
    const { data: userRecord } = await supabaseServer
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();

    const userEmail = userRecord?.email;

    // Delete the user from the users table
    const { error } = await supabaseServer
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      console.error('Error deleting user:', error);
      return NextResponse.json(
        { success: false, error: 'حدث خطأ أثناء حذف المستخدم' },
        { status: 500 }
      );
    }

    // Add the user's email to banned_users to prevent re-registration
    if (userEmail) {
      const { error: banError } = await supabaseServer
        .from('banned_users')
        .upsert(
          { email: userEmail, reason: 'تم الحذف بواسطة المشرف' },
          { onConflict: 'email' }
        );

      if (banError) {
        console.error('Error adding to banned_users:', banError);
        // Non-critical: user is already deleted, just log the error
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
