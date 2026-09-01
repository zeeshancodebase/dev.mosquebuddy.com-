import { registerInterest, getInterestSummary } from '../services/featureInterest.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const postFeatureInterest = async (req, res, next) => {
  try {
    const { featureKey } = req.body;
    if (!featureKey) {
      return res.status(400).json({ success: false, message: 'featureKey is required' });
    }
    const result = await registerInterest({ featureKey, userId: req.user?.id });
    return successResponse(res, {
      statusCode: 200,
      message: result.alreadyRegistered ? 'Interest already recorded' : 'JazakAllahu khair, interest recorded',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getFeatureInterestSummary = async (req, res, next) => {
  try {
    const data = await getInterestSummary();
    return successResponse(res, { statusCode: 200, message: 'Feature interest summary', data });
  } catch (error) {
    next(error);
  }
};