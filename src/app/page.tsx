import { VaultsTable } from "@/components/vault/vaults-table";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8 md:py-8">
      <h1 className="mb-10 text-3xl tracking-tight md:text-5xl">
        Morpho Vaults v2
      </h1>
      <VaultsTable />
    </div>
  );
}
