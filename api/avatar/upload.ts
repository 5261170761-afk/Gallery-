import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Disable Vercel's default body parsing to allow streaming files directly to Vercel Blob
export const config = {
  api: {
    bodyParser: false,
  },
};

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

  const { filename } = request.query;
  if (!filename || typeof filename !== 'string') {
    return response.status(400).json({ error: 'Missing filename query parameter.' });
  }

  try {
    // Stream request directly to Vercel Blob using put()
    const blob = await put(filename, request, {
      access: 'public',
    });

    return response.status(200).json(blob);
  } catch (error) {
    return response.status(400).json({ error: (error as Error).message });
  }
}
