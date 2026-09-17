import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempDir = path.join(__dirname, '../temp');

if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, tempDir);
    },

    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);

        const filename = `${Date.now()}-${Math.round(
            Math.random() * 1E9
        )}${ext}`;

        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {

    if (
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'text/plain' ||
        file.mimetype.startsWith('image/')
    ) {
        cb(null, true);
    } else {
        cb(
            new Error('Only PDF, images and TXT files are allowed'),
            false
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB
    }
});

export default upload;