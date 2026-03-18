const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { pool } = require('../db');

const COURSE_TITLE = 'Backend with Node.js';
const BUCKET = 'course-materials';
const ROOT_DIR = 'C:\\Users\\sunda\\Downloads\\nodejs_course_pdfs\\pdfs';

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

function collectPdfs(rootDir) {
  const items = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        const rel = path.relative(rootDir, full);
        const match = rel.replace(/\\/g, '/').match(/module(\d+)\/lesson(\d+)\.pdf$/i);
        if (match) {
          items.push({
            moduleNum: parseInt(match[1], 10),
            lessonNum: parseInt(match[2], 10),
            path: full
          });
        }
      }
    }
  };
  walk(rootDir);
  return items.sort((a, b) => a.moduleNum - b.moduleNum || a.lessonNum - b.lessonNum);
}

async function uploadFile(supabase, filePath, key) {
  const buffer = fs.readFileSync(filePath);
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(key, buffer, { contentType: 'application/pdf', upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(key);
  return data.publicUrl;
}

async function run() {
  const supabase = getSupabaseClient();
  // Ensure bucket exists (create if missing)
  const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
  if (bucketErr) throw bucketErr;
  const existing = (buckets || []).find(b => b.name === BUCKET);
  if (!existing) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true });
    if (createErr) throw createErr;
  }

  const pdfs = collectPdfs(ROOT_DIR);
  if (pdfs.length === 0) {
    throw new Error(`No PDFs found under ${ROOT_DIR}`);
  }

  const [courses] = await pool.query(
    'SELECT id, title FROM courses WHERE title = $1',
    [COURSE_TITLE]
  );
  if (!courses.length) {
    throw new Error(`Course not found: ${COURSE_TITLE}`);
  }
  const courseId = courses[0].id;

  const [modules] = await pool.query(
    'SELECT id, title, sort_order FROM modules WHERE course_id = $1 ORDER BY sort_order',
    [courseId]
  );
  if (!modules.length) {
    throw new Error('No modules found for course.');
  }

  const [lessons] = await pool.query(
    `SELECT l.id, l.module_id, l.title, l.sort_order
     FROM lessons l
     JOIN modules m ON m.id = l.module_id
     WHERE m.course_id = $1
     ORDER BY m.sort_order, l.sort_order`,
    [courseId]
  );

  const lessonsByModule = new Map();
  for (const mod of modules) {
    lessonsByModule.set(mod.sort_order, lessons.filter(l => l.module_id === mod.id));
  }

  await pool.query('BEGIN');
  try {
    await pool.query(
      `DELETE FROM materials
       WHERE module_id IN (SELECT id FROM modules WHERE course_id = $1)`,
      [courseId]
    );

    const courseSlug = slugify(COURSE_TITLE);

    for (const pdf of pdfs) {
      const moduleOrder = pdf.moduleNum;
      const lessonIndex = pdf.lessonNum - 1;
      const module = modules.find(m => m.sort_order === moduleOrder);
      if (!module) {
        console.warn(`Skipping PDF without module match: ${pdf.path}`);
        continue;
      }

      const moduleLessons = lessonsByModule.get(moduleOrder) || [];
      const lesson = moduleLessons[lessonIndex];
      if (!lesson) {
        console.warn(`Skipping PDF without lesson match: ${pdf.path}`);
        continue;
      }

      const key = `${courseSlug}/module-${String(moduleOrder).padStart(2, '0')}/lesson-${String(pdf.lessonNum).padStart(2, '0')}.pdf`;
      const url = await uploadFile(supabase, pdf.path, key);

      await pool.query(
        `INSERT INTO materials (module_id, title, file_url, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [
          module.id,
          `Lesson PDF - ${lesson.title}`,
          url,
          lesson.sort_order || pdf.lessonNum
        ]
      );
    }

    await pool.query('COMMIT');
    console.log('✅ PDF materials uploaded and linked successfully.');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error('❌ Upload failed:', err.message);
  process.exit(1);
});
