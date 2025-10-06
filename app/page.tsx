import { Header } from "@/components/landing/header"
import { BannerSlider } from "@/components/landing/banner-slider"
import { FlightSearch } from "@/components/landing/flight-search"
import { FeaturedOffers } from "@/components/landing/featured-offers"
import { Features } from "@/components/landing/features"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative py-20 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-balance">Find Your Perfect Flight</h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty">
                Search, compare, and book flights from hundreds of airlines worldwide. Get the best deals on your next
                adventure.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <FlightSearch />
            </div>
          </div>
        </section>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <BannerSlider />
          </div>
        </section>
        <FeaturedOffers />
        <Features />
      </main>
      <Footer />
    </div>
  )
}
