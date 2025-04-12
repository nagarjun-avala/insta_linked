import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const id = req.url.split("/").slice(-2, -1)[0];
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "10");
  const cursor = searchParams.get("cursor") || undefined;
  const type = searchParams.get("type") || undefined;
  const session = await getServerSession(authOptions);

  try {
    // First, check if the user exists
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        isBanned: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.isBanned && (!session || session.user.role !== "ADMIN")) {
      return NextResponse.json(
        { error: "This user has been banned" },
        { status: 403 }
      );
    }

    // Build the query
    const postsQuery = {
      where: {
        authorId: id,
        ...(type && { type }),
      },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
      orderBy: {
        createdAt: "desc" as const,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    };

    const posts = await prisma.post.findMany(postsQuery);

    // Get next cursor for pagination
    const nextCursor =
      posts.length === limit ? posts[posts.length - 1].id : null;

    // Check which posts the current user has liked
    const transformedPosts = await Promise.all(
      posts.map(async (post) => {
        let isLiked = false;

        if (session?.user.id) {
          const like = await prisma.like.findUnique({
            where: {
              postId_userId: {
                postId: post.id,
                userId: session.user.id,
              },
            },
          });
          isLiked = !!like;
        }

        return {
          id: post.id,
          title: post.title,
          content: post.content,
          imageUrl: post.imageUrl,
          type: post.type,
          author: post.author,
          likes: post._count.likes,
          comments: post._count.comments,
          isLiked,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      })
    );

    return NextResponse.json(transformedPosts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch user posts" },
      { status: 500 }
    );
  }
}
