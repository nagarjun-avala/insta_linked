"use client"

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/use-toast'
import { Post } from '@/types'
import { Loader2, Image, X } from 'lucide-react'

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onPostCreated: (post: Post) => void
}

export default function CreatePostModal({
  isOpen,
  onClose,
  onPostCreated
}: CreatePostModalProps) {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [postType, setPostType] = useState('social')

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Image must be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setImageFile(file)
    
    // Create preview URL
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a post.",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please add some content to your post.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // First, create the post
      const postData = {
        title: title.trim() || undefined,
        content,
        type: postType,
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })

      if (!response.ok) {
        throw new Error('Failed to create post')
      }

      const post = await response.json()

      // If there's an image, upload it
      if (imageFile) {
        const formData = new FormData()
        formData.append('image', imageFile)

        const imageResponse = await fetch(`/api/posts/${post.id}/image`, {
          method: 'POST',
          body: formData,
        })

        if (!imageResponse.ok) {
          throw new Error('Failed to upload image')
        }

        const updatedPost = await imageResponse.json()
        onPostCreated(updatedPost)
      } else {
        onPostCreated(post)
      }

      // Reset form
      setTitle('')
      setContent('')
      setImageFile(null)
      setImagePreview(null)
      setPostType('social')
      
      // Close modal
      onClose()
      
      toast({
        title: "Success",
        description: "Your post has been published.",
      })
    } catch (error) {
      console.error('Error creating post:', error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create Post</DialogTitle>
          <DialogDescription>
            Share your thoughts, experiences, or professional updates with your network.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="postType">Post Type</Label>
              <RadioGroup 
                id="postType" 
                value={postType} 
                onValueChange={setPostType}
                className="flex mt-2"
              >
                <div className="flex items-center space-x-2 mr-6">
                  <RadioGroupItem value="professional" id="professional" />
                  <Label htmlFor="professional" className="cursor-pointer">Professional</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="social" id="social" />
                  <Label htmlFor="social" className="cursor-pointer">Social</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div>
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title to your post"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What do you want to share?"
                className="mt-1 min-h-[150px]"
              />
            </div>
            
            {imagePreview ? (
              <div className="relative mt-4">
                <div className="rounded-md overflow-hidden border">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-h-[200px] w-full object-cover"
                  />
                </div>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-8 w-8 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="mt-4">
                <Label
                  htmlFor="image"
                  className="block w-full cursor-pointer rounded-md border border-dashed border-gray-300 dark:border-gray-600 py-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Image className="mx-auto h-12 w-12 text-gray-400" />
                  <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Add an image to your post
                  </span>
                  <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF up to 5MB
                  </span>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="sr-only"
                  />
                </Label>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Posting...
                </>
              ) : (
                "Post"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
