import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const postId = params.id;
  const { reason } = await req.json();

  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    return NextResponse.json(
      { error: 'A valid reason is required for reporting content' },
      { status: 400 }
    );
  }

  try {
    // Check if the post exists
    const post = await prisma.post.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if user is trying to report their own post
    if (post.authorId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot report your own content' },
        { status: 400 }
      );
    }

    // Check if user has already reported this post
    const existingReport = await prisma.report.findUnique({
      where: {
        postId_reporterId: {
          postId,
          reporterId: session.user.id,
        },
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this content' },
        { status: 400 }
      );
    }

    // Create the report
    const report = await prisma.report.create({
      data: {
        reason,
        postId,
        reporterId: session.user.id,
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Content has been reported and will be reviewed',
      reportId: report.id,
    });
  } catch (error) {
    console.error('Error reporting post:', error);
    return NextResponse.json(
      { error: 'Failed to report content' },
      { status: 500 }
    );
  }
}