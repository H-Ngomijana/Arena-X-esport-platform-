import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

const CLOUDINARY_CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME || "").trim();
const CLOUDINARY_API_KEY = (process.env.CLOUDINARY_API_KEY || "").trim();
const CLOUDINARY_API_SECRET = (process.env.CLOUDINARY_API_SECRET || "").trim();

export const cloudinaryEnabled = Boolean(
  CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function assertCloudinaryConfigured() {
  if (!cloudinaryEnabled) {
    throw new Error(
      "Missing Cloudinary credentials. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET."
    );
  }
}

export function uploadBufferToCloudinary({
  buffer,
  folder,
  publicId,
  resourceType = "auto",
  overwrite = false,
  invalidate = true,
  filename,
}) {
  assertCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: publicId,
        overwrite,
        invalidate,
        use_filename: !publicId,
        unique_filename: !publicId,
        filename_override: filename,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    Readable.from(buffer).pipe(stream);
  });
}

export async function deleteCloudinaryAsset(publicId, resourceType = "image") {
  if (!publicId) return null;
  assertCloudinaryConfigured();
  return cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
}
