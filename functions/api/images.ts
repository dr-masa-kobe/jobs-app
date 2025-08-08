export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const jobId = url.searchParams.get('jobId');
  if (!jobId) return new Response('jobId required', { status: 400 });
  const rows = (await ctx.env.DB.prepare(`SELECT key FROM job_images WHERE job_id=? ORDER BY created_at DESC`).bind(jobId).all()).results || [];
  return new Response(JSON.stringify({ keys: rows.map((r:any)=>r.key) }), { headers: { 'Content-Type':'application/json' }});
};
