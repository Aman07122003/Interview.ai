// routes/subscriptionRoutes.js
import express from 'express';
import { createSubscription } from '../controllers/payment.controller.js';

const router = express.Router();

router.post('/create', createSubscription);

export default router;
