"use client";

import { useEffect } from "react";
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
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" },
    );

    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <>
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
    </>
  );
}
