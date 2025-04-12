import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is an admin
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  const userId = params.id;

  try {
    // Don't allow admins to ban themselves
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot ban your own account' },
        { status: 400 }
      );
    }

    // Fetch the user first to check current status
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        isBanned: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Toggle the banned status
    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isBanned: !user.isBanned,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isBanned: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
          },
        },
      },
    });

    // Format user for response
    const formattedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      image: updatedUser.image,
      role: updatedUser.role,
      isBanned: updatedUser.isBanned,
      createdAt: updatedUser.createdAt,
      postCount: updatedUser._count.posts,
    };

    return NextResponse.json(formattedUser);
  } catch (error) {
    console.error('Error toggling user ban status:', error);
    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}