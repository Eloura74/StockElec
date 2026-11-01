import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ParametresClient } from "./ParametresClient";

export const metadata = {
  title: "Paramètres & Personnalisation Visuelle | StockElec",
  description: "Configuration des thèmes, de l'affichage HUD et des paramètres système de StockElec.",
};

export default async function ParametresPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <ParametresClient user={session} />
    </main>
  );
}
