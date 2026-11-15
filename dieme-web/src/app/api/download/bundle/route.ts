import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.redirect(
    'https://raw.githubusercontent.com/Priydarshansingh/dieme.in/main/download/dieme-suite-complete.zip',
    307
  );
}
