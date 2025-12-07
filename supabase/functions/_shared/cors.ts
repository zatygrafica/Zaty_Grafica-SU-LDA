// ================================================================
// Shared CORS Configuration for Edge Functions
// ================================================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Em produção, especifique seu domínio
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  return null;
}

export function jsonResponse(
  data: Record<string, unknown>,
  options?: { status?: number }
): Response {
  return new Response(JSON.stringify(data), {
    status: options?.status ?? 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}
