import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  deleteMyAccount,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);
router.delete("/delete-account", authMiddleware, deleteMyAccount);

export default router;