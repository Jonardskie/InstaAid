    // components/AuthGuard.tsx
    "use client"

    import { useEffect } from 'react'
    import { useRouter } from 'next/navigation'
    import { useAuth } from '@/hooks/use-auth' // Import your existing hook
    import { Loader2 } from 'lucide-react'

    export function AuthGuard({ children }: { children: React.ReactNode }) {
    // 1. Get the current authentication state
    const { user, loading } = useAuth()
    const router = useRouter()
    
    useEffect(() => {
        // 2. Check the state after Firebase has finished loading
        if (!loading && !user) {
        // 3. If no user is logged in, redirect them immediately.
        // We use router.replace to prevent the user from using the browser's back button 
        // to return to the protected page.
        router.replace('/auth/signin') 
        }
    }, [user, loading, router])

    // 4. While checking the status, display a loader. 
    // If we didn't do this, the dashboard UI would flash briefly before redirecting.
    if (loading || !user) {
        return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <Loader2 className="animate-spin w-8 h-8 text-blue-600" />
            <span className="ml-2 text-gray-700">Checking authentication...</span>
        </div>
        )
    }

    // 5. If the user is authenticated, render the children (the dashboard page)
    return <>{children}</>
    }