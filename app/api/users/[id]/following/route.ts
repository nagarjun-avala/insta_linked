import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") || "20");
  const page = parseInt(searchParams.get("page") || "1");
  const skip = (page - 1) * limit;

  try {
    // Check if the user exists
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get following users
    const following = await prisma.follow.findMany({
      where: {
        followerId: id,
      },
      include: {
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            headline: true,
          },
        },
      },
      take: limit,
      skip: skip,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Count total following
    const totalFollowing = await prisma.follow.count({
      where: {
        followerId: id,
      },
    });

    // Format response
    const formattedFollowing = following.map((follow) => ({
      ...follow.following,
      followedAt: follow.createdAt,
    }));

    return NextResponse.json({
      following: formattedFollowing,
      pagination: {
        total: totalFollowing,
        pages: Math.ceil(totalFollowing / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching following:", error);
    return NextResponse.json(
      { error: "Failed to fetch following" },
      { status: 500 }
    );
  }
}
