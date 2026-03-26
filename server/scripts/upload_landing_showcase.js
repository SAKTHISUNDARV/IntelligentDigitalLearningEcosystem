require('../config/loadEnv');

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'landing-assets';
const PREFIX = 'showcase';

const SOURCE_FILES = [
  'C:\\Users\\sunda\\OneDrive\\Pictures\\Screenshots\\Screenshot 2026-03-24 224024.png',
  'C:\\Users\\sunda\\OneDrive\\Pictures\\Screenshots\\Screenshot 2026-03-24 224040.png',
  'C:\\Users\\sunda\\OneDrive\\Pictures\\Screenshots\\Screenshot 2026-03-24 224157.png',
  'C:\\Users\\sunda\\OneDrive\\Pictures\\Screenshots\\Screenshot 2026-03-24 224207.png',
  'C:\\Users\\sunda\\OneDrive\\Pictures\\Screenshots\\Screenshot 2026-03-24 224218.png',
  'C:\\Users\\sunda\\OneDrive\\Pictures\\Screenshots\\Screenshot 2026-03-24 224231.png',
  'C:\\Users\\sunda\\OneDrive\\Pictures\\Screenshots\\Screenshot 2026-03-24 224434.png',
  'C:\\Users\\sunda\\OneDrive\\Pictures\\Screenshots\\Screenshot 2026-03-24 224442.png',
];

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) must be set.');
  }

  return createClient(url, key);
}

async function ensureBucket(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  const existing = (buckets || []).find((bucket) => bucket.name === BUCKET);
  if (!existing) {
    const { error: createError } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (createError) throw createError;
  }
}

async function listAllObjects(supabase, prefix) {
  const collected = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data, error } = await supabase.storage.from(BUCKET).list(prefix, {
      limit,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    });

    if (error) throw error;
    const items = data || [];
    collected.push(...items);

    if (items.length < limit) {
      break;
    }
    offset += limit;
  }

  return collected
    .filter((item) => item && item.name && !item.id?.endsWith('/'))
    .map((item) => `${prefix}/${item.name}`);
}

async function removeExistingShowcase(supabase) {
  const existingObjects = await listAllObjects(supabase, PREFIX);
  if (!existingObjects.length) {
    return;
  }

  const { error } = await supabase.storage.from(BUCKET).remove(existingObjects);
  if (error) throw error;
}

async function uploadFiles(supabase) {
  const uploaded = [];

  for (let index = 0; index < SOURCE_FILES.length; index += 1) {
    const sourceFile = SOURCE_FILES[index];
    if (!fs.existsSync(sourceFile)) {
      throw new Error(`Source image not found: ${sourceFile}`);
    }

    const ext = path.extname(sourceFile).toLowerCase() || '.png';
    const objectKey = `${PREFIX}/screenshot-${String(index + 1).padStart(2, '0')}${ext}`;
    const buffer = fs.readFileSync(sourceFile);

    const { error } = await supabase.storage.from(BUCKET).upload(objectKey, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(objectKey);
    uploaded.push({
      key: objectKey,
      url: data.publicUrl,
    });
  }

  return uploaded;
}

async function run() {
  const supabase = getSupabaseClient();
  await ensureBucket(supabase);
  await removeExistingShowcase(supabase);
  const uploaded = await uploadFiles(supabase);
  console.log(JSON.stringify(uploaded, null, 2));
}

run().catch((error) => {
  console.error('Landing showcase upload failed:', error.message);
  process.exit(1);
});
