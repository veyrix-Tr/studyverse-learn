const express    = require('express');
const router     = express.Router();
const axios      = require('axios');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

const ALLOWED_HOST = 'res.cloudinary.com';

const MIME = {
  pdf:  'application/pdf',
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  gif:  'image/gif',
  webp: 'image/webp',
  doc:  'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ppt:  'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

function parseCloudinaryUrl(url) {
  try {
    const { pathname } = new URL(url);
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length < 4) return null;
    const resourceType = parts[1];
    const deliveryType = parts[2];
    let rest = parts.slice(3);
    while (rest.length > 0 && !/^v\d+$/.test(rest[0]) && !rest[0].includes('.') && rest.length > 1) {
      rest = rest.slice(1);
    }
    let version = null;
    if (/^v\d+$/.test(rest[0])) { version = rest[0].slice(1); rest = rest.slice(1); }
    const fullName = rest.join('/');
    const lastDot  = fullName.lastIndexOf('.');
    const publicId = lastDot > 0 ? fullName.slice(0, lastDot) : fullName;
    const format   = lastDot > 0 ? fullName.slice(lastDot + 1) : '';
    return { resourceType, deliveryType, version, publicId, format };
  } catch { return null; }
}

router.get('/proxy', async (req, res) => {
  const { url, download } = req.query;
  const forceDownload = download === '1';
  if (!url) return res.status(400).json({ error: 'url is required' });

  let parsed;
  try { parsed = new URL(url); } catch {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  if (parsed.hostname !== ALLOWED_HOST)
    return res.status(403).json({ error: 'Only Cloudinary URLs are allowed' });

  const info = parseCloudinaryUrl(url);
  if (!info) return res.status(400).json({ error: 'Cannot parse Cloudinary URL' });

  const { resourceType, deliveryType, publicId, format } = info;
  const isPdf    = format?.toLowerCase() === 'pdf';
  const mime     = MIME[format?.toLowerCase()] || 'application/octet-stream';
  const filename = `${publicId.split('/').pop()}.${format}`;

  const apiDownloadUrl = cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
    type:          deliveryType,
  });

  try {
    const r = await axios.get(apiDownloadUrl, {
      responseType:   'arraybuffer',
      maxRedirects:   5,
      timeout:        15000,
      validateStatus: () => true,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });

    if (r.status >= 200 && r.status < 300) {
      const bytes = Buffer.from(r.data);
      res.setHeader('Content-Type', isPdf ? 'application/pdf' : mime);
      const disposition = (isPdf && !forceDownload) ? 'inline' : 'attachment';
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      return res.send(bytes);
    }
  } catch (err) {
    console.error(`[proxy] ${err.message}`);
  }

  return res.redirect(302, apiDownloadUrl);
});

module.exports = router;
