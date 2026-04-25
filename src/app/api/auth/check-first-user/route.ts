import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase-server';
import { requireAuth } from '@/lib/api-security';

/**
 * POST /api/auth/check-first-user
 * Checks if the given user is the first user on the platform.
 * If so, promotes them to 'superadmin'.
 * This is called after successful registration (email+password or Google OAuth).
 *
 * SECURITY: Requires authentication. The userId must match the authenticated user.
 * Uses a database transaction (via RPC) to prevent race conditions.
 */
export async function POST(request: NextRequest) {
  try {
    // ── AUTH GATE ──
    const { user: authUser, error: authError } = await requireAuth(request);
    if (authError) return authError;

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // ── AUTHORIZATION: userId must match the authenticated user ──
    if (userId !== authUser.id) {
      return NextResponse.json(
        { success: false, error: 'غير مصرح بهذا الإجراء' },
        { status: 403 }
      );
    }

    // Try using an atomic RPC function to prevent race conditions
    const { data: rpcData, error: rpcError } = await supabaseServer
      .rpc('promote_first_user', { p_user_id: userId });

    if (!rpcError && rpcData) {
      // RPC succeeded — it atomically checked count and promoted
      if (rpcData.promoted) {
        // Fetch the updated profile
        const { data: profile } = await supabaseServer
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();

        return NextResponse.json({
          success: true,
          promoted: true,
          role: 'superadmin',
          user: profile,
        });
      }
      // Not the first user — no promotion needed
      return NextResponse.json({
        success: true,
        promoted: false,
        role: null,
      });
    }

    // RPC not available — fall back to non-atomic check (with logging)
    console.warn('[check-first-user] RPC promote_first_user not available, using fallback (non-atomic)');

    // Count total users in the platform using service role
    const { count, error: countError } = await supabaseServer
      .from('users')
      .select('id', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting users:', countError);
      return NextResponse.json(
        { success: false, error: 'خطأ في التحقق من عدد المستخدمين' },
        { status: 500 }
      );
    }

    // If this is the first (and only) user, promote to superadmin
    if (count === 1) {
      const { data, error: updateError } = await supabaseServer
        .from('users')
        .update({ role: 'superadmin', updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Error promoting first user to superadmin:', updateError);
        return NextResponse.json(
          { success: false, error: 'خطأ في ترقية الحساب' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        promoted: true,
        role: 'superadmin',
        user: data,
      });
    }

    // Not the first user - no promotion needed
    return NextResponse.json({
      success: true,
      promoted: false,
      role: null,
    });
  } catch (error) {
    console.error('Check first user error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}
