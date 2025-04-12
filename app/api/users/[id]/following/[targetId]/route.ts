import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; targetId: string } }
) {
  const { id, targetId } = params;
  
  try {
    // Check if both users exist
    const [user, targetUser] = await Promise.all([
      prisma.user.findUnique({ where: { id } }),
      prisma.user.findUnique({ where: { id: targetId } })
    ]);

    if (!user || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if the follow relationship exists
    const followRelationship = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: id,
          followingId: targetId,
        },
      },
    });

    return NextResponse.json({
      isFollowing: !!followRelationship,
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}