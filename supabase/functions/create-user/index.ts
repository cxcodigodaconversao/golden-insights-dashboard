import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the authorization header to verify the requester
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the requester is an admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requester }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requester) {
      console.log('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if requester is admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requester.id)
      .single();

    if (roleError || roleData?.role !== 'admin') {
      console.log('User is not admin:', roleError);
      return new Response(
        JSON.stringify({ error: 'Apenas administradores podem gerenciar usuários' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const body = await req.json();
    const { action } = body;

    // Handle delete action
    if (action === 'delete') {
      const { userId } = body;
      
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'ID do usuário é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Deleting user: ${userId}`);

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

      if (deleteError) {
        console.log('Error deleting user:', deleteError);
        return new Response(
          JSON.stringify({ error: deleteError.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('User deleted successfully');

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle create action (default)
    const { email, password, nome, role = 'user', time_id, closer_id, sdr_id } = body;

    if (!email || !password || !nome) {
      return new Response(
        JSON.stringify({ error: 'Email, senha e nome são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Creating user: ${email}, nome: ${nome}, role: ${role}`);

    // Create the user using admin API
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the email
      user_metadata: { nome },
    });

    if (createError) {
      console.log('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // The trigger will create the profile and assign user role automatically
    // Update profile with additional fields
    if (newUser.user && (time_id || closer_id || sdr_id)) {
      const updateData: Record<string, string | null> = {};
      if (time_id) updateData.time_id = time_id;
      if (closer_id) updateData.closer_id = closer_id;
      if (sdr_id) updateData.sdr_id = sdr_id;

      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update(updateData)
        .eq('id', newUser.user.id);

      if (profileUpdateError) {
        console.log('Error updating profile:', profileUpdateError);
      }
    }

    // Update role if not 'user'
    if (role !== 'user' && newUser.user) {
      const { error: updateRoleError } = await supabaseAdmin
        .from('user_roles')
        .update({ role })
        .eq('user_id', newUser.user.id);

      if (updateRoleError) {
        console.log('Error updating role:', updateRoleError);
      }
    }

    console.log('User created successfully:', newUser.user?.id);

    return new Response(
      JSON.stringify({ success: true, user: { id: newUser.user?.id, email } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
