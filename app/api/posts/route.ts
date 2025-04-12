import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const limit = parseInt(searchParams.get('limit') || '10')
  const cursor = searchParams.get('cursor') || undefined
  const session = await getServerSession(authOptions)

  try {
    const posts = await prisma.post.findMany({
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: {
          id: cursor,
        },
      }),
      orderBy: {
        createdAt: 'desc',
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
    })

    // Get next cursor for pagination
    const nextCursor = posts.length === limit ? posts[posts.length - 1].id : null

    // Check which posts the current user has liked
    const transformedPosts = await Promise.all(
      posts.map(async (post) => {
        let isLiked = false
        
        if (session?.user.id) {
          const like = await prisma.like.findUnique({
            where: {
              postId_userId: {
                postId: post.id,
                userId: session.user.id,
              },
            },
          })
          isLiked = !!like
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
        }
      })
    )

    return NextResponse.json({ posts: transformedPosts, nextCursor })
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const { title, content, type } = await req.json()

    if (!content || !type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate post type
    if (!['professional', 'social'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid post type' },
        { status: 400 }
      )
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        type,
        authorId: session.user.id,
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
    })

    return NextResponse.json({
      id: post.id,
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
      type: post.type,
      author: post.author,
      likes: post._count.likes,
      comments: post._count.comments,
      isLiked: false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}
