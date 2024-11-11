'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { createClient } from '@supabase/supabase-js'



const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)


export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(false)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const router = useRouter()

  async function authenticate(username: string, password: string) {
    const {data, error} = await supabase.auth.signInWithPassword ({
      email: username,
      password: password
    })

    if (error) {
      console.log(error)
    }
    if (supabase.auth.getSession() !== null) {
      setAuthenticated(true)
    }

  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    authenticate(username, password)
    if (authenticated) {
      router.push('/dashboard')
    } else {
      setShowErrorModal(true)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="w-full p-4 bg-white shadow-sm">
        <h1 className="text-3xl font-bold text-center text-primary">BunniesBurger</h1>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg overflow-hidden flex">
          <div className="hidden md:block w-1/2 bg-cover bg-center">
            <Image
              src="/bb.png"
              alt="BunniesBurger"
              width={600}
              height={600}
              className="object-cover w-full h-full"
            />
          </div>
          <Card className="w-full md:w-1/2 border-0 shadow-none">
            <form onSubmit={handleLogin} className="p-8">
              <h2 className="text-2xl font-semibold mb-6 text-center">Welcome Back</h2>
              <CardContent className="space-y-4 p-0">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-center mt-6 p-0">
                <Button className="w-full" type="submit">Sign In</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>

      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Failed</DialogTitle>
            <DialogDescription>
              The username or password you entered is incorrect. Please try again.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowErrorModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}