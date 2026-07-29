"use client";

import { useState, useMemo, Suspense, useRef, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { categories } from "@/data/products";
import { Product } from "@/data/types";
import ProductCard from "@/components/ProductCard";
import { SlidersHorizontal, X, ChevronUp, ChevronDown, Search } from "lucide-react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialSearch = searchParams.get("q") || "";
  const shouldFocusSearch = searchParams.get("focus") === "search";
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initialBrand ? [initialBrand] : []);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [sortBy, setSortBy] = useState("featured");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200000]);
  const [showFilters, setShowFilters] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((r) => r.json())
      .then((data) => { if (!data.error) setAllProducts(data); })
      .catch(() => {})
      .finally(() => setProductsLoaded(true));
  }, []);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const checkScroll = useCallback(() => {
    const el = sidebarRef.current;
    if (!el) return;
    setCanScrollUp(el.scrollTop > 5);
    setCanScrollDown(el.scrollTop + el.clientHeight < el.scrollHeight - 5);
  }, []);

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    checkScroll();
    const observer = new ResizeObserver(checkScroll);
    observer.observe(el);
    el.addEventListener("scroll", checkScroll, { passive: true });
    return () => { observer.disconnect(); el.removeEventListener("scroll", checkScroll); };
  }, [checkScroll, selectedCategory, selectedBrands, sortBy, priceRange]);

  useEffect(() => {
    if (shouldFocusSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [shouldFocusSearch]);

  const scrollSidebar = (direction: "up" | "down") => {
    sidebarRef.current?.scrollBy({ top: direction === "up" ? -200 : 200, behavior: "smooth" });
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.features.some((f) => f.toLowerCase().includes(q))
      );
    }
    if (selectedCategory) result = result.filter((p) => p.category === selectedCategory);
    if (selectedBrands.length > 0) result = result.filter((p) => selectedBrands.includes(p.brand));
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.price - b.price); break;
      case "price-high": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      case "name": result.sort((a, b) => a.name.localeCompare(b.name)); break;
      default: result.sort((a, b) => (b.badge ? 1 : 0) - (a.badge ? 1 : 0));
    }
    return result;
  }, [selectedCategory, selectedBrands, sortBy, priceRange, searchQuery, allProducts]);

  const allBrands = Array.from(new Set(allProducts.map((p) => p.brand).filter((b) => b !== "Batra Tech")));

  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 page-transition">
      <div className="mb-12">
        <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Browse</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mt-2">
          {searchQuery ? `Results for "${searchQuery}"` : selectedCategory ? categories.find((c) => c.slug === selectedCategory)?.name || "Products" : "All Products"}
        </h1>
        <p className="text-dark-400 mt-2">{filteredProducts.length} products</p>
        <div className="mt-6 relative max-w-xl">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search phones, audio, accessories..."
            className="w-full bg-dark-900 border border-dark-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <button onClick={() => setShowFilters(!showFilters)} className="lg:hidden flex items-center gap-2 bg-dark-900 border border-dark-800 rounded-xl px-4 py-2.5 text-sm font-medium text-dark-300">
          <SlidersHorizontal size={16} /> Filters
        </button>

        <aside className={`${showFilters ? "block" : "hidden"} lg:block w-full lg:w-64 shrink-0`}>
          <div className="relative lg:sticky lg:top-28">
            {canScrollUp && (
              <button onClick={() => scrollSidebar("up")} className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-dark-800 border border-dark-700 text-gold-400 flex items-center justify-center hover:bg-dark-700 transition-colors shadow-lg">
                <ChevronUp size={16} />
              </button>
            )}
            <div ref={sidebarRef} className="bg-dark-900/80 border border-dark-800/50 rounded-2xl p-6 lg:max-h-[calc(100vh-8rem)] overflow-y-auto scrollbar-hide space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-white">Filters</h3>
                {(selectedCategory || selectedBrands.length > 0 || priceRange[1] < 200000 || searchQuery) && (
                  <button onClick={() => { setSelectedCategory(""); setSelectedBrands([]); setPriceRange([0, 200000]); setSearchQuery(""); }} className="text-xs text-gold-400 hover:text-gold-300">Clear all</button>
                )}
              </div>

              <div>
                <h4 className="text-xs text-dark-400 uppercase tracking-wider font-semibold mb-3">Category</h4>
                <div className="space-y-1">
                  <button onClick={() => setSelectedCategory("")} className={`block w-full text-left text-sm px-3 py-2.5 rounded-lg transition-all ${!selectedCategory ? "bg-gold-500/10 text-gold-400 font-medium" : "text-dark-400 hover:text-white hover:bg-dark-800"}`}>
                    All
                  </button>
                  {categories.map((cat) => (
                    <button key={cat.slug} onClick={() => setSelectedCategory(cat.slug)} className={`block w-full text-left text-sm px-3 py-2.5 rounded-lg transition-all ${selectedCategory === cat.slug ? "bg-gold-500/10 text-gold-400 font-medium" : "text-dark-400 hover:text-white hover:bg-dark-800"}`}>
                      {cat.name} <span className="text-dark-600 ml-1">({allProducts.filter((p) => p.category === cat.slug).length})</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs text-dark-400 uppercase tracking-wider font-semibold mb-3">Max Price</h4>
                <input type="range" min={0} max={200000} step={1000} value={priceRange[1]} onChange={(e) => setPriceRange([0, Number(e.target.value)])} className="w-full accent-gold-500" />
                <div className="flex justify-between text-xs text-dark-500 mt-1">
                  <span>₹0</span>
                  <span className="text-gold-400 font-medium">₹{priceRange[1].toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div>
                <h4 className="text-xs text-dark-400 uppercase tracking-wider font-semibold mb-3">Brands</h4>
                <div className="space-y-2">
                  {allBrands.map((brand) => {
                    const active = selectedBrands.includes(brand);
                    return (
                      <label key={brand} className="flex items-center gap-2.5 text-sm cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleBrand(brand)}
                          className="rounded border-dark-600 text-gold-500 focus:ring-gold-500 bg-dark-800"
                        />
                        <span className={active ? "text-gold-400 font-medium" : "text-dark-400 hover:text-white"}>{brand}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
            {canScrollDown && (
              <button onClick={() => scrollSidebar("down")} className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 w-8 h-8 rounded-full bg-dark-800 border border-dark-700 text-gold-400 flex items-center justify-center hover:bg-dark-700 transition-colors shadow-lg">
                <ChevronDown size={16} />
              </button>
            )}
          </div>
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-8 bg-dark-900/60 border border-dark-800/50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 flex-wrap">
              {searchQuery && (
                <span className="bg-gold-500/10 text-gold-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                  &quot;{searchQuery}&quot;
                  <button onClick={() => setSearchQuery("")}><X size={12} /></button>
                </span>
              )}
              {selectedCategory && (
                <span className="bg-gold-500/10 text-gold-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                  {categories.find((c) => c.slug === selectedCategory)?.name}
                  <button onClick={() => setSelectedCategory("")}><X size={12} /></button>
                </span>
              )}
              {selectedBrands.map((brand) => (
                <span key={brand} className="bg-gold-500/10 text-gold-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                  {brand}
                  <button onClick={() => toggleBrand(brand)}><X size={12} /></button>
                </span>
              ))}
            </div>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="text-sm bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-dark-300 focus:outline-none focus:border-gold-500">
              <option value="featured">Featured</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-dark-500 text-lg">No products match your filters.</p>
              <button onClick={() => { setSelectedCategory(""); setSelectedBrands([]); setPriceRange([0, 200000]); setSearchQuery(""); }} className="mt-4 text-gold-400 font-medium hover:text-gold-300 transition-colors">Clear Filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="w-10 h-10 border-2 border-dark-700 border-t-gold-500 rounded-full animate-spin mx-auto" />
        <p className="text-dark-500 mt-4 text-sm">Loading...</p>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
