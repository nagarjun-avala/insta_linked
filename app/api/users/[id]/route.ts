import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

interface Id {
  id: string;
}

export async function GET(req: NextRequest, { params }: { params: Id }) {
  const session = await getServerSession(authOptions);

  try {
    const { id } = await params;
    // console.log("Fetching user with ID:", id, params);
    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    const user = await prisma.user.findUnique({
      where: {
        id,
      },
      include: {
        settings: true,
        experiences: {
          orderBy: {
            startDate: "desc",
          },
        },
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the current user is following this user
    let isFollowing = false;
    if (session?.user.id) {
      const followRecord = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: session.user.id,
            followingId: id as string,
          },
        },
      });
      isFollowing = !!followRecord;
    }

    // Get connections (mutual follows)
    const connections = await prisma.user.findMany({
      where: {
        AND: [
          {
            following: {
              some: {
                followingId: id,
              },
            },
          },
          {
            followers: {
              some: {
                followerId: id,
              },
            },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        image: true,
        headline: true,
      },
      take: 6, // Limit to 6 connections for the profile page
    });

    // Remove sensitive information
    const { password, ...userWithoutPassword } = user;

    // Format response data
    const responseData = {
      ...userWithoutPassword,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postCount: user._count.posts,
      isFollowing,
      connections,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Id }) {
  const session = await getServerSession(authOptions);
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  }
  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Only allow users to edit their own profile or admins to edit any profile
  if (session.user.id !== id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.text();
    const { name, bio, location, headline } = JSON.parse(body);

    // Basic validation
    if (name && name.trim().length === 0) {
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: {
        id,
      },
      data: {
        name: name || undefined,
        bio: bio || null,
        location: location || null,
        headline: headline || null,
      },
    });

    // Remove sensitive information
    const { password, ...userWithoutPassword } = updatedUser;

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
