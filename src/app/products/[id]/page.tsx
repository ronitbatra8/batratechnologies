import { products } from "@/data/products";
import ProductDetailClient from "./ProductDetailClient";

export async function generateStaticParams() {
  const staticIds = products.map((p) => ({ id: p.id }));
  let sellerIds: { id: string }[] = [];
  try {
    const res = await fetch("http://localhost:5000/api/products");
    if (res.ok) {
      const all = await res.json();
      sellerIds = all.filter((p: any) => p.sellerId).map((p: any) => ({ id: p.id }));
    }
  } catch {}
  return [...staticIds, ...sellerIds];
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
