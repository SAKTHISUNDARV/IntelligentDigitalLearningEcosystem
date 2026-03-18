const express = require('express');
const router = express.Router();
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireRole } = require('../middleware/auth');
const path = require('path');

// Initialize Supabase Client for Storage
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

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
    const ext = path.extname(req.file.originalname);
    const fileName = `${Date.now()}-${req.user.sub}${ext}`;
    
    const { data, error } = await supabase.storage
      .from('course-images')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('course-images')
      .getPublicUrl(fileName);

    res.status(200).json({ url: publicData.publicUrl });
  } catch (err) {
    console.error('[Upload Image]', err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.post('/pdf', authenticateToken, requireRole('admin'), upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  if (req.file.mimetype !== 'application/pdf') {
     return res.status(400).json({ error: 'Only PDF files are allowed' });
  }

  try {
    const fileName = `${Date.now()}-${req.user.sub}.pdf`;
    
    const { data, error } = await supabase.storage
      .from('course-materials')
      .upload(fileName, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('course-materials')
      .getPublicUrl(fileName);

    res.status(200).json({ url: publicData.publicUrl });
  } catch (err) {
    console.error('[Upload PDF]', err);
    res.status(500).json({ error: 'Failed to upload pdf' });
  }
});

module.exports = router;
