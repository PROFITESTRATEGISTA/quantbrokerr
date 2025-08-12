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
      // Setup both contract buckets
      const bucketsToCreate = ['client-contracts', 'supplier-contracts'];
      const results = [];

      for (const bucket of bucketsToCreate) {
        try {
          // Check if bucket exists
          const { data: existingBuckets } = await supabaseAdmin.storage.listBuckets();
          const bucketExists = existingBuckets?.some(b => b.name === bucket);

          if (!bucketExists) {
            // Create bucket
            const { data: bucketData, error: bucketError } = await supabaseAdmin.storage.createBucket(bucket, {
              public: true,
              allowedMimeTypes: [
                'application/pdf',
                'application/msword', 
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              ],
              fileSizeLimit: 10485760 // 10MB
            });

            if (bucketError) {
              throw new Error(`Failed to create ${bucket}: ${bucketError.message}`);
            }

            results.push({ bucket, status: 'created', data: bucketData });
          } else {
            results.push({ bucket, status: 'exists' });
          }

          // Create/update RLS policies for the bucket using direct SQL
          try {
            // Remove existing policies to prevent conflicts
            await supabaseAdmin.sql`
              DELETE FROM storage.policies 
              WHERE bucket_id = (SELECT id FROM storage.buckets WHERE name = ${bucket});
            `;

            // Create INSERT policy for admin
            await supabaseAdmin.sql`
              INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
              SELECT 
                'Admin can upload to ${bucket}',
                id,
                'INSERT',
                '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text',
                '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text'
              FROM storage.buckets WHERE name = ${bucket};
            `;

            // Create SELECT policy for admin
            await supabaseAdmin.sql`
              INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
              SELECT 
                'Admin can view ${bucket}',
                id,
                'SELECT',
                '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text',
                '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text'
              FROM storage.buckets WHERE name = ${bucket};
            `;

            // Create DELETE policy for admin
            await supabaseAdmin.sql`
              INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
              SELECT 
                'Admin can delete from ${bucket}',
                id,
                'DELETE',
                '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text',
                '(auth.jwt() ->> ''email''::text) = ''pedropardal04@gmail.com''::text'
              FROM storage.buckets WHERE name = ${bucket};
            `;

            // Create public SELECT policy for viewing files
            await supabaseAdmin.sql`
              INSERT INTO storage.policies (name, bucket_id, operation, definition, check_expression)
              SELECT 
                'Public can view ${bucket}',
                id,
                'SELECT',
                'true',
                'true'
              FROM storage.buckets WHERE name = ${bucket};
            `;

          } catch (policyError) {
            console.warn(`Policy creation warning for ${bucket}:`, policyError);
            // Continue even if policies fail - they might already exist
          }

        } catch (error) {
          results.push({ bucket, status: 'error', error: error.message });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Storage setup completed',
          results 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
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