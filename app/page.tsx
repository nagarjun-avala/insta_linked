import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default function Home() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/feed");
  }
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800" style={{ backgroundColor: 'hsl(var(--background))' }}>
      <div className="max-w-5xl mx-auto text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-blue-600 dark:text-blue-400 mb-6">
          ProfSocial
        </h1>
        <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8">
          Where professional networking meets social sharing
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <Link href="/signin">
            <Button size="lg" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button 
              variant="outline" 
              size="lg"
              className="w-full sm:w-auto"
            >
              Create Account
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">Professional Networking</h2>
            <p className="text-gray-600 dark:text-gray-400">Connect with professionals in your industry, share achievements and build your career network.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">Visual Storytelling</h2>
            <p className="text-gray-600 dark:text-gray-400">Share your visual content, personal interests and creative work alongside your professional identity.</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-3">Best of Both Worlds</h2>
            <p className="text-gray-600 dark:text-gray-400">Experience a unified platform that respects both your professional growth and personal expression.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
