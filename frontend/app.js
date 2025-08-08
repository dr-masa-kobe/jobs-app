let state = { data: [], sortCol: 'updated_at', dir: 'desc', q: '', status: '' };

const tbody = document.querySelector('#jobsTable tbody');
const q = document.querySelector('#q');
const statusSel = document.querySelector('#status');

async function load() {
  const url = `/api/jobs?q=${encodeURIComponent(state.q)}&status=${encodeURIComponent(state.status)}&sort=${state.sortCol}&dir=${state.dir}`;
  const { data } = await fetch(url).then(r=>r.json());
  state.data = data;
  render();
}

function render() {
  tbody.innerHTML = '';
  for (const row of state.data) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(row.title||'')}</td>
      <td>${escapeHtml(row.location||'')}</td>
      <td>${escapeHtml(row.salary||'')}</td>
      <td>${escapeHtml(row.employment_type||'')}</td>
      <td>${escapeHtml(row.status)}</td>
      <td>${new Date(row.updated_at).toLocaleString()}</td>
      <td>
        <button data-id="${row.id}" class="edit">編集</button>
        <a href="/preview.html?id=${encodeURIComponent(row.id)}" target="_blank">プレビュー</a>
        <button data-id="${row.id}" class="del">削除</button>
      </td>`;
    tbody.appendChild(tr);
  }
}

document.querySelectorAll('th[data-col]').forEach(th=>{
  th.addEventListener('click', ()=>{
    const col = th.dataset.col;
    state.dir = (state.sortCol===col && state.dir==='asc') ? 'desc' : 'asc';
    state.sortCol = col;
    load();
  });
});

q.addEventListener('input', debounce(()=>{ state.q = q.value.trim(); load(); }, 300));
statusSel.addEventListener('change', ()=>{ state.status = statusSel.value; load(); });

document.getElementById('newJob').onclick = async () => {
  openEditDialog({ id:'', title:'', location:'', salary:'', employment_type:'', status:'draft', tags:[], description:'' });
};

tbody.addEventListener('click', async (e)=>{
  const btn = e.target.closest('button');
  if (!btn) return;
  const id = btn.dataset.id;
  const job = state.data.find(x=>x.id===id);
  if (btn.classList.contains('edit')) openEditDialog(job);
  if (btn.classList.contains('del')) {
    if (!confirm('削除しますか？')) return;
    await fetch(`/api/jobs?id=${encodeURIComponent(id)}`, { method:'DELETE' });
    load();
  }
});

function openEditDialog(job) {
  const dlg = document.getElementById('editDlg');
  const form = document.getElementById('editForm');
  form.id.value = job.id || '';
  form.title.value = job.title || '';
  form.location.value = job.location || '';
  form.salary.value = job.salary || '';
  form.employment_type.value = job.employment_type || '';
  form.status.value = job.status || 'draft';
  form.tags.value = (Array.isArray(job.tags)?job.tags:JSON.parse(job.tags||'[]')).join(',');
  form.description.value = job.description || '';
  dlg.showModal();

  document.getElementById('uploadImg').onclick = async (ev)=>{
    ev.preventDefault();
    if (!form.id.value) { alert('先に保存してIDを発行してください'); return; }
    const f = document.getElementById('imgFile').files?.[0];
    if (!f) return;
    const fd = new FormData();
    fd.append('file', f);
    fd.append('jobId', form.id.value);
    await fetch('/api/upload', { method:'POST', body: fd });
    alert('画像をアップしました');
  };

  document.getElementById('saveBtn').onclick = async ()=>{
    const payload = {
      id: form.id.value || undefined,
      title: form.title.value,
      location: form.location.value,
      salary: form.salary.value,
      employment_type: form.employment_type.value,
      status: form.status.value,
      tags: form.tags.value.split(',').map(s=>s.trim()).filter(Boolean),
      description: form.description.value
    };
    const method = payload.id ? 'PUT' : 'POST';
    const res = await fetch('/api/jobs', { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const js = await res.json();
    if (!payload.id) payload.id = js.id;
    alert('保存しました');
    dlg.close();
    load();
  };
}

// CSV（現在の検索・ソート結果）
document.getElementById('exportCsv').onclick = ()=>{
  const rows = state.data;
  const header = ['id','title','location','salary','employment_type','status','updated_at'];
  const csv = [header.join(',')].concat(rows.map(r=>header.map(h=>{
    const val = r[h] ?? '';
    return `"${String(val).replace(/"/g,'""')}"`;
  }).join(','))).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `jobs_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
};

function debounce(fn, ms){ let t; return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), ms); }; }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }

load();
