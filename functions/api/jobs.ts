// Cloudflare Pages Functions (Workers Runtime)

export const onRequestGet: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const q = url.searchParams.get('q') || '';
  const status = url.searchParams.get('status') || '';
  const sort = (url.searchParams.get('sort') || 'updated_at').replace(/[^a-z_]/gi,'');
  const dir = (url.searchParams.get('dir') || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const where: string[] = [];
  const params: any[] = [];
  if (q) { where.push(`(id = ? OR title LIKE ? OR location LIKE ? OR description LIKE ?)`); params.push(q, `%${q}%`, `%${q}%`, `%${q}%`); }
  if (status) { where.push(`status = ?`); params.push(status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT * FROM jobs ${whereSql} ORDER BY ${sort} ${dir} LIMIT 1000`;

  const rows = (await ctx.env.DB.prepare(sql).bind(...params).all()).results || [];
  return json({ data: rows });
};

export const onRequestPost: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const body = await ctx.request.json<any>();
  const now = Date.now();
  const id = body.id || crypto.randomUUID();
  const tags = JSON.stringify(body.tags || []);
  await ctx.env.DB.prepare(
    `INSERT INTO jobs (id,title,location,salary,employment_type,status,description,tags,updated_at)
     VALUES (?,?,?,?,?,?,?,?,?)`
  ).bind(id, body.title, body.location, body.salary, body.employment_type, body.status || 'open', body.description || '', tags, now).run();
  return json({ ok:true, id });
};

export const onRequestPut: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const body = await ctx.request.json<any>();
  if (!body.id) return bad('id required');
  const now = Date.now();
  const tags = JSON.stringify(body.tags || []);
  await ctx.env.DB.prepare(
    `UPDATE jobs SET title=?,location=?,salary=?,employment_type=?,status=?,description=?,tags=?,updated_at=? WHERE id=?`
  ).bind(body.title, body.location, body.salary, body.employment_type, body.status, body.description, tags, now, body.id).run();
  return json({ ok:true });
};

export const onRequestDelete: PagesFunction<{ DB: D1Database }> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const id = url.searchParams.get('id');
  if (!id) return bad('id required');
  await ctx.env.DB.prepare(`DELETE FROM jobs WHERE id=?`).bind(id).run();
  await ctx.env.DB.prepare(`DELETE FROM job_images WHERE job_id=?`).bind(id).run();
  return json({ ok:true });
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' }});
}
function bad(msg: string) { return json({ ok:false, error: msg }, 400); }
