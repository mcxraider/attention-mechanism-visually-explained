import { MECHANISMS, MechanismKey } from "@/lib/mechanisms";
import MechanismDeepDive from "@/components/mechanism/MechanismDeepDive";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return ["dense", "flash", "local", "sparse", "linear", "paged"].map(key => ({ key }));
}

export default async function Page({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!MECHANISMS[key as MechanismKey]) notFound();
  return <MechanismDeepDive mechanismKey={key as MechanismKey} />;
}
