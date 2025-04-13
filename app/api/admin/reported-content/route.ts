import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is an admin
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Get reported posts with their report information
    const reportedPosts = await prisma.report.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        post: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Define the type for our formatted reported content
    type FormattedReport = {
      id: string;
      title: string;
      content: string;
      type: string;
      imageUrl: string | null;
      createdAt: Date;
      author: {
        id: string;
        name: string;
        image: string | null;
      };
      reportCount: number;
      reportReason: string;
      lastReportDate: Date;
      reportId: string;
    };

    // Format the data for the admin panel
    const formattedReportedContent = reportedPosts
      .map((report) => {
        if (!report.post) return null;

        return {
          id: report.post.id,
          title: report.post.title || "Untitled Post",
          content: report.post.content,
          type: report.post.type,
          imageUrl: report.post.imageUrl,
          createdAt: report.post.createdAt,
          author: report.post.author,
          reportCount: 1, // We'll aggregate this below
          reportReason: report.reason,
          lastReportDate: report.createdAt,
          reportId: report.id,
        };
      })
      .filter(Boolean) as FormattedReport[];

    // Aggregate reports for the same post
    const aggregatedReports = formattedReportedContent.reduce<
      FormattedReport[]
    >((acc, current) => {
      const existingReport = acc.find((report) => report.id === current.id);

      if (existingReport) {
        existingReport.reportCount += 1;

        // Update last report date if current report is more recent
        if (
          new Date(current.lastReportDate) >
          new Date(existingReport.lastReportDate)
        ) {
          existingReport.lastReportDate = current.lastReportDate;
          existingReport.reportReason = current.reportReason; // Show the most recent reason
          existingReport.reportId = current.reportId;
        }

        return acc;
      }

      return [...acc, current];
    }, []);

    return NextResponse.json(aggregatedReports);
  } catch (error) {
    console.error("Error fetching reported content:", error);
    return NextResponse.json(
      { error: "Failed to fetch reported content" },
      { status: 500 }
    );
  }
}
