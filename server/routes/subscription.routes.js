// routes/subscription.routes.js
import express from "express";
import { auth } from "../middleware/auth.js";
import {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  getAllPlans
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.get("/plans", getAllPlans);

router.use(auth);

router.post('/', auth, createSubscription);
router.get('/', getAllSubscriptions);
router.get('/:id', getSubscriptionById);


export default router; 