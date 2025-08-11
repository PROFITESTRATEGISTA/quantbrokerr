const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Verificar se é admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Criar cliente Supabase com service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Verificar se o usuário atual é admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user || user.email !== 'pedropardal04@gmail.com') {
      return new Response(
        JSON.stringify({ error: 'Acesso negado. Apenas administradores podem acessar esta função.' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'list';

    if (action === 'list') {
      // Buscar todos os usuários do auth
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        console.error('Erro ao buscar usuários do auth:', authError);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar usuários do sistema de autenticação' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Buscar perfis existentes
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('user_profiles')
        .select('*');

      if (profilesError) {
        console.error('Erro ao buscar perfis:', profilesError);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar perfis de usuários' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Combinar dados do auth com perfis
      const combinedUsers = authUsers.users.map(authUser => {
        const profile = profiles?.find(p => p.id === authUser.id);
        
        return {
          id: authUser.id,
          email: authUser.email,
          phone: profile?.phone || authUser.phone || authUser.user_metadata?.phone || null,
          full_name: profile?.full_name || authUser.user_metadata?.full_name || null,
          leverage_multiplier: profile?.leverage_multiplier || 1,
          is_active: profile?.is_active ?? true,
          contracted_plan: profile?.contracted_plan || 'none',
          created_at: profile?.created_at || authUser.created_at,
          updated_at: profile?.updated_at || authUser.updated_at,
          has_profile: !!profile,
          email_confirmed_at: authUser.email_confirmed_at,
          phone_confirmed_at: authUser.phone_confirmed_at
        };
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          users: combinedUsers,
          total_auth_users: authUsers.users.length,
          total_profiles: profiles?.length || 0
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );

    } else if (action === 'sync') {
      // Sincronizar usuários - criar perfis para usuários sem perfil
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar usuários do auth' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      // Buscar perfis existentes
      const { data: existingProfiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id');

      const existingProfileIds = new Set((existingProfiles || []).map(p => p.id));
      
      // Encontrar usuários sem perfil
      const usersWithoutProfile = authUsers.users.filter(user => !existingProfileIds.has(user.id));
      
      let createdProfiles = 0;
      
      if (usersWithoutProfile.length > 0) {
        // Criar perfis para usuários sem perfil
        const newProfiles = usersWithoutProfile.map(user => ({
          id: user.id,
          email: user.email!,
          phone: user.phone || user.user_metadata?.phone || null,
          full_name: user.user_metadata?.full_name || null,
          leverage_multiplier: 1,
          is_active: true,
          contracted_plan: 'none'
        }));

        const { error: insertError } = await supabaseAdmin
          .from('user_profiles')
          .insert(newProfiles);

        if (insertError) {
          console.error('Erro ao criar perfis:', insertError);
          return new Response(
            JSON.stringify({ error: 'Erro ao criar perfis de usuário' }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            }
          );
        }

        createdProfiles = newProfiles.length;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Sincronização concluída. ${createdProfiles} perfis criados.`,
          created_profiles: createdProfiles,
          total_users: authUsers.users.length
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação não reconhecida' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Erro na função admin-users:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});