import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    const secureUsername = process.env.ADMIN_USERNAME;
    const securePassword = process.env.ADMIN_PASSWORD;

    if (username === secureUsername && password === securePassword) {
      return NextResponse.json(
        { success: true, message: 'Autentikasi berhasil' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Username atau password salah' },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}