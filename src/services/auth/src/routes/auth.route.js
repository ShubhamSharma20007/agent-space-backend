import express from 'express';
import { deductCredits, login,signout, updateUserPayment } from '../controllers/auth.controller.js';

const router = express.Router();



router.post('/signin', login);
router.get('/signout',signout )
router.post('/update-plan',updateUserPayment )
router.post('/deduct-credit',deductCredits )

export default router;