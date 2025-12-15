export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

export function withCors(handler: (req: Request) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    try {
      const response = await handler(req);
      // Add CORS headers to the response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    } catch (error) {
      const payload = { error: "Internal Server Error", details: String(error?.message ?? error) };
      const response = new Response(JSON.stringify(payload), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
      return response;
    }
  };
}

/**
 * Helper para retornar JSON padronizado com headers CORS.
 * Uso: `jsonResponse(body, { status, headers }, origin?)`
 */
export function jsonResponse(
  body: unknown,
  opts: { status?: number; headers?: Record<string, string> } = {},
  origin?: string,
) {
  const status = opts.status ?? 200;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...corsHeaders,
    ...(opts.headers || {}),
  };
  // If origin provided, override the Allow-Origin to the request origin
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}
