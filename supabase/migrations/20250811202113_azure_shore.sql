/*
  # Verificar e corrigir trigger de criação de usuário

  1. Verificações
    - Verificar se o trigger handle_new_user existe
    - Verificar se a função handle_new_user está funcionando
    - Garantir que perfis sejam criados automaticamente

  2. Correções
    - Recriar trigger se necessário
    - Adicionar logs para debug
    - Garantir que todos os campos sejam preenchidos corretamente
*/

-- Verificar se a função existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'
  ) THEN
    -- Criar função se não existir
    CREATE OR REPLACE FUNCTION handle_new_user()
    RETURNS trigger AS $func$
    BEGIN
      INSERT INTO public.user_profiles (
        id,
        email,
        phone,
        full_name,
        leverage_multiplier,
        is_active,
        contracted_plan
      ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        1,
        true,
        'none'
      );
      
      -- Log para debug (será visível nos logs do Supabase)
      RAISE NOTICE 'Profile created for user: % with email: %', NEW.id, NEW.email;
      
      RETURN NEW;
    EXCEPTION
      WHEN unique_violation THEN
        -- Se o perfil já existe, apenas atualizar dados se necessário
        UPDATE public.user_profiles 
        SET 
          email = NEW.email,
          phone = COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, phone),
          full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', full_name),
          updated_at = now()
        WHERE id = NEW.id;
        
        RAISE NOTICE 'Profile updated for existing user: %', NEW.id;
        RETURN NEW;
      WHEN OTHERS THEN
        RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql SECURITY DEFINER;
  END IF;
END $$;

-- Verificar se o trigger existe e recriar se necessário
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verificar usuários existentes no auth que não têm perfil
DO $$
DECLARE
  auth_user RECORD;
  profile_exists BOOLEAN;
BEGIN
  -- Iterar sobre usuários do auth que podem não ter perfil
  FOR auth_user IN 
    SELECT au.id, au.email, au.phone, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
  LOOP
    -- Criar perfil para usuário sem perfil
    INSERT INTO public.user_profiles (
      id,
      email,
      phone,
      full_name,
      leverage_multiplier,
      is_active,
      contracted_plan
    ) VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'phone', auth_user.phone),
      COALESCE(auth_user.raw_user_meta_data->>'full_name', ''),
      1,
      true,
      'none'
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      updated_at = now();
    
    RAISE NOTICE 'Created/updated profile for user: % (%)', auth_user.id, auth_user.email;
  END LOOP;
END $$;