import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const urlParts = req.url.split("/");
  const id = urlParts[urlParts.length - 3];
  const targetId = urlParts[urlParts.length - 1];

  try {
    // Check if both users exist
    const [user, targetUser] = await Promise.all([
      prisma.user.findUnique({ where: { id } }),
      prisma.user.findUnique({ where: { id: targetId } }),
    ]);

    if (!user || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    console.error("Error checking follow status:", error);
    return NextResponse.json(
      { error: "Failed to check follow status" },
      { status: 500 }
    );
  }
}
