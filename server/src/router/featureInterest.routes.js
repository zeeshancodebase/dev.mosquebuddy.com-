import { Router } from 'express';
import { roleMiddleware } from '../middlewares/roleMiddleware.js';
import { postFeatureInterest, getFeatureInterestSummary } from '../controllers/featureInterest.controller.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { optionalAuthMiddleware } from '../middlewares/optionalAuthMiddleware.js';

const router = Router();

router.post('/feature-interest', optionalAuthMiddleware, postFeatureInterest);
router.get('/admin/feature-interest/summary', authMiddleware, roleMiddleware('super_admin'), getFeatureInterestSummary);

export default router;