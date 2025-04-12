import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'all';
  const limit = parseInt(searchParams.get('limit') || '20');
  const page = parseInt(searchParams.get('page') || '1');
  const skip = (page - 1) * limit;
  
  if (!query) {
    return NextResponse.json({ users: [], posts: [] });
  }

  try {
    let formattedUsers: any[] = [];
    let formattedPosts: any[] = [];
    
    // Filter conditions based on search type
    if (type === 'users' || type === 'all') {
      // Search for users
      const users = await prisma.user.findMany({
        where: {
          OR: [
            {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              headline: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              bio: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
          isBanned: false,
        },
        select: {
          id: true,
          name: true,
          image: true,
          headline: true,
          _count: {
            select: {
              followers: true,
              posts: true,
            },
          },
        },
        take: type === 'all' ? 5 : limit, // Show fewer results when searching all types
        skip: type === 'all' ? 0 : skip,
        orderBy: {
          name: 'asc',
        },
      });

      formattedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        image: user.image,
        headline: user.headline,
        followersCount: user._count.followers,
        postCount: user._count.posts,
      }));

      if (type === 'users') {
        // Get total count for pagination
        const totalUsers = await prisma.user.count({
          where: {
            OR: [
              {
                name: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                headline: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                bio: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
            isBanned: false,
          },
        });

        return NextResponse.json({
          users: formattedUsers,
          pagination: {
            total: totalUsers,
            pages: Math.ceil(totalUsers / limit),
            currentPage: page,
            limit,
          },
        });
      } else if (type === 'all' && type !== 'posts') {
        // If type is 'all', continue to fetch posts as well
      } else {
        return NextResponse.json({
          users: formattedUsers,
          posts: [],
        });
      }
    }

    if (type === 'posts' || type === 'all') {
      // Search for posts
      const posts = await prisma.post.findMany({
        where: {
          OR: [
            {
              title: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
          author: {
            isBanned: false,
          },
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
        take: type === 'all' ? 5 : limit,
        skip: type === 'all' ? 0 : skip,
        orderBy: {
          createdAt: 'desc',
        },
      });

      const session = await getServerSession(authOptions);
      
      // Check if current user has liked these posts
      formattedPosts = await Promise.all(
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

      if (type === 'posts') {
        // Get total count for pagination
        const totalPosts = await prisma.post.count({
          where: {
            OR: [
              {
                title: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
              {
                content: {
                  contains: query,
                  mode: 'insensitive',
                },
              },
            ],
            author: {
              isBanned: false,
            },
          },
        });

        return NextResponse.json({
          posts: formattedPosts,
          pagination: {
            total: totalPosts,
            pages: Math.ceil(totalPosts / limit),
            currentPage: page,
            limit,
          },
        });
      } else {
        // For 'all' type, return both users and posts
        return NextResponse.json({
          users: formattedUsers || [],
          posts: formattedPosts,
        });
      }
    }

    // Default empty response
    return NextResponse.json({ users: [], posts: [] });
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
      { status: 500 }
    );
  }
}