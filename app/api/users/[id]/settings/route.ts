import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Only allow users to see their own settings or admins to see any settings
  if (session.user.id !== id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Find user settings or create default settings if they don't exist
    let settings = await prisma.userSettings.findUnique({
      where: {
        userId: id,
      },
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: {
          userId: id,
          publicProfile: true,
          showEmail: false,
          emailNotifications: true,
          newPostNotifications: true,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  const { id } = params;

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  // Only allow users to update their own settings or admins to update any settings
  if (session.user.id !== id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const {
      publicProfile,
      showEmail,
      emailNotifications,
      newPostNotifications,
    } = await req.json();

    // Update settings
    const updatedSettings = await prisma.userSettings.upsert({
      where: {
        userId: id,
      },
      update: {
        publicProfile: publicProfile !== undefined ? publicProfile : undefined,
        showEmail: showEmail !== undefined ? showEmail : undefined,
        emailNotifications:
          emailNotifications !== undefined ? emailNotifications : undefined,
        newPostNotifications:
          newPostNotifications !== undefined ? newPostNotifications : undefined,
      },
      create: {
        userId: id,
        publicProfile: publicProfile !== undefined ? publicProfile : true,
        showEmail: showEmail !== undefined ? showEmail : false,
        emailNotifications:
          emailNotifications !== undefined ? emailNotifications : true,
        newPostNotifications:
          newPostNotifications !== undefined ? newPostNotifications : true,
      },
    });

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error("Error updating user settings:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
