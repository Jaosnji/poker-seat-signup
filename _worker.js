export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /api/seats - 获取报名数据
    if (path === '/api/seats' && request.method === 'GET') {
      const data = await env.SEATS_KV.get('seats', 'json');
      return new Response(JSON.stringify(data || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // POST /api/seats - 报名
    if (path === '/api/seats' && request.method === 'POST') {
      const { pos, name } = await request.json();
      if (!pos || !name) {
        return new Response(JSON.stringify({ error: '缺少参数' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      let seats = (await env.SEATS_KV.get('seats', 'json')) || [];
      seats = seats.filter(s => s.pos !== pos);
      seats.push({ pos, name, time: Date.now() });
      seats.sort((a, b) => a.pos - b.pos);
      await env.SEATS_KV.put('seats', JSON.stringify(seats));
      return new Response(JSON.stringify({ ok: true, seats }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // DELETE /api/seats - 重置（需管理员密码）
    if (path === '/api/seats' && request.method === 'DELETE') {
      const { password } = await request.json();
      if (password !== env.ADMIN_PASSWORD) {
        return new Response(JSON.stringify({ error: '权限不足' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await env.SEATS_KV.delete('seats');
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
};