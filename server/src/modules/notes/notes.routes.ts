import { Router } from 'express';
import multer from 'multer';
import { auth } from '../../middleware/auth';
import * as ctrl from './notes.controller';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: (req,file,cb)=>{
  const ok = ['image/jpeg','image/png','image/jpg','application/pdf'].includes(file.mimetype);
  if(!ok) return cb(new Error('Invalid file type')); cb(null,true);
}});
const router = Router();
router.use(auth());
router.post('/children/:id/notes', upload.single('file'), ctrl.create);
router.get('/children/:id/notes', ctrl.list);
router.patch('/notes/:id', ctrl.update);
router.delete('/notes/:id', ctrl.remove);
router.post('/notes/:id/ai-ocr', ctrl.aiOcr);
export default router;
