import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Get authorization header from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token to verify they are authorized
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user: currentUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !currentUser) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if the current user is a founder
    const { data: currentProfile, error: profileError } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single();

    if (profileError || !currentProfile) {
      console.error('Profile error:', profileError);
      return new Response(
        JSON.stringify({ error: 'Could not verify user role' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (currentProfile.role !== 'founder') {
      return new Response(
        JSON.stringify({ error: 'Only founders can delete users' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the target user ID from request body
    const { targetUserId, targetUserEmail } = await req.json();
    
    if (!targetUserId) {
      return new Response(
        JSON.stringify({ error: 'Target user ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prevent self-deletion
    if (targetUserId === currentUser.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete yourself' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if target is the last founder
    const { data: targetProfile } = await userClient
      .from('profiles')
      .select('role')
      .eq('id', targetUserId)
      .single();

    if (targetProfile?.role === 'founder') {
      const { count } = await userClient
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'founder');

      if (count === 1) {
        return new Response(
          JSON.stringify({ error: 'Cannot delete the last founder' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Delete from login_history first (if exists)
    await adminClient
      .from('login_history')
      .delete()
      .eq('user_id', targetUserId);

    // Delete from operation_history
    await adminClient
      .from('operation_history')
      .delete()
      .eq('user_id', targetUserId);

    // Release any activation codes used by this user (mark as not used again)
    await adminClient
      .from('activation_codes')
      .update({ 
        is_used: false, 
        used_by: null, 
        used_at: null,
        expires_at: null 
      })
      .eq('used_by', targetUserId);

    // Delete the user's profile
    const { error: profileDeleteError } = await adminClient
      .from('profiles')
      .delete()
      .eq('id', targetUserId);

    if (profileDeleteError) {
      console.error('Profile delete error:', profileDeleteError);
      return new Response(
        JSON.stringify({ error: 'Failed to delete user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete from auth.users using admin API
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(targetUserId);
    
    if (authDeleteError) {
      console.error('Auth delete error:', authDeleteError);
      // Profile was already deleted, so we still consider this a partial success
      return new Response(
        JSON.stringify({ 
          success: true, 
          warning: 'Profile deleted but auth cleanup may be incomplete',
          email: targetUserEmail 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`User ${targetUserEmail} (${targetUserId}) deleted successfully by ${currentUser.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User deleted successfully',
        email: targetUserEmail 
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error deleting user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
