import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const app = (searchParams.get('app') || '').toLowerCase();

  // If user requests thumbnail or dg-images companion app
  if (app === 'thumbnail' || app === 'dg-images' || app === 'dgimages') {
    return NextResponse.redirect(
      'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dg-images-latest.apk',
      307
    );
  }

  // Default: Dieme Core / Live Studio Android App
  return NextResponse.redirect(
    'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-app-latest.apk',
    307
  );
}
