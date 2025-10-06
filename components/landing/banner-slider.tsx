"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Skeleton } from "@/components/ui/skeleton"
import type { Banner } from "@/types"

export function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  console.log('banners', banners)

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const bannersQuery = query(
          collection(db, "banners"),
          where("active", "==", true)
        )
        const bannersSnapshot = await getDocs(bannersQuery)
        const bannersData = bannersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        })) as Banner[]
        
        // Sort banners by order in ascending order
        bannersData.sort((a, b) => a.order - b.order)
        
        setBanners(bannersData)
      } catch (error) {
        console.error("Error fetching banners:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchBanners()
  }, [])

  useEffect(() => {
    if (banners.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length)
      }, 5000)
      return () => clearInterval(timer)
    }
  }, [banners.length])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % banners.length)
  }

  if (loading) {
    return <Skeleton className="w-full h-[400px] rounded-lg" />
  }

  if (banners.length === 0) {
    return (
      <div className="relative w-full h-[400px] overflow-hidden rounded-lg bg-muted flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">No banners available</h3>
          <p className="text-muted-foreground">Check back later for exciting offers!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-[400px] overflow-hidden rounded-lg">
      {banners.map((banner, index) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-500 ${
            index === currentIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <img src={banner.imageUrl || "/placeholder.svg"} alt={banner.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-xl text-white">
                <h2 className="text-4xl font-bold mb-4 text-balance">{banner.title}</h2>
                <p className="text-lg mb-6 text-pretty">{banner.description}</p>
                {banner.link && (
                  <Button size="lg" variant="secondary" asChild>
                    <a href={banner.link} target="_blank" rel="noopener noreferrer">
                      Learn More
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white"
            onClick={goToNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${index === currentIndex ? "bg-white w-8" : "bg-white/50"}`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
