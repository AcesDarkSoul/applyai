import type { NextFunction, Request, Response } from 'express';
import type { PlanFeature } from '../domain/plans';
import { AppError } from './errorHandler';
import { profileService } from '../services/profileService';
import { assertFeature, isBillingEnforced } from '../services/planService';

export function requireFeature(feature: PlanFeature) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }
      if (!isBillingEnforced()) {
        next();
        return;
      }
      const profile = await profileService.getOrCreate(req.user);
      assertFeature(profile, feature);
      next();
    } catch (err) {
      next(err);
    }
  };
}
