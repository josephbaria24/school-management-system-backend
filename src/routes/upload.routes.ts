import { Router } from "express";
import {
  uploadImage,
  uploadImageMiddleware,
} from "../controllers/upload.controller.js";

const router = Router();

router.post(
  "/upload/image",
  (req, res, next) => {
    uploadImageMiddleware(req, res, (err: unknown) => {
      if (err) {
        const e = err as { code?: string; message?: string };
        if (e.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({ error: "File too large (max 8 MB)" });
          return;
        }
        res.status(400).json({ error: e.message || "Invalid upload" });
        return;
      }
      next();
    });
  },
  uploadImage
);

export default router;
