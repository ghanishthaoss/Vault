import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Persistent storage setup
const DATA_DIR = path.resolve(process.cwd(), 'storage');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
['vault_1', 'vault_2'].forEach(v => {
  const dir = path.join(UPLOADS_DIR, v);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Crypto helpers for password hashing
function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, actualSalt, 64);
  return {
    hash: derivedKey.toString('hex'),
    salt: actualSalt
  };
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  try {
    const key = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), key);
  } catch {
    return false;
  }
}

// Database schema interface
interface PhotoRecord {
  id: string;
  vaultId: 'vault_1' | 'vault_2';
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  uploadDate: string;
  caption?: string;
  favorite: boolean;
  albumId?: string | null;
  filePath: string; // relative to UPLOADS_DIR or public
}

interface AlbumRecord {
  id: string;
  vaultId: 'vault_1' | 'vault_2';
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
}

interface ActivityRecord {
  id: string;
  vaultId: 'vault_1' | 'vault_2';
  type: 'LOGIN' | 'UPLOAD' | 'DELETE' | 'PASSWORD_CHANGE' | 'ALBUM_CREATE';
  description: string;
  timestamp: string;
}

interface VaultConfig {
  id: 'vault_1' | 'vault_2';
  name: string;
  themeColor: string;
  symbol: string;
  passwordHash: string;
  passwordSalt: string;
  settings: {
    layout: 'grid' | 'masonry';
    thumbnailSize: 'compact' | 'medium' | 'large';
    autoLockMinutes: number;
    confirmDelete: boolean;
    slideshowInterval: number; // in seconds
    accentTheme: 'cyan' | 'pink' | 'purple' | 'emerald';
  };
}

interface DBState {
  vaults: Record<'vault_1' | 'vault_2', VaultConfig>;
  photos: PhotoRecord[];
  albums: AlbumRecord[];
  activity: ActivityRecord[];
}

// Initialize DB with secure defaults
function initDB(): DBState {
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse db.json, creating fresh:', e);
    }
  }

  const defaultPass1 = process.env.VAULT_PASSWORD_1 || process.env.VAULT_PASSWORD || 'admin123';
  const defaultPass2 = process.env.VAULT_PASSWORD_2 || process.env.VAULT_PASSWORD || 'admin123';
  const defaultHash1 = hashPassword(defaultPass1);
  const defaultHash2 = hashPassword(defaultPass2);

  const initialDB: DBState = {
    vaults: {
      vault_1: {
        id: 'vault_1',
        name: 'Private Vault I',
        themeColor: '#38bdf8',
        symbol: '♂',
        passwordHash: defaultHash1.hash,
        passwordSalt: defaultHash1.salt,
        settings: {
          layout: 'grid',
          thumbnailSize: 'medium',
          autoLockMinutes: 15,
          confirmDelete: true,
          slideshowInterval: 4,
          accentTheme: 'cyan',
        },
      },
      vault_2: {
        id: 'vault_2',
        name: 'Private Vault II',
        themeColor: '#ec4899',
        symbol: '♀',
        passwordHash: defaultHash2.hash,
        passwordSalt: defaultHash2.salt,
        settings: {
          layout: 'grid',
          thumbnailSize: 'medium',
          autoLockMinutes: 15,
          confirmDelete: true,
          slideshowInterval: 4,
          accentTheme: 'pink',
        },
      },
    },
    photos: [
      {
        id: 'photo_v1_1',
        vaultId: 'vault_1',
        filename: 'vault_sunset_coast_1793180904990.jpg',
        originalName: 'Golden_Hour_Beach_Coast.jpg',
        mimeType: 'image/jpeg',
        size: 242000,
        uploadDate: new Date(Date.now() - 86400000 * 3).toISOString(),
        caption: 'Sunset walk by the Pacific shores - warm breeze and quiet waves.',
        favorite: true,
        albumId: 'album_v1_travel',
        filePath: 'src/assets/images/vault_sunset_coast_1793180904990.jpg',
      },
      {
        id: 'photo_v1_2',
        vaultId: 'vault_1',
        filename: 'vault_night_skyline_1793180906056.jpg',
        originalName: 'HongKong_Harbor_Neon.jpg',
        mimeType: 'image/jpeg',
        size: 318000,
        uploadDate: new Date(Date.now() - 86400000 * 2).toISOString(),
        caption: 'Night city lights reflecting across the bay water.',
        favorite: false,
        albumId: 'album_v1_travel',
        filePath: 'src/assets/images/vault_night_skyline_1793180906056.jpg',
      },
      {
        id: 'photo_v2_1',
        vaultId: 'vault_2',
        filename: 'vault_cozy_cafe_1793180905695.jpg',
        originalName: 'Morning_Coffee_Conversations.jpg',
        mimeType: 'image/jpeg',
        size: 275000,
        uploadDate: new Date(Date.now() - 86400000 * 4).toISOString(),
        caption: 'Our favorite Sunday corner table with warm lattes and books.',
        favorite: true,
        albumId: 'album_v2_moments',
        filePath: 'src/assets/images/vault_cozy_cafe_1793180905695.jpg',
      },
      {
        id: 'photo_v2_2',
        vaultId: 'vault_2',
        filename: 'vault_mountain_lake_1793180905476.jpg',
        originalName: 'Moraine_Twilight_Stars.jpg',
        mimeType: 'image/jpeg',
        size: 349000,
        uploadDate: new Date(Date.now() - 86400000 * 1).toISOString(),
        caption: 'Milky Way rising above the crystalline alpine lake.',
        favorite: true,
        albumId: 'album_v2_getaways',
        filePath: 'src/assets/images/vault_mountain_lake_1793180905476.jpg',
      },
    ],
    albums: [
      {
        id: 'album_v1_travel',
        vaultId: 'vault_1',
        name: 'Wanderlust Journeys',
        description: 'Road trips, weekend escapes, and horizon views',
        color: '#38bdf8',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'album_v2_moments',
        vaultId: 'vault_2',
        name: 'Everyday Magic',
        description: 'Quiet coffee dates, books, and small joys',
        color: '#ec4899',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'album_v2_getaways',
        vaultId: 'vault_2',
        name: 'Starlit Nights',
        description: 'Wild camping and alpine wonders',
        color: '#a855f7',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      },
    ],
    activity: [
      {
        id: 'act_init_1',
        vaultId: 'vault_1',
        type: 'LOGIN',
        description: 'Vault unlocked from Chrome session',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'act_init_2',
        vaultId: 'vault_2',
        type: 'LOGIN',
        description: 'Vault unlocked from mobile device',
        timestamp: new Date().toISOString(),
      },
    ],
  };

  saveDB(initialDB);
  return initialDB;
}

let db = initDB();

function saveDB(data: DBState) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db.json:', err);
  }
}

// In-memory active sessions: token -> { vaultId, expiresAt }
interface Session {
  vaultId: 'vault_1' | 'vault_2';
  expiresAt: number;
}
const sessions = new Map<string, Session>();

// Session cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, sess] of sessions.entries()) {
    if (sess.expiresAt < now) {
      sessions.delete(token);
    }
  }
}, 600000);

// Multer storage for uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const vaultId = (req as any).vaultId;
    const dest = path.join(UPLOADS_DIR, vaultId);
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}_${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, WebP, GIF and SVG images are supported'));
    }
  },
});

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  // Also allow token from query for streaming authenticated <img> and downloads
  if (!token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (session) sessions.delete(token);
    return res.status(401).json({ error: 'Session expired or invalid' });
  }

  (req as any).vaultId = session.vaultId;
  (req as any).sessionToken = token;
  next();
}

// ----------------- API ROUTES -----------------

// 1. Authenticate Vault
app.post('/api/auth/login', (req, res) => {
  const { vaultId, password } = req.body;

  if (vaultId !== 'vault_1' && vaultId !== 'vault_2') {
    return res.status(400).json({ error: 'Invalid vault specified' });
  }

  const vId = vaultId as 'vault_1' | 'vault_2';

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password required' });
  }

  const vault = db.vaults[vId];
  if (!vault) {
    return res.status(404).json({ error: 'Vault configuration not found' });
  }

  const isValid = verifyPassword(password, vault.passwordHash, vault.passwordSalt);
  if (!isValid) {
    return res.status(401).json({ error: 'Incorrect password. Access denied.' });
  }

  // Generate secure 32-byte hex token (24-hour expiration)
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  sessions.set(token, { vaultId, expiresAt });

  // Record activity
  db.activity.unshift({
    id: `act_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    vaultId,
    type: 'LOGIN',
    description: `Vault opened successfully`,
    timestamp: new Date().toISOString(),
  });
  if (db.activity.length > 100) db.activity = db.activity.slice(0, 100);
  saveDB(db);

  return res.json({
    token,
    expiresAt,
    vault: {
      id: vault.id,
      name: vault.name,
      themeColor: vault.themeColor,
      symbol: vault.symbol,
      settings: vault.settings,
    },
  });
});

// 2. Check Session
app.get('/api/auth/session', requireAuth, (req, res) => {
  const vaultId = (req as any).vaultId;
  const vault = db.vaults[vaultId as 'vault_1' | 'vault_2'];
  return res.json({
    authenticated: true,
    vault: {
      id: vault.id,
      name: vault.name,
      themeColor: vault.themeColor,
      symbol: vault.symbol,
      settings: vault.settings,
    },
  });
});

// 3. Logout
app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = (req as any).sessionToken;
  sessions.delete(token);
  return res.json({ success: true, message: 'Vault locked' });
});

// 4. Change Vault Password
app.post('/api/auth/change-password', requireAuth, (req, res) => {
  const vaultId = (req as any).vaultId as 'vault_1' | 'vault_2';
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }

  const vault = db.vaults[vaultId];
  const isValid = verifyPassword(currentPassword, vault.passwordHash, vault.passwordSalt);
  if (!isValid) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }

  const { hash, salt } = hashPassword(newPassword);
  vault.passwordHash = hash;
  vault.passwordSalt = salt;

  db.activity.unshift({
    id: `act_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    vaultId,
    type: 'PASSWORD_CHANGE',
    description: 'Vault access password was updated',
    timestamp: new Date().toISOString(),
  });
  saveDB(db);

  return res.json({ success: true, message: 'Password updated successfully' });
});

// 5. Get Vault Full Data (Strictly isolated by vaultId)
app.get('/api/vault/data', requireAuth, (req, res) => {
  const vaultId = (req as any).vaultId as 'vault_1' | 'vault_2';
  const vault = db.vaults[vaultId];

  const vaultPhotos = db.photos.filter(p => p.vaultId === vaultId);
  const vaultAlbums = db.albums.filter(a => a.vaultId === vaultId);
  const vaultActivity = db.activity.filter(a => a.vaultId === vaultId).slice(0, 30);

  const totalStorage = vaultPhotos.reduce((acc, p) => acc + p.size, 0);

  return res.json({
    vault: {
      id: vault.id,
      name: vault.name,
      themeColor: vault.themeColor,
      symbol: vault.symbol,
      settings: vault.settings,
    },
    photos: vaultPhotos,
    albums: vaultAlbums,
    activity: vaultActivity,
    stats: {
      totalPhotos: vaultPhotos.length,
      favoriteCount: vaultPhotos.filter(p => p.favorite).length,
      albumCount: vaultAlbums.length,
      totalStorageBytes: totalStorage,
      storageFormatted: `${(totalStorage / (1024 * 1024)).toFixed(2)} MB`,
    },
  });
});

// 6. Photo File Delivery (Protected streaming with MIME headers & download flag)
app.get('/api/vault/photos/:id/file', requireAuth, (req, res) => {
  const vaultId = (req as any).vaultId as 'vault_1' | 'vault_2';
  const photo = db.photos.find(p => p.id === req.params.id && p.vaultId === vaultId);

  if (!photo) {
    return res.status(404).json({ error: 'Photo not found or permission denied' });
  }

  // Resolve file location (seeded or uploaded)
  let fullPath: string;
  if (photo.filePath.startsWith('src/') || photo.filePath.startsWith('public/')) {
    fullPath = path.resolve(process.cwd(), photo.filePath);
  } else {
    fullPath = path.join(UPLOADS_DIR, vaultId, photo.filename);
  }

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'Physical image file not found on server' });
  }

  if (req.query.download === '1') {
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(photo.originalName)}"`);
  }

  res.setHeader('Content-Type', photo.mimeType || 'image/jpeg');
  res.setHeader('Cache-Control', 'private, max-age=3600');
  const stream = fs.createReadStream(fullPath);
  stream.pipe(res);
});

// 7. Upload Photo(s) (Multi-file upload with Multer)
app.post('/api/vault/photos/upload', requireAuth, upload.array('photos', 20), (req, res) => {
  const vaultId = (req as any).vaultId as 'vault_1' | 'vault_2';
  const files = req.files as Express.Multer.File[];
  const albumId = req.body.albumId || null;
  const caption = req.body.caption || '';

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files were uploaded' });
  }

  const addedPhotos: PhotoRecord[] = [];

  for (const file of files) {
    const photo: PhotoRecord = {
      id: `photo_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      vaultId,
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadDate: new Date().toISOString(),
      caption: caption || undefined,
      favorite: false,
      albumId: albumId || undefined,
      filePath: path.join('uploads', vaultId, file.filename),
    };

    db.photos.unshift(photo);
    addedPhotos.push(photo);
  }

  db.activity.unshift({
    id: `act_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    vaultId,
    type: 'UPLOAD',
    description: `Uploaded ${files.length} photo${files.length > 1 ? 's' : ''}`,
    timestamp: new Date().toISOString(),
  });
  saveDB(db);

  return res.json({
    success: true,
    message: `Successfully uploaded ${files.length} photo${files.length > 1 ? 's' : ''}`,
    photos: addedPhotos,
  });
});

// 8. Delete Photo(s) (Single or multiple deletion)
app.delete('/api/vault/photos', requireAuth, (req, res) => {
  const vaultId = (req as any).vaultId as 'vault_1' | 'vault_2';
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Array of photo ids is required' });
  }

  let deletedCount = 0;
  db.photos = db.photos.filter(p => {
    if (ids.includes(p.id) && p.vaultId === vaultId) {
      // Remove file if from uploads
      if (p.filePath.startsWith('uploads/')) {
        const fullPath = path.join(DATA_DIR, p.filePath);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (e) {
            console.error('Failed to unlink file:', e);
          }
        }
      }
      deletedCount++;
      return false;
    }
    return true;
  });

  db.activity.unshift({
    id: `act_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    vaultId,
    type: 'DELETE',
    description: `Deleted ${deletedCount} photo${deletedCount > 1 ? 's' : ''}`,
    timestamp: new Date().toISOString(),
  });
  saveDB(db);

  return res.json({ success: true, deletedCount });
});

// 9. Update Photo Metadata (Favorite, Caption, Album assignment)
app.patch('/api/vault/photos/:id', requireAuth, (req, res) => {
  const vaultId = (req as any).vaultId as 'vault_1' | 'vault_2';
  const photo = db.photos.find(p => p.id === req.params.id && p.vaultId === vaultId);

  if (!photo) {
    return res.status(404).json({ error: 'Photo not found' });
  }

  const { caption, favorite, albumId } = req.body;

  if (typeof caption !== 'undefined') photo.caption = caption;
  if (typeof favorite !== 'undefined') photo.favorite = Boolean(favorite);
  if (typeof albumId !== 'undefined') photo.albumId = albumId === '' ? undefined : albumId;

  saveDB(db);
  return res.json({ success: true, photo });
});

// 10. Album Management: Create Album
app.post('/api/vault/albums', requireAuth, (req, res) => {
  const vaultId = (req as any).vaultId as 'vault_1' | 'vault_2';
  const { name, description, color } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Album name is required' });
  }

  const newAlbum: AlbumRecord = {
    id: `album_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    vaultId,
    name: name.trim(),
    description: description ? description.trim() : undefined,
    color: color || '#38bdf8',
    createdAt: new Date().toISOString(),
  };

  db.albums.push(newAlbum);
  db.activity.unshift({
    id: `act_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    vaultId,
    type: 'ALBUM_CREATE',
    description: `Created album "${newAlbum.name}"`,
    timestamp: new Date().toISOString(),
  });
  saveDB(db);

  return res.json({ success: true, album: newAlbum });
});

// 11. Rename / Update Album
app.patch('/api/vault/albums/:id', requireAuth, (req, res) => {
  const vaultId = (req as any).vaultId as 'vault_1' | 'vault_2';
  const album = db.albums.find(a => a.id === req.params.id && a.vaultId === vaultId);

  if (!album) {
    return res.status(404).json({ error: 'Album not found' });
  }

  const { name, description, color } = req.body;
  if (name) album.name = name.trim();
  if (typeof description !== 'undefined') album.description = description;
  if (color) album.color = color;

  saveDB(db);
  return res.json({ success: true, album });
});

// 12. Delete Album
app.delete('/api/vault/albums/:id', requireAuth, (req, res) => {
  const vaultId = (req as any).vaultId as 'vault_1' | 'vault_2';
  const index = db.albums.findIndex(a => a.id === req.params.id && a.vaultId === vaultId);

  if (index === -1) {
    return res.status(404).json({ error: 'Album not found' });
  }

  const [deleted] = db.albums.splice(index, 1);

  // Unassign photos from this album
  db.photos.forEach(p => {
    if (p.vaultId === vaultId && p.albumId === req.params.id) {
      delete p.albumId;
    }
  });

  saveDB(db);
  return res.json({ success: true, message: `Album "${deleted.name}" deleted` });
});

// 13. Update Vault Settings
app.patch('/api/vault/settings', requireAuth, (req, res) => {
  const vaultId = (req as any).vaultId as 'vault_1' | 'vault_2';
  const vault = db.vaults[vaultId];

  const { layout, thumbnailSize, autoLockMinutes, confirmDelete, slideshowInterval, accentTheme, name } = req.body;

  if (layout) vault.settings.layout = layout;
  if (thumbnailSize) vault.settings.thumbnailSize = thumbnailSize;
  if (typeof autoLockMinutes === 'number') vault.settings.autoLockMinutes = autoLockMinutes;
  if (typeof confirmDelete === 'boolean') vault.settings.confirmDelete = confirmDelete;
  if (typeof slideshowInterval === 'number') vault.settings.slideshowInterval = slideshowInterval;
  if (accentTheme) vault.settings.accentTheme = accentTheme;
  if (name && typeof name === 'string') vault.name = name.trim();

  saveDB(db);
  return res.json({ success: true, settings: vault.settings, name: vault.name });
});

// ----------------- SERVING STATIC OR VITE MIDDLEWARE -----------------

async function startServer() {
  const server = http.createServer(app);

  const isProd = process.env.NODE_ENV === 'production' || 
    process.env.npm_lifecycle_event === 'start' || 
    (fs.existsSync(path.resolve(process.cwd(), 'dist')) && process.env.npm_lifecycle_event !== 'dev');

  if (isProd && fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.use(express.static(path.resolve(process.cwd(), 'public')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`KG-Vault Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
