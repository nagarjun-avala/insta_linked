import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  try {
    // First check if the post exists
    const post = await prisma.post.findUnique({
      where: {
        id,
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check if user has already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    });

    // If already liked, remove the like (toggle behavior)
    if (existingLike) {
      await prisma.like.delete({
        where: {
          postId_userId: {
            postId: id,
            userId: session.user.id,
          },
        },
      });

      return NextResponse.json({ liked: false });
    }

    // Otherwise, create a new like
    await prisma.like.create({
      data: {
        postId: id,
        userId: session.user.id,
        userName: session.user.name || "Anonymous", // Ensure userName is provided
      },
    });

    return NextResponse.json({ liked: true });
  } catch (error) {
    console.error("Error toggling like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}

// Get like count and if user has liked the post
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  try {
    // Get like count
    const likeCount = await prisma.like.count({
      where: {
        postId: id,
      },
    });

    // Check if user has liked the post
    let isLiked = false;
    if (session?.user.id) {
      const like = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId: session.user.id,
          },
        },
      });
      isLiked = !!like;
    }

    return NextResponse.json({
      count: likeCount,
      isLiked,
    });
  } catch (error) {
    console.error("Error getting like info:", error);
    return NextResponse.json(
      { error: "Failed to get like information" },
      { status: 500 }
    );
  }
}
