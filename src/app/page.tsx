"use client";

import Link from "next/link";
import { products, categories } from "@/data/products";
import { ArrowRight, Shield, Truck, HeadphonesIcon, RotateCcw, Star } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { useState, useEffect } from "react";
import RecentlyViewed from "@/components/RecentlyViewed";
import NewsletterForm from "@/components/NewsletterForm";

function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const base = firstLoad ? 5.2 : 0.1;
  useEffect(() => {
    setFirstLoad(!sessionStorage.getItem("bt-loaded"));
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=1920&h=1080&fit=crop" alt="" className="w-full h-full object-cover scale-105 transition-transform duration-[2s]" style={{ transform: loaded ? "scale(1)" : "scale(1.05)" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/80 to-dark-950/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-transparent to-dark-950/30" />
      </div>
      <div className="max-w-7xl mx-auto px-6 py-32 relative z-10 w-full">
        <div className="max-w-2xl">
          <div className="hero-line-reveal" style={{ animationDelay: `${base}s` }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-px bg-gold-500" />
              <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Premium Electronics</span>
            </div>
          </div>
          <div className="hero-line-reveal" style={{ animationDelay: `${base + 0.3}s` }}>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold text-white leading-[0.95] mb-6">
              The Art of<br />
              <span className="text-gradient italic">Technology</span>
            </h1>
          </div>
          <div className="hero-line-reveal" style={{ animationDelay: `${base + 0.6}s` }}>
            <p className="text-dark-300 text-lg md:text-xl leading-relaxed mb-10 max-w-lg font-light">
              Discover our meticulously curated collection of the world&apos;s finest electronics. Crafted for those who accept nothing less than extraordinary.
            </p>
          </div>
          <div className="hero-line-reveal" style={{ animationDelay: `${base + 0.9}s` }}>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="magnetic-btn group bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-8 py-4 rounded-xl font-semibold transition-all duration-300 inline-flex items-center gap-3 hover:shadow-lg hover:shadow-gold-500/20">
                Explore Collection
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/about" className="magnetic-btn border border-dark-600 text-white px-8 py-4 rounded-xl font-medium hover:border-gold-500/50 hover:text-gold-400 transition-all duration-300">
                Our Story
              </Link>
            </div>
          </div>
          <div className="hero-line-reveal" style={{ animationDelay: `${base + 1.2}s` }}>
            <div className="flex gap-6 sm:gap-12 mt-16">
              {[
                { value: "12K+", label: "Products" },
                { value: "50K+", label: "Clients" },
                { value: "4.9", label: "Rating" },
              ].map((stat, i) => (
                <div key={stat.label} className="counter-animate" style={{ animationDelay: `${base + 1.6 + i * 0.15}s` }}>
                  <div className="text-2xl md:text-3xl font-display font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-dark-500 uppercase tracking-wider mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
        <div className="hero-line-reveal" style={{ animationDelay: `${base + 1.8}s` }}>
          <div className="w-6 h-10 border-2 border-dark-600 rounded-full flex items-start justify-center p-1.5 animate-bounce">
            <div className="w-1.5 h-3 bg-gold-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const items = [
    { icon: Truck, label: "Free Express Shipping" },
    { icon: Shield, label: "Lifetime Warranty" },
    { icon: HeadphonesIcon, label: "Concierge Support" },
    { icon: RotateCcw, label: "30-Day Returns" },
  ];
  return (
    <section className="border-y border-dark-800/50 bg-dark-950">
      <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 gap-6">
        {items.map((item, i) => (
          <Reveal key={item.label} direction="up" delay={i * 100} duration={600}>
            <div className="flex items-center gap-3 justify-center">
              <item.icon size={18} className="text-gold-500 shrink-0" />
              <span className="text-xs text-dark-300 uppercase tracking-wider font-medium">{item.label}</span>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function CategoriesSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <Reveal>
        <div className="text-center mb-16">
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Browse</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-3">Collections</h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-gold-500 to-gold-700 mx-auto mt-4" />
        </div>
      </Reveal>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
        {categories.map((cat, i) => (
          <Reveal key={cat.slug} direction="scale" delay={i * 80} duration={600}>
            <Link href={`/products?category=${cat.slug}`} className="group block">
              <div className="relative aspect-square bg-dark-900 rounded-2xl overflow-hidden border border-dark-800/50 group-hover:border-gold-500/30 transition-all duration-500">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/80 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-display text-sm font-semibold text-white">{cat.name}</h3>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function FeaturedSection() {
  const featured = [
    { name: "iPhones", slug: "smartphones", brand: "Apple", image: "/images/iphone-13-14-main.jpg" },
    { name: "Samsung", slug: "smartphones", brand: "Samsung", image: "/images/samsung-s22.jpg" },
    { name: "OnePlus", slug: "smartphones", brand: "OnePlus", image: "/images/oneplus-12.jpg" },
    { name: "AirPods & Audio", slug: "headphones", brand: "", image: "/images/airpods.jpg" },
    { name: "Smart Watches", slug: "wearables", brand: "", image: "/images/apple-watch.jpg" },
    { name: "Tempered Glass", slug: "accessories", brand: "", image: "/images/tempered-glass.webp" },
    { name: "Power Banks", slug: "accessories", brand: "", image: "/images/powerbank-mi.jpg" },
    { name: "Data Cables", slug: "accessories", brand: "", image: "/images/data-cable.webp" },
  ];
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <Reveal>
        <div className="flex items-end justify-between mb-16">
          <div>
            <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Handpicked</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-3">Featured</h2>
          </div>
          <Link href="/products" className="hidden md:flex items-center gap-2 text-dark-400 hover:text-gold-400 transition-colors text-sm font-medium uppercase tracking-wider group">
            View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {featured.map((item, i) => (
          <Reveal key={item.name} direction="up" delay={i * 80} duration={600}>
            <Link
              href={item.brand
                ? `/products?category=${item.slug}&brand=${item.brand}`
                : `/products?category=${item.slug}`}
              className="group block"
            >
              <div className="relative aspect-square bg-dark-900 rounded-2xl overflow-hidden border border-dark-800/50 group-hover:border-gold-500/30 transition-all duration-500">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-dark-950/90 via-dark-950/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-display text-sm md:text-base font-semibold text-white group-hover:text-gold-400 transition-colors">{item.name}</h3>
                  <div className="w-8 h-0.5 bg-gold-500 mt-2 group-hover:w-12 transition-all duration-500" />
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function BrandStatement() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <Reveal direction="scale">
        <div className="relative bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 rounded-3xl overflow-hidden border border-dark-700/50">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl" />
          <div className="relative z-10 p-10 md:p-16 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <Reveal direction="left" delay={200}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-px bg-gold-500" />
                  <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">The iPhone Collection</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 leading-tight">
                  The Complete<br />
                  <span className="text-gradient italic">iPhone Lineup</span>
                </h2>
                <p className="text-dark-400 max-w-md leading-relaxed">
                  From the original iPhone X to the latest iPhone 17 Pro Max — explore every generation of Apple&apos;s finest craftsmanship, all in one place.
                </p>
              </Reveal>
            </div>
            <Reveal direction="right" delay={400}>
              <Link href="/products?category=smartphones&brand=Apple" className="magnetic-btn bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-8 py-4 rounded-xl font-semibold transition-all duration-300 shrink-0 hover:shadow-lg hover:shadow-gold-500/20">
                Explore iPhones
              </Link>
            </Reveal>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function AllProductsSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <Reveal>
        <div className="flex items-end justify-between mb-16">
          <div>
            <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Explore</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-3">All Products</h2>
          </div>
          <Link href="/products" className="hidden md:flex items-center gap-2 text-dark-400 hover:text-gold-400 transition-colors text-sm font-medium uppercase tracking-wider group">
            View All <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </Reveal>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.slice(0, 8).map((p, i) => (
          <Reveal key={p.id} direction="up" delay={i * 80} duration={700}>
            <ProductCard product={p} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  const testimonials = [
    { name: "Alexander M.", title: "CEO, TechForward", text: "The attention to detail in both product selection and customer experience is unmatched. Batra Technologies has earned a customer for life.", rating: 5 },
    { name: "Sophia R.", title: "Creative Director", text: "Every purchase feels like an experience, not just a transaction. The quality and curation here is what luxury should be.", rating: 5 },
    { name: "James K.", title: "Professional Photographer", text: "Outstanding quality and service. The camera equipment I received was pristine and the support team went above and beyond.", rating: 5 },
  ];
  return (
    <section className="border-y border-dark-800/50 bg-dark-900/50">
      <div className="max-w-7xl mx-auto px-6 py-24">
        <Reveal>
          <div className="text-center mb-16">
            <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Testimonials</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-3">Trusted by the Best</h2>
          </div>
        </Reveal>
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} direction="up" delay={i * 150}>
              <div className="card-hover bg-dark-900/80 border border-dark-800/50 rounded-2xl p-8 hover:border-gold-500/20 transition-all duration-500">
                <div className="flex gap-1 mb-6">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} size={16} className="fill-gold-400 text-gold-400" />
                  ))}
                </div>
                <p className="text-dark-300 leading-relaxed mb-8 italic font-light">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-display font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-dark-500 mt-0.5">{t.title}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function NewsletterSection() {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24">
      <Reveal direction="scale">
        <div className="relative text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96">
            <div className="w-full h-full bg-gold-500/5 rounded-full blur-3xl animate-float" />
          </div>
          <div className="relative z-10">
            <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Newsletter</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-white mt-3 mb-4">Stay Ahead</h2>
            <p className="text-dark-400 mb-8 max-w-md mx-auto">Be the first to know about exclusive releases, early access, and members-only offers.</p>
            <NewsletterForm />
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="page-transition overflow-x-hidden">
      <HeroSection />
      <TrustBar />
      <CategoriesSection />
      <FeaturedSection />
      <BrandStatement />
      <AllProductsSection />
      <TestimonialsSection />
      <RecentlyViewed />
      <NewsletterSection />
    </div>
  );
}
