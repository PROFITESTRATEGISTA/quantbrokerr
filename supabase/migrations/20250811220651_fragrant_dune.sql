/*
  # Sincronizar usuários do auth com user_profiles

  1. Função para sincronizar usuários
    - Busca todos os usuários do auth.users
    - Cria perfis para usuários que não têm perfil
    - Atualiza dados básicos dos perfis existentes

  2. Trigger para novos usuários
    - Garante que todo novo usuário tenha um perfil criado automaticamente

  3. Função de sincronização manual
    - Permite sincronizar manualmente quando necessário
*/

-- Função para sincronizar usuários do auth com user_profiles
CREATE OR REPLACE FUNCTION sync_auth_users_with_profiles()
RETURNS TABLE(
  users_synced INTEGER,
  profiles_created INTEGER,
  profiles_updated INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user RECORD;
  profile_exists BOOLEAN;
  users_count INTEGER := 0;
  created_count INTEGER := 0;
  updated_count INTEGER := 0;
BEGIN
  -- Iterar sobre todos os usuários do auth
  FOR auth_user IN 
    SELECT 
      id,
      email,
      phone,
      raw_user_meta_data,
      email_confirmed_at,
      phone_confirmed_at,
      created_at,
      updated_at
    FROM auth.users
  LOOP
    users_count := users_count + 1;
    
    -- Verificar se o perfil já existe
    SELECT EXISTS(
      SELECT 1 FROM user_profiles WHERE id = auth_user.id
    ) INTO profile_exists;
    
    IF NOT profile_exists THEN
      -- Criar novo perfil
      INSERT INTO user_profiles (
        id,
        email,
        phone,
        full_name,
        leverage_multiplier,
        current_leverage,
        is_active,
        contracted_plan,
        plan_status,
        created_at,
        updated_at
      ) VALUES (
        auth_user.id,
        auth_user.email,
        COALESCE(auth_user.phone, (auth_user.raw_user_meta_data->>'phone')),
        COALESCE((auth_user.raw_user_meta_data->>'full_name'), ''),
        1, -- leverage_multiplier padrão
        1, -- current_leverage padrão
        true, -- is_active padrão
        'none', -- contracted_plan padrão
        'inactive', -- plan_status padrão
        auth_user.created_at,
        auth_user.updated_at
      );
      
      created_count := created_count + 1;
    ELSE
      -- Atualizar dados básicos do perfil existente se necessário
      UPDATE user_profiles 
      SET 
        email = auth_user.email,
        phone = COALESCE(
          user_profiles.phone, -- Manter telefone existente se houver
          auth_user.phone, 
          (auth_user.raw_user_meta_data->>'phone')
        ),
        full_name = COALESCE(
          NULLIF(user_profiles.full_name, ''), -- Manter nome existente se não for vazio
          (auth_user.raw_user_meta_data->>'full_name'),
          ''
        ),
        updated_at = NOW()
      WHERE id = auth_user.id
      AND (
        user_profiles.email != auth_user.email OR
        user_profiles.phone IS NULL OR
        user_profiles.full_name IS NULL OR
        user_profiles.full_name = ''
      );
      
      IF FOUND THEN
        updated_count := updated_count + 1;
      END IF;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT users_count, created_count, updated_count;
END;
$$;

-- Executar sincronização inicial
SELECT * FROM sync_auth_users_with_profiles();

-- Atualizar a função handle_new_user para garantir criação de perfil
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (
    id,
    email,
    phone,
    full_name,
    leverage_multiplier,
    current_leverage,
    is_active,
    contracted_plan,
    plan_status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.phone, (NEW.raw_user_meta_data->>'phone')),
    COALESCE((NEW.raw_user_meta_data->>'full_name'), ''),
    1,
    1,
    true,
    'none',
    'inactive'
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- Se o perfil já existe, apenas atualizar dados básicos
    UPDATE user_profiles 
    SET 
      email = NEW.email,
      phone = COALESCE(user_profiles.phone, NEW.phone, (NEW.raw_user_meta_data->>'phone')),
      full_name = COALESCE(
        NULLIF(user_profiles.full_name, ''),
        (NEW.raw_user_meta_data->>'full_name'),
        ''
      ),
      updated_at = NOW()
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$$;

-- Recriar o trigger se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();