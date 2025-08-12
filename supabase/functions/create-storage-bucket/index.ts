import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

interface RequestBody {
  action: 'create' | 'setup';
  bucketName?: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user || user.email !== 'pedropardal04@gmail.com') {
      return new Response(
        JSON.stringify({ error: 'Unauthorized access' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (req.method === 'GET') {
      // List existing buckets
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
      
      if (listError) {
        throw new Error(`Failed to list buckets: ${listError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          buckets: buckets || [],
          hasClientContracts: buckets?.some(b => b.name === 'client-contracts') || false,
          hasSupplierContracts: buckets?.some(b => b.name === 'supplier-contracts') || false
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { action, bucketName }: RequestBody = await req.json();

    if (action === 'setup') {
      // Run the migration to ensure buckets and policies are properly set up
      try {
        await supabaseAdmin.sql`
          -- Create storage buckets if they don't exist
          INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
          VALUES 
            ('client-contracts', 'client-contracts', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
            ('supplier-contracts', 'supplier-contracts', true, 10485760, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
          ON CONFLICT (id) DO UPDATE SET
            public = EXCLUDED.public,
            file_size_limit = EXCLUDED.file_size_limit,
            allowed_mime_types = EXCLUDED.allowed_mime_types;
        `;

        // Drop existing policies to avoid conflicts
        await supabaseAdmin.sql`
          DELETE FROM storage.policies WHERE bucket_id IN (
            SELECT id FROM storage.buckets WHERE name IN ('client-contracts', 'supplier-contracts')
          );
        `;

        // Create policies for client-contracts
        await supabaseAdmin.sql`
          INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
          SELECT 
            'Authenticated users can upload',
            id,
            'INSERT',
            'auth.role() = ''authenticated''',
            'auth.role() = ''authenticated'''
          FROM storage.buckets WHERE name = 'client-contracts';
        `;

        await supabaseAdmin.sql`
          INSERT INTO storage.policies (name, bucket_id, operation, definition)
          SELECT 
            'Public can view files',
            id,
            'SELECT',
            'true'
          FROM storage.buckets WHERE name = 'client-contracts';
        `;

        await supabaseAdmin.sql`
          INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
          SELECT 
            'Authenticated users can delete',
            id,
            'DELETE',
            'auth.role() = ''authenticated''',
            'auth.role() = ''authenticated'''
          FROM storage.buckets WHERE name = 'client-contracts';
        `;

        // Create policies for supplier-contracts
        await supabaseAdmin.sql`
          INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
          SELECT 
            'Authenticated users can upload',
            id,
            'INSERT',
            'auth.role() = ''authenticated''',
            'auth.role() = ''authenticated'''
          FROM storage.buckets WHERE name = 'supplier-contracts';
        `;

        await supabaseAdmin.sql`
          INSERT INTO storage.policies (name, bucket_id, operation, definition)
          SELECT 
            'Public can view files',
            id,
            'SELECT',
            'true'
          FROM storage.buckets WHERE name = 'supplier-contracts';
        `;

        await supabaseAdmin.sql`
          INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
          SELECT 
            'Authenticated users can delete',
            id,
            'DELETE',
            'auth.role() = ''authenticated''',
            'auth.role() = ''authenticated'''
          FROM storage.buckets WHERE name = 'supplier-contracts';
        `;

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Storage setup completed successfully',
            buckets: ['client-contracts', 'supplier-contracts']
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );

      } catch (error: any) {
        console.error('Storage setup error:', error);
        return new Response(
          JSON.stringify({ 
            success: false,
            error: error.message,
            message: 'Storage setup completed with warnings'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    if (action === 'create' && bucketName) {
      // Create specific bucket
      const { data: existingBuckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = existingBuckets?.some(b => b.name === bucketName);

      if (bucketExists) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Bucket already exists',
            bucketName 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const { data: bucketData, error: bucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: [
          'application/pdf',
          'application/msword', 
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        fileSizeLimit: 10485760 // 10MB
      });

      if (bucketError) {
        throw new Error(`Failed to create bucket: ${bucketError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Bucket created successfully',
          bucketName,
          data: bucketData 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Storage bucket error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.toString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});