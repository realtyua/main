export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': 'https://www.realestate.if.ua',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Authorization, Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const target = 'https://reifua.goatcounter.com' + url.pathname + url.search;

    const resp = await fetch(target, {
      method: request.method,
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Host': 'stats.realestate.if.ua',
      },
    });

    const out = new Response(resp.body, resp);
    out.headers.set('Access-Control-Allow-Origin', 'https://www.realestate.if.ua');
    return out;
  },
};
