import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Check if token is available
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return response.status(500).json({
      error: 'Vercel Blob Storage is not configured. Please set the BLOB_READ_WRITE_TOKEN environment variable in your Vercel project settings.'
    });
  }

  // Handle standard HTTP method checks
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed. Only POST is supported.' });
  }

  try {
    const body = request.body as HandleUploadBody;
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Here you can implement authentication or user session validations if needed.
        // For this media showcase, we permit authenticated uploads.
        return {
          allowedContentTypes: [
            'image/jpeg', 
            'image/png', 
            'image/gif', 
            'image/webp', 
            'image/heic', 
            'image/heif', 
            'image/svg+xml',
            'video/mp4', 
            'video/webm', 
            'video/quicktime',
            'video/ogg',
            'video/x-matroska',
            'video/avi'
          ],
          tokenPayload: JSON.stringify({
            // optional metadata
            uploadedAt: new Date().toISOString(),
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // This is called on Vercel's servers after the client finishes uploading.
        console.log('Blob upload completed successfully:', blob, tokenPayload);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: (error as Error).message });
  }
}
