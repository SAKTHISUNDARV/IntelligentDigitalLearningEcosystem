const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { pool } = require('../db');

const COURSE_TITLE = 'Backend with Node.js';
const IMAGE_PATH = 'C:\\Users\\sunda\\Downloads\\NodeJS-for-Backend-Development.jpg';
const BUCKET = 'course-images';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set in env.');
  }
  return createClient(url, key);
}

async function ensureBucket(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;
  const existing = (buckets || []).find(b => b.name === BUCKET);
  if (!existing) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (createErr) throw createErr;
  }
}

async function run() {
  if (!fs.existsSync(IMAGE_PATH)) {
    throw new Error(`Image not found: ${IMAGE_PATH}`);
  }

  const supabase = getSupabaseClient();
  await ensureBucket(supabase);

  const ext = path.extname(IMAGE_PATH).toLowerCase() || '.jpg';
  const key = `${slugify(COURSE_TITLE)}/thumbnail${ext}`;
  const buffer = fs.readFileSync(IMAGE_PATH);

  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, { contentType: 'image/jpeg', upsert: true });
  if (uploadErr) throw uploadErr;

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(key);
  const publicUrl = publicData.publicUrl;

  const [courses] = await pool.query(
    'SELECT id FROM courses WHERE title = $1',
    [COURSE_TITLE]
  );
  if (!courses.length) {
    throw new Error(`Course not found: ${COURSE_TITLE}`);
  }

  await pool.query(
    'UPDATE courses SET thumbnail_url = $1, updated_at = NOW() WHERE title = $2',
    [publicUrl, COURSE_TITLE]
  );

  console.log('✅ Thumbnail uploaded and course updated:', publicUrl);
  await pool.end();
}

run().catch((err) => {
  console.error('❌ Thumbnail upload failed:', err.message);
  process.exit(1);
});
