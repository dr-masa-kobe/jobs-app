CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  location TEXT,
  salary TEXT,
  employment_type TEXT,
  status TEXT DEFAULT 'open',
  description TEXT,
  tags TEXT,
  updated_at INTEGER
);

CREATE TABLE IF NOT EXISTS job_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id TEXT NOT NULL,
  key TEXT NOT NULL,
  created_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_updated ON jobs(updated_at);
