import { NextRequest, NextResponse } from 'next/server';

const DOWNLOAD_REDIRECTS: Record<string, string> = {
  'dieme-app-latest.apk':
    'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
  'dg-images-latest.apk':
    'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
  'dieme-suite-complete.zip':
    'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-suite-complete.zip',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;
  const targetUrl = DOWNLOAD_REDIRECTS[filename];

  if (targetUrl) {
    return NextResponse.redirect(targetUrl, 307);
  }

  return new NextResponse('File not found', { status: 404 });
}
