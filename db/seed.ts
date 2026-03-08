import { prisma } from "./index";

async function seed() {
  console.log("Seeding database...");

  await prisma.protocol.upsert({
    where: { protocolId: "demo" },
    update: {},
    create: {
      protocolId: "demo",
      name: "Demo Protocol",
      reserveWallets: ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"],
      liabilitySource: "token",
      tokenAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      tokenDecimals: 6,
      tokenSymbol: "USDT",
      minReserveRatio: 1.0,
      warningRatio: 1.1,
      criticalRatio: 0.95,
    },
  });

  console.log("Seed complete.");
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
