import { Router } from "express";
import {authMiddleware} from "../middlewares/authMiddleware.js";
import { resolveMapsLinkController } from "../controllers/mapsLink.controller.js";

const router = Router();

// POST /api/utils/resolve-maps-link
// router.post("/resolve-maps-link", authMiddleware, resolveMapsLinkController);

router.post("/resolve-maps-link", resolveMapsLinkController);

export default router;