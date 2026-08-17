import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { analyzeResume } from "../controllers/resumeController.js";

const router = express.Router();

router.post(
  "/analyze",
  authMiddleware,
  upload.single("resume"),
  analyzeResume
);

export default router;
