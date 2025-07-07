import { Turbopuffer } from '@turbopuffer/turbopuffer';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (!env.TURBOPUFFER_API_KEY) {
      return new Response('Turbopuffer API key not configured', { status: 500 });
    }

    const tpuf = new Turbopuffer({
      apiKey: env.TURBOPUFFER_API_KEY,
    });

    try {
      if (url.pathname === '/') {
        return new Response(`
          <h1>Turbopuffer Cloudflare Worker</h1>
          <p>Available endpoints:</p>
          <ul>
            <li>GET /query?vector=[1,2,3]&top_k=10 - Query similar vectors</li>
            <li>POST /upsert - Upsert vectors (body: {vectors: [{id: "1", vector: [1,2,3], attributes: {...}}, ...]})</li>
            <li>GET /namespaces - List namespaces</li>
          </ul>
        `, {
          headers: { 'content-type': 'text/html' }
        });
      }

      if (url.pathname === '/query' && request.method === 'GET') {
        const vectorParam = url.searchParams.get('vector');
        const topK = parseInt(url.searchParams.get('top_k') || '10');
        const namespace = url.searchParams.get('namespace') || 'default';
        
        if (!vectorParam) {
          return new Response('Missing vector parameter', { status: 400 });
        }

        const vector = JSON.parse(vectorParam);
        const ns = tpuf.namespace(namespace);
        
        const results = await ns.query({
          vector: vector,
          top_k: topK,
          include_attributes: true,
          include_vectors: true,
        });

        return new Response(JSON.stringify(results, null, 2), {
          headers: { 'content-type': 'application/json' }
        });
      }

      if (url.pathname === '/upsert' && request.method === 'POST') {
        const body = await request.json();
        const namespace = url.searchParams.get('namespace') || 'default';
        
        if (!body.vectors || !Array.isArray(body.vectors)) {
          return new Response('Invalid request body. Expected {vectors: [...]}.', { status: 400 });
        }

        const ns = tpuf.namespace(namespace);
        const result = await ns.upsert({
          vectors: body.vectors,
          distance_metric: body.distance_metric || 'cosine_distance',
        });

        return new Response(JSON.stringify({ success: true, result }, null, 2), {
          headers: { 'content-type': 'application/json' }
        });
      }

      if (url.pathname === '/namespaces' && request.method === 'GET') {
        const namespaces = await tpuf.listNamespaces();
        
        return new Response(JSON.stringify(namespaces, null, 2), {
          headers: { 'content-type': 'application/json' }
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Turbopuffer error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' }
      });
    }
  },
};