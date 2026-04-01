import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import StatsRow from "@/components/StatsRow";
import HowItWorks from "@/components/HowItWorks";
import FeaturesSplit from "@/components/FeaturesSplit";
import OutputPreview from "@/components/OutputPreview";
import Testimonials from "@/components/Testimonials";
import Pricing from "@/components/Pricing";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="pb-6">
      <Navbar />
      <Hero />
      <StatsRow />
      <HowItWorks />
      <FeaturesSplit />
      <OutputPreview />
      <Testimonials />
      <Pricing />
      <CtaSection />
      <Footer />
    </main>
  );
}
