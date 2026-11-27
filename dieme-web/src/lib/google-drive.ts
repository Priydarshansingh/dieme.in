import crypto from 'crypto';

interface GoogleDriveConfig {
  folderId?: string;
  clientEmail?: string;
  privateKey?: string;
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Reads Google Drive credentials from environment variables.
 * Supports individual variables or raw service account JSON.
 */
export function getGoogleDriveConfig(): GoogleDriveConfig {
  let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  // Support full JSON credential string if provided
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (serviceAccountJson && (!clientEmail || !privateKey)) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      clientEmail = clientEmail || parsed.client_email;
      privateKey = privateKey || parsed.private_key;
    } catch (e) {
      console.warn('[GoogleDrive] Failed to parse GOOGLE_SERVICE_ACCOUNT_KEY JSON:', e);
    }
  }

  // Handle escaped newlines in private key
  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  return { folderId, clientEmail, privateKey };
}

/**
 * Checks whether Google Drive integration is fully configured in backend.
 */
export function isGoogleDriveConfigured(): boolean {
  const config = getGoogleDriveConfig();
  return Boolean(config.folderId && config.clientEmail && config.privateKey);
}

/**
 * Obtains an OAuth 2.0 access token using a Google Service Account JWT.
 * Built with native Node.js crypto for zero-dependency execution.
 */
async function getServiceAccountAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) {
    return cachedAccessToken.token;
  }

  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const encodeBase64Url = (obj: object | Buffer) => {
    const buf = Buffer.isBuffer(obj) ? obj : Buffer.from(JSON.stringify(obj));
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const unsignedToken = `${encodeBase64Url(header)}.${encodeBase64Url(claimSet)}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(unsignedToken);
  const signature = signer.sign(privateKey);
  const jwt = `${unsignedToken}.${encodeBase64Url(signature)}`;

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`Google OAuth token exchange failed: HTTP ${tokenResponse.status} - ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token as string;
  cachedAccessToken = {
    token: accessToken,
    expiresAt: now + (tokenData.expires_in || 3600),
  };

  return accessToken;
}

/**
 * Uploads a file (text, JSON, or binary image) to Google Drive.
 */
export async function uploadFileToGoogleDrive(params: {
  fileName: string;
  mimeType: string;
  content: Buffer | string;
  folderId?: string;
  description?: string;
}): Promise<{ fileId: string; webViewLink?: string } | null> {
  const config = getGoogleDriveConfig();
  if (!config.clientEmail || !config.privateKey) {
    console.warn('[GoogleDrive] Service account credentials not configured, skipping Drive upload.');
    return null;
  }

  const targetFolderId = params.folderId || config.folderId;
  const accessToken = await getServiceAccountAccessToken(config.clientEmail, config.privateKey);

  const metadata: Record<string, unknown> = {
    name: params.fileName,
    mimeType: params.mimeType,
    description: params.description || 'Uploaded by Dieme AI Studio Backend',
  };

  if (targetFolderId) {
    metadata.parents = [targetFolderId];
  }

  const boundary = `-------DiemeDriveBoundary${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const contentBuffer = Buffer.isBuffer(params.content)
    ? params.content
    : Buffer.from(params.content, 'utf-8');

  const multipartBody = Buffer.concat([
    Buffer.from(
      `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
      `${delimiter}Content-Type: ${params.mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`
    ),
    Buffer.from(contentBuffer.toString('base64')),
    Buffer.from(closeDelimiter),
  ]);

  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
        'Content-Length': String(multipartBody.length),
      },
      body: multipartBody,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    console.error(`[GoogleDrive] File upload failed: HTTP ${uploadResponse.status} - ${errorText}`);
    return null;
  }

  const result = await uploadResponse.json();
  console.log(`[GoogleDrive] Successfully uploaded "${params.fileName}" (ID: ${result.id}) to Drive folder ${targetFolderId}`);
  return {
    fileId: result.id,
    webViewLink: result.webViewLink,
  };
}

/**
 * Persists a complete chat session record to the connected Google Drive folder.
 */
export async function saveChatSessionToDrive(params: {
  sessionId: string;
  userId?: string;
  prompt: string;
  response: string;
  model: string;
  metadata?: Record<string, unknown>;
}): Promise<{ fileId: string } | null> {
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.split('T')[0];
  const fileName = `Dieme_Chat_${dateStr}_${params.sessionId.slice(0, 8)}.json`;

  const payload = {
    sessionId: params.sessionId,
    userId: params.userId || 'anonymous',
    timestamp,
    prompt: params.prompt,
    response: params.response,
    model: params.model,
    metadata: params.metadata || {},
  };

  return uploadFileToGoogleDrive({
    fileName,
    mimeType: 'application/json',
    content: JSON.stringify(payload, null, 2),
    description: `Dieme Studio Chat Session [${params.sessionId}]`,
  });
}

/**
 * Saves a generated thumbnail image to the connected Google Drive folder.
 */
export async function saveThumbnailImageToDrive(params: {
  fileName?: string;
  imageBufferOrBase64: Buffer | string;
  prompt: string;
  sessionId?: string;
  userId?: string;
}): Promise<{ fileId: string; webViewLink?: string } | null> {
  let buffer: Buffer;
  if (typeof params.imageBufferOrBase64 === 'string') {
    const raw = params.imageBufferOrBase64.replace(/^data:image\/\w+;base64,/, '');
    buffer = Buffer.from(raw, 'base64');
  } else {
    buffer = params.imageBufferOrBase64;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = params.fileName || `Dieme_Thumb_${timestamp}.jpg`;

  return uploadFileToGoogleDrive({
    fileName,
    mimeType: 'image/jpeg',
    content: buffer,
    description: `Generated Thumbnail: "${params.prompt.slice(0, 100)}" [Session: ${params.sessionId || 'N/A'}]`,
  });
}
