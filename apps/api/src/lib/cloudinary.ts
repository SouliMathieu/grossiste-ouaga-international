import {
  v2 as cloudinary,
  type UploadApiResponse,
} from 'cloudinary';
import { env } from '../config/env.js';

type CloudinaryResourceType =
  | 'image'
  | 'video'
  | 'raw';

export function isCloudinaryConfigured() {
  return Boolean(
    env.CLOUDINARY_CLOUD_NAME &&
      env.CLOUDINARY_API_KEY &&
      env.CLOUDINARY_API_SECRET,
  );
}

function getCloudinaryClient() {
  const cloudName =
    env.CLOUDINARY_CLOUD_NAME;
  const apiKey =
    env.CLOUDINARY_API_KEY;
  const apiSecret =
    env.CLOUDINARY_API_SECRET;

  if (
    !cloudName ||
    !apiKey ||
    !apiSecret
  ) {
    throw new Error(
      'CLOUDINARY_NOT_CONFIGURED',
    );
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinary;
}

export async function uploadMediaBuffer(
  buffer: Buffer,
  options: {
    folder: string;
    resourceType:
      CloudinaryResourceType;
  },
) {
  const client =
    getCloudinaryClient();

  return new Promise<UploadApiResponse>(
    (resolve, reject) => {
      const stream =
        client.uploader.upload_stream(
          {
            folder: options.folder,
            resource_type:
              options.resourceType,
            overwrite: false,
            unique_filename: true,
            use_filename: false,
          },
          (error, result) => {
            if (error) {
              reject(error);
              return;
            }

            if (!result) {
              reject(
                new Error(
                  'CLOUDINARY_EMPTY_RESPONSE',
                ),
              );
              return;
            }

            resolve(result);
          },
        );

      stream.end(buffer);
    },
  );
}

export async function destroyMediaAsset(
  publicId: string,
  resourceType:
    CloudinaryResourceType,
) {
  const client =
    getCloudinaryClient();

  return client.uploader.destroy(
    publicId,
    {
      resource_type:
        resourceType,
      invalidate: true,
    },
  );
}
