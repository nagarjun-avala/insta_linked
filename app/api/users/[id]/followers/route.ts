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

    // Get followers
    const followers = await prisma.follow.findMany({
      where: {
        followingId: id,
      },
      include: {
        follower: {
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

    // Count total followers
    const totalFollowers = await prisma.follow.count({
      where: {
        followingId: id,
      },
    });

    // Format response
    const formattedFollowers = followers.map((follow) => ({
      ...follow.follower,
      followedAt: follow.createdAt,
    }));

    return NextResponse.json({
      followers: formattedFollowers,
      pagination: {
        total: totalFollowers,
        pages: Math.ceil(totalFollowers / limit),
        currentPage: page,
        limit,
      },
    });
  } catch (error) {
    console.error("Error fetching followers:", error);
    return NextResponse.json(
      { error: "Failed to fetch followers" },
      { status: 500 }
    );
  }
}
