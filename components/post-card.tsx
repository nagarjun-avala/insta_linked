"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { toast } from '@/components/ui/use-toast'
import CommentSection from '@/components/comment-section'
import { Post } from '@/types'
import { Heart, MessageCircle, Share2, MoreVertical, Flag, Trash2, BriefcaseBusiness, Image as ImageIcon } from 'lucide-react'

interface PostCardProps {
  post: Post
  onDelete?: (postId: string) => void
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { data: session } = useSession()
  const [showComments, setShowComments] = useState(false)
  const [liked, setLiked] = useState(post.isLiked || false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [commentCount, setCommentCount] = useState(post.comments)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const isAuthor = session?.user?.id === post.author.id
  const isAdmin = session?.user?.role === "ADMIN"

  const handleLike = async () => {
    if (!session) return

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to like/unlike post')
      }

      if (liked) {
        setLikeCount(prev => prev - 1)
      } else {
        setLikeCount(prev => prev + 1)
      }
      setLiked(!liked)
    } catch (error) {
      console.error('Error toggling like:', error)
      toast({
        title: "Error",
        description: "Failed to like the post. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async () => {
    if (!session || (!isAuthor && !isAdmin)) return
    
    setIsDeleting(true)
    try {
      const endpoint = isAdmin 
        ? `/api/admin/content/${post.id}`
        : `/api/posts/${post.id}`
        
      const response = await fetch(endpoint, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete post')
      }

      toast({
        title: "Success",
        description: "Post deleted successfully",
      })
      
      setIsDeleteDialogOpen(false)
      
      if (onDelete) {
        onDelete(post.id)
      }
    } catch (error) {
      console.error('Error deleting post:', error)
      toast({
        title: "Error",
        description: "Failed to delete the post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReport = async () => {
    if (!session || !reportReason) return

    try {
      const response = await fetch(`/api/posts/${post.id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: reportReason })
      })

      if (!response.ok) {
        throw new Error('Failed to report post')
      }

      toast({
        title: "Report Submitted",
        description: "Thank you for reporting this content. Our team will review it.",
      })
      
      setIsReportDialogOpen(false)
      setReportReason("")
    } catch (error) {
      console.error('Error reporting post:', error)
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onCommentAdded = () => {
    setCommentCount(prev => prev + 1)
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-2 flex flex-row items-center space-y-0 gap-3">
        <Link href={`/profile/${post.author.id}`}>
          <Avatar className="h-10 w-10">
            {post.author.image ? (
              <img 
                src={post.author.image} 
                alt={post.author.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-blue-700 dark:text-blue-300 font-bold">
                  {post.author.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
          </Avatar>
        </Link>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <Link 
                href={`/profile/${post.author.id}`}
                className="font-medium hover:underline"
              >
                {post.author.name}
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(post.createdAt).toLocaleString()}
                {post.type && (
                  <span className="inline-flex items-center ml-2">
                    {post.type === 'professional' ? (
                      <BriefcaseBusiness className="h-3 w-3 mr-1" />
                    ) : (
                      <ImageIcon className="h-3 w-3 mr-1" />
                    )}
                    <span className="capitalize">{post.type}</span>
                  </span>
                )}
              </p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(isAuthor || isAdmin) && (
                  <>
                    <DropdownMenuItem 
                      onClick={() => setIsDeleteDialogOpen(true)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                {!isAuthor && (
                  <DropdownMenuItem onClick={() => setIsReportDialogOpen(true)}>
                    <Flag className="h-4 w-4 mr-2" />
                    Report
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {post.title && (
          <h3 className="text-lg font-bold mb-2">{post.title}</h3>
        )}
        <p className="whitespace-pre-line">{post.content}</p>
        
        {post.imageUrl && (
          <div className="mt-3 overflow-hidden rounded-md border">
            <img 
              src={post.imageUrl} 
              alt={post.title || "Post image"} 
              className="w-full h-auto object-cover max-h-96"
            />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleLike}
            className={liked ? 'text-red-500' : ''}
          >
            <Heart className={`h-5 w-5 mr-1 ${liked ? 'fill-current' : ''}`} />
            {likeCount}
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="h-5 w-5 mr-1" />
            {commentCount}
          </Button>
          
          <Button variant="ghost" size="sm">
            <Share2 className="h-5 w-5 mr-1" />
            Share
          </Button>
        </div>
      </CardFooter>
      
      {showComments && (
        <div className="border-t px-4 py-3">
          <CommentSection 
            postId={post.id}
            onCommentAdded={onCommentAdded}
          />
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Report Dialog */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
            <DialogDescription>
              Please tell us why you're reporting this post
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="reason" className="text-sm font-medium">Reason</label>
              <textarea
                id="reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Why are you reporting this post?"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsReportDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleReport}
              disabled={!reportReason.trim()}
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
