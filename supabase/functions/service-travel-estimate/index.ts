import { createClient } from 'npm:@supabase/supabase-js@2';

const allowedOrigins = new Set(['https://carrtell.ir', 'https://www.carrtell.ir', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://127.0.0.1:4173']);
const defaultTrafficZone: Array<[number, number]> = [
  [35.6595, 51.3819], [35.7218, 51.3892], [35.7230, 51.4070],
  [35.7212, 51.4260], [35.7188, 51.4430], [35.7040, 51.4470],
  [35.6880, 51.4490], [35.6740, 51.4470], [35.6600, 51.4440],
];

function cors(req: Request) { const origin = req.headers.get('origin') || ''; return { 'Access-Control-Allow-Origin': allowedOrigins.has(origin) ? origin : 'https://carrtell.ir', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' }; }
function json(req: Request, body: unknown, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'content-type': 'application/json; charset=utf-8' } }); }
function validCoordinate(lat: number, lng: number) { return Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180; }
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) { const rad = (value: number) => value * Math.PI / 180; const dLat = rad(bLat - aLat); const dLng = rad(bLng - aLng); const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLng / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)); }
function insidePolygon(lat: number, lng: number, polygon: Array<[number, number]>) { let inside = false; for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) { const [yi, xi] = polygon[i]; const [yj, xj] = polygon[j]; const crosses = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / ((yj - yi) || Number.EPSILON) + xi); if (crosses) inside = !inside; } return inside; }
function numeric(value: unknown, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }

async function neshanGet(endpoint: URL, apiKey: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(endpoint, { headers: { 'Api-Key': apiKey, Accept: 'application/json' }, signal: controller.signal });
    return { response, payload: await response.json().catch(() => ({})) };
  } finally {
    clearTimeout(timeout);
  }
}

function neshanErrorCode(status: number) {
  return status === 480 ? 'neshan_key_invalid'
    : status === 481 ? 'neshan_limit_exceeded'
    : status === 482 ? 'neshan_rate_exceeded'
    : status === 483 ? 'neshan_key_type_invalid'
    : status === 484 ? 'neshan_whitelist_rejected'
    : status === 485 ? 'neshan_routing_not_enabled'
    : 'route_service_unavailable';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  if (req.method !== 'POST') return json(req, { ok: false, error: 'method_not_allowed' }, 405);
  const origin = req.headers.get('origin') || '';
  if (origin && !allowedOrigins.has(origin)) return json(req, { ok: false, error: 'origin_not_allowed' }, 403);

  try {
    const body = await req.json();
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);
    if (!validCoordinate(latitude, longitude)) return json(req, { ok: false, error: 'invalid_coordinates' }, 400);

    const supabaseUrl = String(Deno.env.get('SUPABASE_URL') || '');
    const serviceRoleKey = String(Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '');
    const neshanKey = String(Deno.env.get('NESHAN_SERVICE_API_KEY') || '').trim();
    if (!supabaseUrl || !serviceRoleKey || !neshanKey) return json(req, { ok: false, error: 'server_configuration_missing' }, 500);
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: row, error: settingsError } = await admin.from('service_pricing_settings').select('*').eq('id', 'default').maybeSingle();
    if (settingsError) {
      console.error('service-travel-estimate settings error', settingsError);
      return json(req, { ok: false, error: 'pricing_schema_unavailable' }, 503);
    }

    const originLat = numeric(row?.travel_origin_latitude, 35.6505318);
    const originLng = numeric(row?.travel_origin_longitude, 51.2740074);
    const centerLat = numeric(row?.service_center_latitude, 35.6892);
    const centerLng = numeric(row?.service_center_longitude, 51.3890);
    const radiusKm = Math.max(1, numeric(row?.service_radius_km, 40));
    const fromCenterKm = haversineKm(centerLat, centerLng, latitude, longitude);
    if (fromCenterKm > radiusKm) return json(req, { ok: false, error: 'outside_service_area', radius_km: radiusKm, distance_from_center_km: Number(fromCenterKm.toFixed(2)) }, 422);

    const endpoint = new URL('https://api.neshan.org/v4/direction');
    endpoint.searchParams.set('type', 'car');
    endpoint.searchParams.set('origin', `${originLat},${originLng}`);
    endpoint.searchParams.set('destination', `${latitude},${longitude}`);
    const primary = await neshanGet(endpoint, neshanKey);
    const summary = primary.payload?.routes?.[0]?.legs?.[0]?.summary || primary.payload?.routes?.[0]?.summary || {};
    let distanceMeters = numeric(summary?.distance?.value ?? summary?.lengthInMeters ?? summary?.distance, NaN);
    let durationSeconds = numeric(summary?.duration?.value ?? summary?.durationInSeconds ?? summary?.duration, 0);
    let routeSource = 'routing-traffic';

    // The enabled traffic Distance Matrix service is a safe fallback when the
    // full Routing API is temporarily unavailable or returns no usable route.
    if (!primary.response.ok || !Number.isFinite(distanceMeters) || distanceMeters < 0) {
      console.error('service-travel-estimate routing fallback', primary.response.status, primary.payload);
      const matrixEndpoint = new URL('https://api.neshan.org/v1/distance-matrix');
      matrixEndpoint.searchParams.set('type', 'car');
      matrixEndpoint.searchParams.set('origins', `${originLat},${originLng}`);
      matrixEndpoint.searchParams.set('destinations', `${latitude},${longitude}`);
      const matrix = await neshanGet(matrixEndpoint, neshanKey);
      const element = matrix.payload?.rows?.[0]?.elements?.[0];
      if (!matrix.response.ok || String(element?.status || '').toLowerCase() !== 'ok') {
        console.error('service-travel-estimate matrix error', matrix.response.status, matrix.payload);
        const status = matrix.response.ok ? primary.response.status : matrix.response.status;
        return json(req, { ok: false, error: neshanErrorCode(status) }, 502);
      }
      distanceMeters = numeric(element?.distance?.value, NaN);
      durationSeconds = numeric(element?.duration?.value, 0);
      routeSource = 'distance-matrix-traffic';
    }
    if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return json(req, { ok: false, error: 'route_distance_missing' }, 502);

    const baseFee = Math.max(0, numeric(row?.travel_fee, 200000));
    const perKmFee = Math.max(0, numeric(row?.travel_per_km_fee, 10000));
    const billableKm = Math.ceil(distanceMeters / 1000);
    const distanceFee = billableKm * perKmFee;
    const configuredPolygon = Array.isArray(row?.traffic_zone_polygon) ? row.traffic_zone_polygon : defaultTrafficZone;
    const polygon = configuredPolygon.filter((point: unknown) => Array.isArray(point) && point.length === 2 && validCoordinate(Number(point[0]), Number(point[1]))).map((point: unknown) => [Number((point as unknown[])[0]), Number((point as unknown[])[1])] as [number, number]);
    const trafficZone = polygon.length >= 3 && insidePolygon(latitude, longitude, polygon);
    const beforeSurcharge = baseFee + distanceFee;
    const surchargePercent = Math.max(0, numeric(row?.traffic_zone_surcharge_percent, 30));
    const trafficSurcharge = trafficZone ? Math.round(beforeSurcharge * surchargePercent / 100) : 0;
    const totalFee = beforeSurcharge + trafficSurcharge;
    const { data: quote, error: quoteError } = await admin.from('service_travel_quotes').insert({ destination_latitude: latitude, destination_longitude: longitude, route_distance_meters: Math.round(distanceMeters), billable_distance_km: billableKm, base_fee: baseFee, distance_fee: distanceFee, traffic_surcharge: trafficSurcharge, traffic_zone: trafficZone, total_fee: totalFee }).select('id').single();
    if (quoteError || !quote?.id) { console.error('service-travel-estimate quote error', quoteError); return json(req, { ok: false, error: 'travel_quote_schema_unavailable' }, 503); }

    return json(req, { ok: true, estimate: { quote_id: quote.id, route_distance_meters: Math.round(distanceMeters), route_distance_km: Number((distanceMeters / 1000).toFixed(1)), billable_distance_km: billableKm, base_fee: baseFee, distance_fee: distanceFee, traffic_surcharge: trafficSurcharge, traffic_surcharge_percent: surchargePercent, traffic_zone: trafficZone, total_fee: totalFee, radius_from_tehran_center_km: Number(fromCenterKm.toFixed(1)), duration_seconds: Math.round(durationSeconds), route_source: routeSource } });
  } catch (error) {
    console.error('service-travel-estimate', error);
    return json(req, { ok: false, error: 'travel_estimate_failed' }, 500);
  }
});
