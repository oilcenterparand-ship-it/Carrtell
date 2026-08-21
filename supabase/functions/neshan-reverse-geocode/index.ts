const allowedOrigins = new Set([
  'https://carrtell.ir',
  'https://www.carrtell.ir',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
]);

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') || '';
  return {
    'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://carrtell.ir',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'content-type': 'application/json; charset=utf-8' },
  });
}

function validCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= -90
    && latitude <= 90
    && longitude >= -180
    && longitude <= 180;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  if (req.method !== 'POST') return json(req, { ok: false, error: 'method_not_allowed' }, 405);

  const origin = req.headers.get('origin') || '';
  if (origin && !allowedOrigins.has(origin)) {
    return json(req, { ok: false, error: 'origin_not_allowed' }, 403);
  }

  const apiKey = String(Deno.env.get('NESHAN_SERVICE_API_KEY') || '').trim();
  if (!apiKey) return json(req, { ok: false, error: 'neshan_service_key_missing' }, 500);

  try {
    const body = await req.json();
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);

    if (!validCoordinate(latitude, longitude)) {
      return json(req, { ok: false, error: 'invalid_coordinates' }, 400);
    }

    const endpoint = new URL('https://api.neshan.org/v5/reverse');
    endpoint.searchParams.set('lat', String(latitude));
    endpoint.searchParams.set('lng', String(longitude));

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Accept': 'application/json',
      },
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('neshan-reverse-geocode upstream error', response.status, payload);
      return json(req, { ok: false, error: 'neshan_upstream_error' }, 502);
    }

    const address = String(payload?.formatted_address || payload?.address || '').trim();
    return json(req, {
      ok: true,
      address,
      latitude,
      longitude,
    });
  } catch (error) {
    console.error('neshan-reverse-geocode', error);
    return json(req, { ok: false, error: 'reverse_geocode_failed' }, 500);
  }
});
