import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const session = await getServerSession(authOptions)

  try {
    const post = await prisma.post.findUnique({
      where: {
        id,
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

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user has liked the post
    let isLiked = false
    if (session?.user.id) {
      const like = await prisma.like.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId: session.user.id,
          },
        },
      })
      isLiked = !!like
    }

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Error fetching post:', error)
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // First check if the post exists and if the user is the author
    const existingPost = await prisma.post.findUnique({
      where: {
        id,
      },
      select: {
        authorId: true,
      },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user is author or admin
    const isAuthor = existingPost.authorId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to update this post' },
        { status: 403 }
      )
    }

    const { title, content, type } = await req.json()

    if (type && !['professional', 'social'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid post type' },
        { status: 400 }
      )
    }

    const updatedPost = await prisma.post.update({
      where: {
        id,
      },
      data: {
        title,
        content,
        type,
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

    // Check if user has liked the post
    const like = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: id,
          userId: session.user.id,
        },
      },
    })

    return NextResponse.json({
      id: updatedPost.id,
      title: updatedPost.title,
      content: updatedPost.content,
      imageUrl: updatedPost.imageUrl,
      type: updatedPost.type,
      author: updatedPost.author,
      likes: updatedPost._count.likes,
      comments: updatedPost._count.comments,
      isLiked: !!like,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
    })
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // First check if the post exists and if the user is the author
    const existingPost = await prisma.post.findUnique({
      where: {
        id,
      },
      select: {
        authorId: true,
      },
    })

    if (!existingPost) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if user is author or admin
    const isAuthor = existingPost.authorId === session.user.id
    const isAdmin = session.user.role === 'ADMIN'

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Not authorized to delete this post' },
        { status: 403 }
      )
    }

    // Delete post and cascade to related entities
    await prisma.$transaction([
      // Delete all likes
      prisma.like.deleteMany({
        where: {
          postId: id,
        },
      }),
      // Delete all comments
      prisma.comment.deleteMany({
        where: {
          postId: id,
        },
      }),
      // Delete all reports
      prisma.report.deleteMany({
        where: {
          postId: id,
        },
      }),
      // Finally delete the post
      prisma.post.delete({
        where: {
          id,
        },
      }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
