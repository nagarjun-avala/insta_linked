import { User as PrismaUser } from '@prisma/client'

export interface User {
  id: string
  name: string
  email: string
  image?: string | null
  bio?: string | null
  headline?: string | null
  location?: string | null
  role: string
  createdAt: string | Date
  followersCount?: number
  followingCount?: number
  postCount?: number
  isFollowing?: boolean
  isBanned?: boolean
  connections?: Array<{
    id: string
    name: string
    image?: string
    headline?: string
  }>
  experience?: Array<{
    title: string
    company: string
    startDate: string
    endDate?: string
    description?: string
  }>
  settings?: {
    publicProfile: boolean
    showEmail: boolean
    emailNotifications: boolean
    newPostNotifications: boolean
  }
}

export interface Post {
  id: string
  title?: string
  content: string
  imageUrl?: string | null
  type: 'professional' | 'social'
  author: {
    id: string
    name: string
    image?: string | null
  }
  likes: number
  comments: number
  isLiked?: boolean
  createdAt: string | Date
  updatedAt: string | Date
}

export interface Comment {
  id: string
  content: string
  author: {
    id: string
    name: string
    image?: string | null
  }
  postId: string
  createdAt: string | Date
  updatedAt: string | Date
}

// Extend the next-auth types
declare module "next-auth" {
  interface User extends PrismaUser {}
  
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
  }
}
