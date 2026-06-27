import { TariffSettingsPanel } from "@/components/tariff-settings-panel";
import { prisma } from "@/lib/prisma";

export default async function TarifPokokPage() {
  const tariffs = await prisma.baseTariff.findMany({
    where: { isActive: true },
    orderBy: [{ isLocked: "desc" }, { name: "asc" }],
  });

  return (
    <TariffSettingsPanel
      tariffs={tariffs.map((tariff) => ({
        id: tariff.id,
        name: tariff.name,
        amount: tariff.amount.toNumber(),
        description: tariff.description ?? "",
        isMandatory: tariff.isMandatory,
        isLocked: tariff.isLocked,
      }))}
    />
  );
}
