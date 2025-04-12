"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from '@/components/ui/use-toast'
import { User } from '@/types'
import { 
  Settings, 
  MapPin, 
  Briefcase, 
  Calendar, 
  Edit, 
  Upload,
  Camera
} from 'lucide-react'

interface ProfileHeaderProps {
  user: User
  isCurrentUser: boolean
  isFollowing: boolean
  onFollow: () => Promise<void>
  onUnfollow: () => Promise<void>
}

export default function ProfileHeader({
  user,
  isCurrentUser,
  isFollowing,
  onFollow,
  onUnfollow,
}: ProfileHeaderProps) {
  const { data: session } = useSession()
  const [isEditing, setIsEditing] = useState(false)
  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: user.name,
    bio: user.bio || '',
    location: user.location || '',
    headline: user.headline || '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to update profile')
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      })
      
      setIsEditing(false)
      
      // Refresh the page to show updated data
      window.location.reload()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFollowAction = async () => {
    setIsLoading(true)
    try {
      if (isFollowing) {
        await onUnfollow()
      } else {
        await onFollow()
      }
    } catch (error) {
      console.error('Error following/unfollowing:', error)
      toast({
        title: "Error",
        description: `Failed to ${isFollowing ? 'unfollow' : 'follow'} user. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      {/* Cover Photo */}
      <div className="h-48 md:h-64 bg-gradient-to-r from-blue-400 to-purple-500 relative">
        {isCurrentUser && (
          <Button 
            variant="outline" 
            size="sm" 
            className="absolute right-4 top-4 bg-white/80 dark:bg-gray-800/80"
          >
            <Upload className="h-4 w-4 mr-2" />
            Change Cover
          </Button>
        )}
      </div>
      
      {/* Profile Info */}
      <div className="px-6 py-5 md:px-8 md:pb-8">
        <div className="flex flex-col md:flex-row items-start">
          {/* Avatar */}
          <div className="relative -mt-20 mb-4 md:mb-0 md:mr-6">
            <Avatar className="h-32 w-32 border-4 border-white dark:border-gray-800 rounded-full">
              {user.image ? (
                <img 
                  src={user.image} 
                  alt={user.name} 
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="h-full w-full rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-700 dark:text-blue-300 text-4xl font-bold">
                    {user.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </Avatar>
            
            {isCurrentUser && (
              <Button 
                size="icon" 
                className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                onClick={() => setIsAvatarDialogOpen(true)}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{user.name}</h1>
                {user.headline && (
                  <p className="text-gray-600 dark:text-gray-300 mt-1">{user.headline}</p>
                )}
              </div>
              
              <div className="mt-4 md:mt-0 flex space-x-3">
                {isCurrentUser ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <Button
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollowAction}
                    disabled={isLoading}
                  >
                    {isLoading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}
                
                {isCurrentUser && (
                  <Button variant="outline" asChild>
                    <Link href={`/profile/${user.id}?tab=settings`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {user.location && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{user.location}</span>
                </div>
              )}
              
              {user.headline && (
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Briefcase className="h-4 w-4 mr-1" />
                  <span>{user.headline}</span>
                </div>
              )}
              
              <div className="flex items-center text-gray-600 dark:text-gray-400">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            
            {user.bio && (
              <div className="mt-4 text-gray-700 dark:text-gray-300">
                <p>{user.bio}</p>
              </div>
            )}
            
            <div className="mt-4 flex items-center space-x-4">
              <div>
                <span className="font-bold">{user.followersCount || 0}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold">{user.followingCount || 0}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">Following</span>
              </div>
              <div>
                <span className="font-bold">{user.postCount || 0}</span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">Posts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                name="name"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="headline" className="text-sm font-medium">
                Headline
              </label>
              <input
                id="headline"
                name="headline"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.headline}
                onChange={handleInputChange}
                placeholder="Software Engineer at Company"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="location" className="text-sm font-medium">
                Location
              </label>
              <input
                id="location"
                name="location"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="New York, NY"
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="bio" className="text-sm font-medium">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell us about yourself"
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditing(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Avatar Upload Dialog */}
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a new profile picture
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="avatar" className="text-sm font-medium">
                Choose an image
              </label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    setImageFile(file)
                    // Create a preview
                    const reader = new FileReader()
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
              
              {imagePreview && (
                <div className="mt-4 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Preview</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsAvatarDialogOpen(false)
                setImageFile(null)
                setImagePreview(null)
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!imageFile) {
                  toast({
                    title: "No image selected",
                    description: "Please select an image to upload.",
                    variant: "destructive",
                  })
                  return
                }
                
                setIsLoading(true)
                try {
                  const formData = new FormData()
                  formData.append('file', imageFile)
                  
                  const response = await fetch(`/api/users/${user.id}/image`, {
                    method: 'POST',
                    body: formData,
                  })
                  
                  if (!response.ok) {
                    throw new Error('Failed to upload image')
                  }
                  
                  const data = await response.json()
                  
                  toast({
                    title: "Profile picture updated",
                    description: "Your profile picture has been updated successfully.",
                  })
                  
                  setIsAvatarDialogOpen(false)
                  setImageFile(null)
                  setImagePreview(null)
                  
                  // Refresh the page to show new image
                  window.location.reload()
                } catch (error) {
                  console.error('Error uploading profile picture:', error)
                  toast({
                    title: "Error",
                    description: "Failed to upload profile picture. Please try again.",
                    variant: "destructive",
                  })
                } finally {
                  setIsLoading(false)
                }
              }}
              disabled={isLoading || !imageFile}
            >
              {isLoading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
