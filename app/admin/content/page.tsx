"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Header } from "@/components/landing/header"
import { Footer } from "@/components/landing/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BannerForm } from "@/components/admin/banner-form"
import { OfferForm } from "@/components/admin/offer-form"
import type { Banner, Offer } from "@/types"

export default function AdminContentPage() {
  const { user, role, loading: authLoading } = useAuth()
  const router = useRouter()
  const [banners, setBanners] = useState<Banner[]>([])
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (!authLoading && role !== "admin") {
      router.push("/dashboard")
    }
  }, [user, role, authLoading, router])

  const fetchContent = async () => {
    setLoading(true)
    try {
      const bannersSnapshot = await getDocs(collection(db, "banners"))
      const bannersData = bannersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Banner[]

      const offersSnapshot = await getDocs(collection(db, "offers"))
      const offersData = offersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        validUntil: doc.data().validUntil.toDate(),
        createdAt: doc.data().createdAt.toDate(),
      })) as Offer[]

      setBanners(bannersData)
      setOffers(offersData)
    } catch (error) {
      console.error("Error fetching content:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user && role === "admin") {
      fetchContent()
    }
  }, [user, role])

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-96" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!user || role !== "admin") return null

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-bold mb-8">Content Management</h1>

          <Tabs defaultValue="banners">
            <TabsList>
              <TabsTrigger value="banners">Banners</TabsTrigger>
              <TabsTrigger value="offers">Offers</TabsTrigger>
            </TabsList>

            <TabsContent value="banners" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Landing Page Banners</CardTitle>
                </CardHeader>
                <CardContent>
                  <BannerForm banners={banners} onBannerChange={fetchContent} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="offers" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Featured Offers</CardTitle>
                </CardHeader>
                <CardContent>
                  <OfferForm offers={offers} onOfferChange={fetchContent} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}
