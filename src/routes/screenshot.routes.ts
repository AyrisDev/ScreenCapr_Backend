import { Router } from "express";
import { screenshotController } from "../controllers/screenshot.controller";
import {
  validateScreenshotRequest,
  validateBatchScreenshotRequest,
} from "../middleware/validation.middleware";
import {
  screenshotRateLimit,
  batchScreenshotRateLimit,
} from "../middleware/rateLimit.middleware";
import { asyncHandler } from "../middleware/error.middleware";

const router = Router();

// Single screenshot endpoint
router.post(
  "/screenshot",
  screenshotRateLimit,
  validateScreenshotRequest,
  asyncHandler(screenshotController.takeScreenshot.bind(screenshotController))
);

// Batch screenshots endpoint
router.post(
  "/batch-screenshots",
  batchScreenshotRateLimit,
  validateBatchScreenshotRequest,
  asyncHandler(
    screenshotController.takeBatchScreenshots.bind(screenshotController)
  )
);

// Health check endpoint
router.get(
  "/health",
  asyncHandler(screenshotController.healthCheck.bind(screenshotController))
);

// Test endpoint for development
router.get(
  "/test",
  asyncHandler(screenshotController.testEndpoint.bind(screenshotController))
);

export default router;
