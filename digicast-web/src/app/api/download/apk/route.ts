import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect(
    'https://raw.githubusercontent.com/Priydarshansingh/Digicast/main/download/digicast-app-latest.apk',
    307
  );
}
