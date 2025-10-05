import { Card, CardContent } from "@/components/ui/card"
import { Shield, Clock, CreditCard, Headphones } from "lucide-react"

const features = [
  {
    icon: Shield,
    title: "Secure Booking",
    description: "Your data is protected with industry-leading security",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    description: "Our team is always here to help you with your travel needs",
  },
  {
    icon: CreditCard,
    title: "Easy Payments",
    description: "Multiple payment options for your convenience",
  },
  {
    icon: Headphones,
    title: "Customer Service",
    description: "Dedicated support team for all your queries",
  },
]

export function Features() {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="text-center">
              <CardContent className="pt-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground text-pretty">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
