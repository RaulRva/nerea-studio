import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { ShoppingList } from "@/components/shopping-list";
import { requirePlanAccess } from "@/lib/auth";
import { getMealsWeek } from "@/lib/data";

export const metadata: Metadata = { title: "Compra" };

async function ShopView() {
  await connection();
  const profile = await requirePlanAccess();
  const week = await getMealsWeek(profile.id);

  return <ShoppingList title={`Lista de la compra de ${profile.fullName || "la semana"}`} meals={week} />;
}

export default function ShopPage() {
  return (
    <Suspense fallback={<p className="muted">Cargando la lista…</p>}>
      <ShopView />
    </Suspense>
  );
}
