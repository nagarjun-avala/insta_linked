import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is an admin
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const reportId = params.id;
  // Default action to "approve" if not provided
  const body = await req.json().catch(() => ({}));
  const action = body.action || "approve";

  if (!action || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be "approve" or "reject"' },
      { status: 400 }
    );
  }

  try {
    // Get the report to find the associated post
    const report = await prisma.report.findUnique({
      where: {
        id: reportId,
      },
      include: {
        post: true,
      },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update the report status
    await prisma.report.update({
      where: {
        id: reportId,
      },
      data: {
        status: action === "approve" ? "APPROVED" : "REJECTED",
      },
    });

    // If approving the report, remove the post
    if (action === "approve" && report.post) {
      await prisma.post.delete({
        where: {
          id: report.post.id,
        },
      });

      // Update all other reports for this post to be approved as well
      await prisma.report.updateMany({
        where: {
          postId: report.post.id,
          status: "PENDING",
        },
        data: {
          status: "APPROVED",
        },
      });

      return NextResponse.json({
        success: true,
        message: "Report approved and content removed",
      });
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Report approved but post not found"
          : "Report rejected",
    });
  } catch (error) {
    console.error("Error processing report:", error);
    return NextResponse.json(
      { error: "Failed to process report" },
      { status: 500 }
    );
  }
}
