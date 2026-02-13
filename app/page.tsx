import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { LandingNavbar } from "@/modules/landing/components/landing-navbar";
import { HeroSection } from "@/modules/landing/components/hero-section";
import { FeaturesSection } from "@/modules/landing/components/features-section";
import { HowItWorksSection } from "@/modules/landing/components/how-it-works-section";
import { RewardsSection } from "@/modules/landing/components/rewards-section";
import { MarketplaceSection } from "@/modules/landing/components/marketplace-section";
import { CTASection } from "@/modules/landing/components/cta-section";
import { Footer } from "@/modules/landing/components/footer";

export default async function Home() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    redirect("/projects");
  }
  return (
    <div className="min-h-screen">
      <LandingNavbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <RewardsSection />
      <MarketplaceSection />
      <CTASection />
      <Footer />
    </div>
  );
}
