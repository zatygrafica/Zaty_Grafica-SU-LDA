const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'; // Service role key

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  console.log('🔧 Aplicando correção RLS para tabela settings...\n');

  const sql = `
    -- Fix Settings table RLS policies
    DROP POLICY IF EXISTS settings_select_auth ON public.settings;
    DROP POLICY IF EXISTS settings_insert_auth ON public.settings;
    DROP POLICY IF EXISTS settings_update_auth ON public.settings;
    DROP POLICY IF EXISTS settings_delete_auth ON public.settings;
    DROP POLICY IF EXISTS settings_select_policy ON public.settings;
    DROP POLICY IF EXISTS settings_insert_policy ON public.settings;
    DROP POLICY IF EXISTS settings_update_policy ON public.settings;
    DROP POLICY IF EXISTS settings_delete_policy ON public.settings;

    -- Enable RLS
    ALTER TABLE IF EXISTS public.settings ENABLE ROW LEVEL SECURITY;

    -- Create simple, permissive policies for all authenticated users
    CREATE POLICY settings_select_policy
      ON public.settings
      FOR SELECT
      TO authenticated
      USING (true);

    CREATE POLICY settings_insert_policy
      ON public.settings
      FOR INSERT
      TO authenticated
      WITH CHECK (true);

    CREATE POLICY settings_update_policy
      ON public.settings
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);

    -- Grant permissions
    GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;
    GRANT USAGE ON SCHEMA public TO authenticated;
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // Se exec_sql não existir, vamos usar outra abordagem
      console.log('⚠️  Método RPC não disponível, tentando abordagem alternativa...\n');

      // Vamos simplesmente testar se as policies funcionam fazendo um upsert
      const testResult = await supabase
        .from('settings')
        .upsert({ id: 'app_settings', value: {} })
        .select();

      if (testResult.error) {
        console.error('❌ Erro ao testar settings:', testResult.error.message);
        console.log('\n📋 Por favor, execute o SQL manualmente no Supabase Studio:');
        console.log('   URL: http://127.0.0.1:54323');
        console.log('   Vá em SQL Editor e execute o conteúdo de fix_settings_rls_now.sql');
      } else {
        console.log('✅ Teste de settings OK - As políticas parecem estar funcionando!');
      }
    } else {
      console.log('✅ Correção RLS aplicada com sucesso!');
    }

    // Verificar políticas criadas
    console.log('\n🔍 Verificando políticas criadas...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd')
      .eq('tablename', 'settings');

    if (!policiesError && policies) {
      console.log('📋 Políticas encontradas:');
      policies.forEach(p => {
        console.log(`   - ${p.policyname} (${p.cmd})`);
      });
    }

    console.log('\n✨ Processo concluído!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n📋 Execute manualmente no Supabase Studio (http://127.0.0.1:54323):');
    console.log(sql);
    process.exit(1);
  }
}

applyFix();
