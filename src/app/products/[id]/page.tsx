import { products } from "@/data/products";
import ProductDetailClient from "./ProductDetailClient";

export async function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export default function ProductDetailPage() {
  return <ProductDetailClient />;
}
