import express from 'express';
import { deductCredits, login,signout, updateUserPayment } from '../controllers/auth.controller.js';
import { requireInternalKey } from '../shared/middlewares/internalAuth.js';

const router = express.Router();



router.post('/signin', login);
router.get('/signout',signout )
router.post('/update-plan',requireInternalKey,updateUserPayment )
router.post('/deduct-credit',requireInternalKey,deductCredits )

export default router;