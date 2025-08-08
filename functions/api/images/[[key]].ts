export const onRequestGet: PagesFunction<{ JOB_IMAGES: R2Bucket }> = async (ctx) => {
  // [[key]] で /api/images/<anything/with/slashes> を受ける
  const key = decodeURIComponent((ctx.params.key as string) || '');
  const obj = await ctx.env.JOB_IMAGES.get(key);
  if (!obj) return new Response('not found', { status: 404 });
  return new Response(obj.body, { headers: { 'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream' }});
};
