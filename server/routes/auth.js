// server/routes/auth.js
import express from "express";
import { register, login } from "../controllers/user.controller.js";
import { validateRegistration, validateLogin } from "../middleware/validation.js";
import { validationResult } from "express-validator";

const router = express.Router();

router.post('/register', validateRegistration, (req, res, next) => {
  const errors = validationResult(req);
  console.log("Validation errors:", errors.array());
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return register(req, res, next);
});

// Similar for login
router.post('/login', validateLogin, (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  return login(req, res, next);
});

// Export router
export default router;


// Test route without validation
router.post('/test', (req, res) => {
    res.status(200).json({ message: "Open endpoint works" });
  });