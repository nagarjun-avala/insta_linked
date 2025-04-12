"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Home, 
  Search, 
  BellRing, 
  User, 
  Menu, 
  X, 
  LogOut, 
  Settings, 
  Moon, 
  Sun, 
  ShieldCheck 
} from 'lucide-react'

export default function NavBar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  
  // Prevent hydration mismatch
  useEffect(() => {
    setHasMounted(true)
  }, [])

  const isAdmin = session?.user?.role === "ADMIN"
  
  const navItems = [
    {
      name: "Home",
      href: "/feed",
      icon: <Home className="h-5 w-5" />
    },
    {
      name: "Search",
      href: "/search",
      icon: <Search className="h-5 w-5" />
    },
    {
      name: "Profile",
      href: session ? `/profile/${session.user.id}` : "/signin",
      icon: <User className="h-5 w-5" />
    }
  ]
  
  if (isAdmin) {
    navItems.push({
      name: "Admin",
      href: "/admin/dashboard",
      icon: <ShieldCheck className="h-5 w-5" />
    })
  }

  // Handle toggle of mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">ProfSocial</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href 
                    ? 'text-foreground' 
                    : 'text-muted-foreground'
                }`}
              >
                {item.icon}
                <span className="ml-2">{item.name}</span>
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-2">
            {session ? (
              <>
                <Button variant="ghost" size="icon" className="mr-2">
                  <BellRing className="h-5 w-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="relative h-9 w-9 rounded-full"
                    >
                      <Avatar className="h-9 w-9">
                        {session.user.image ? (
                          <img 
                            src={session.user.image} 
                            alt={session.user.name || "User"} 
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                            <span className="text-blue-700 dark:text-blue-300 font-bold">
                              {session.user.name?.substring(0, 2).toUpperCase() || "U"}
                            </span>
                          </div>
                        )}
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        {session.user.name && (
                          <p className="font-medium">{session.user.name}</p>
                        )}
                        {session.user.email && (
                          <p className="text-sm text-muted-foreground">
                            {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${session.user.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${session.user.id}?tab=settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                    >
                      {hasMounted && theme === "light" ? (
                        <Moon className="mr-2 h-4 w-4" />
                      ) : (
                        <Sun className="mr-2 h-4 w-4" />
                      )}
                      <span>Toggle Theme</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => signOut({ callbackUrl: "/" })}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link href="/signin">Sign In</Link>
              </Button>
            )}
            
            {/* Mobile menu button */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background md:hidden">
          <div className="container flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center" onClick={toggleMobileMenu}>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">ProfSocial</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={toggleMobileMenu}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <nav className="container grid gap-6 py-6">
            {navItems.map((item) => (
              <Link 
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 text-lg font-medium"
                onClick={toggleMobileMenu}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
            
            <DropdownMenuSeparator />
            
            <button
              className="flex items-center gap-3 text-lg font-medium"
              onClick={() => {
                setTheme(theme === "light" ? "dark" : "light")
                toggleMobileMenu()
              }}
            >
              {hasMounted && theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span>Toggle Theme</span>
            </button>
            
            {session && (
              <button
                className="flex items-center gap-3 text-lg font-medium text-red-600"
                onClick={() => {
                  signOut({ callbackUrl: "/" })
                  toggleMobileMenu()
                }}
              >
                <LogOut className="h-5 w-5" />
                <span>Log out</span>
              </button>
            )}
          </nav>
        </div>
      )}
    </>
  )
}
