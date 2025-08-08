export const onRequestPost: PagesFunction<{ JOB_IMAGES: R2Bucket, DB: D1Database }> = async (ctx) => {
  const contentType = ctx.request.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) return bad('multipart only');

  const form = await ctx.request.formData();
  const file = form.get('file') as File | null;
  const jobId = String(form.get('jobId') || '');
  if (!file || !jobId) return bad('missing file or jobId');

  const key = `${jobId}/${crypto.randomUUID()}-${file.name}`;
  await ctx.env.JOB_IMAGES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  await ctx.env.DB.prepare(`INSERT INTO job_images (job_id,key,created_at) VALUES (?,?,?)`)
    .bind(jobId, key, Date.now()).run();

  return new Response(JSON.stringify({ ok:true, key }), { headers: { 'Content-Type':'application/json' }});
};

function bad(msg: string) {
  return new Response(JSON.stringify({ ok:false, error: msg }), { status: 400, headers: { 'Content-Type':'application/json' }});
}
