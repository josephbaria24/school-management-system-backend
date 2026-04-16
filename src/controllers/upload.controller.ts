import { Request, Response } from "express";
import multer from "multer";
import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

const maxBytes = 8 * 1024 * 1024;

export const uploadImageMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxBytes },
  fileFilter: (_req, file, cb) => {
    const ok = /^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/i.test(file.mimetype);
    cb(null, ok);
  },
}).single("file");

export const uploadImage = (req: Request, res: Response) => {
  if (!process.env.CLOUDINARY_URL?.trim()) {
    return res.status(503).json({
      error:
        "Image upload is not configured. Set CLOUDINARY_URL in the server .env file.",
    });
  }

  const run = async () => {
    if (!req.file?.buffer?.length) {
      return res.status(400).json({ error: "No image file (field name: file)" });
    }

    const folderRaw = (req.body?.folder as string | undefined)?.trim();
    const folder = folderRaw?.replace(/^\/+|\/+$/g, "") || "sms/logos";

    try {
      const result = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: "image" },
            (err, r) => {
              if (err) reject(err);
              else if (!r) reject(new Error("Empty Cloudinary response"));
              else resolve(r);
            }
          );
          stream.end(req.file!.buffer);
        }
      );

      res.json({
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
      });
    } catch (err) {
      console.error("Cloudinary upload:", err);
      res.status(500).json({ error: "Image upload failed" });
    }
  };

  void run();
};
