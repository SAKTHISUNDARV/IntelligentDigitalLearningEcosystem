const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireRole } = require('../middleware/auth');
const path = require('path');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);
const IMAGE_BUCKET = 'course-images';
const PDF_BUCKET = 'course-materials';

function getErrorDetails(err) {
  return {
    message: err?.message || 'Unknown error',
    name: err?.name || null,
    statusCode: err?.statusCode || err?.status || null,
    details: err?.details || null,
    hint: err?.hint || null
  };
}

async function ensureBucket(bucketName) {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) throw error;

  const existing = (buckets || []).find(bucket => bucket.name === bucketName);
  if (existing) return;

  const { error: createErr } = await supabase.storage.createBucket(bucketName, {
    public: true
  });
  if (createErr) throw createErr;
}

// Configure Multer to keep files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

router.post('/image', authenticateToken, requireRole('admin'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    await ensureBucket(IMAGE_BUCKET);
    const ext = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${req.user.sub}${ext}`;
    
    const { data, error } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from(IMAGE_BUCKET)
      .getPublicUrl(fileName);

    res.status(200).json({ url: publicData.publicUrl });
  } catch (err) {
    const details = getErrorDetails(err);
    console.error('[Upload Image]', details);
    res.status(500).json({
      error: details.message || 'Failed to upload image',
      details
    });
  }
});

router.post('/pdf', authenticateToken, requireRole('admin'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  if (req.file.mimetype !== 'application/pdf') {
     return res.status(400).json({ error: 'Only PDF files are allowed' });
  }

  try {
    await ensureBucket(PDF_BUCKET);
    const fileName = `${Date.now()}-${req.user.sub}.pdf`;
    
    const { data, error } = await supabase.storage
      .from(PDF_BUCKET)
      .upload(fileName, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from(PDF_BUCKET)
      .getPublicUrl(fileName);

    res.status(200).json({ url: publicData.publicUrl });
  } catch (err) {
    const details = getErrorDetails(err);
    console.error('[Upload PDF]', details);
    res.status(500).json({
      error: details.message || 'Failed to upload pdf',
      details
    });
  }
});

module.exports = router;
