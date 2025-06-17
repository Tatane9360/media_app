import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongoose'
import Admin from '@/models/Admin'
import { signToken } from '@/lib/jwt'

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 })
    }

    const existingAdmin = await Admin.findOne({ email })
    if (existingAdmin) {
      return NextResponse.json({
        success: false,
        message: 'Admin already exists'
      }, { status: 400 })
    }

    const admin = await Admin.create({ email, password })
    const token = signToken({ id: admin._id, email: admin.email })

    const response = NextResponse.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email
      }
    }, { status: 201 })

    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 604800,
      sameSite: 'strict'
    })

    return response
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
