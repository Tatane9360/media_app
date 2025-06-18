import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const response = NextResponse.json({
      message: 'Déconnexion réussie'
    })

    // Clear the token cookie
    response.cookies.set('token', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
      sameSite: 'strict'
    })

    return response
  } catch (error) {
    console.error('Erreur de déconnexion:', error)
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    )
  }
}
