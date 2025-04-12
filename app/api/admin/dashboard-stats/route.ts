import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  // Check if user is authenticated and is an admin
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 403 }
    );
  }

  try {
    // Get current date and previous dates for trends
    const today = new Date();
    const startOfToday = startOfDay(today);
    const endOfToday = endOfDay(today);
    
    // Get last 7 days for charts
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      return {
        date,
        label: format(date, 'MMM dd'),
      };
    });

    // Calculate user statistics
    const [
      totalUsers,
      newUsersToday,
      totalPosts,
      newPostsToday,
      totalComments,
      totalLikes,
      reportedContent,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // New users today
      prisma.user.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      
      // Total posts
      prisma.post.count(),
      
      // New posts today
      prisma.post.count({
        where: {
          createdAt: {
            gte: startOfToday,
            lte: endOfToday,
          },
        },
      }),
      
      // Total comments
      prisma.comment.count(),
      
      // Total likes
      prisma.like.count(),
      
      // Total reported content
      prisma.report.count({
        where: {
          status: 'PENDING',
        },
      }),
    ]);

    // Get user growth data for chart
    const userGrowthPromises = last7Days.map(({ date }) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      return prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });
    });
    
    const userGrowthData = await Promise.all(userGrowthPromises);

    // Get engagement data for chart
    const engagementPromises = last7Days.map(({ date }) => {
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      return Promise.all([
        // Posts created on this day
        prisma.post.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        }),
        
        // Comments created on this day
        prisma.comment.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        }),
        
        // Likes created on this day
        prisma.like.count({
          where: {
            createdAt: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        }),
      ]);
    });
    
    const engagementResults = await Promise.all(engagementPromises);
    
    // Content distribution data
    const professionalPosts = await prisma.post.count({
      where: {
        type: 'professional',
      },
    });
    
    const socialPosts = await prisma.post.count({
      where: {
        type: 'social',
      },
    });
    
    const postsWithImages = await prisma.post.count({
      where: {
        NOT: {
          imageUrl: null,
        },
      },
    });
    
    const postsWithoutImages = totalPosts - postsWithImages;

    // Format the data for the frontend
    const dashboardStats = {
      totalUsers,
      newUsersToday,
      totalPosts,
      newPostsToday,
      totalComments,
      totalLikes,
      reportedContent,
      userGrowthData: {
        labels: last7Days.map(d => d.label),
        data: userGrowthData,
      },
      engagementData: {
        posts: engagementResults.map(r => r[0]),
        comments: engagementResults.map(r => r[1]),
        likes: engagementResults.map(r => r[2]),
        labels: last7Days.map(d => d.label),
      },
      contentDistribution: {
        labels: ['Professional', 'Social', 'With Images', 'Text Only'],
        data: [professionalPosts, socialPosts, postsWithImages, postsWithoutImages],
      },
    };

    return NextResponse.json(dashboardStats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}