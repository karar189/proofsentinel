import { ethers } from "hardhat";

async function main() {
  const ReserveMonitor = await ethers.getContractFactory("ReserveMonitor");
  const monitor = await ReserveMonitor.deploy();
  await monitor.waitForDeployment();
  const address = await monitor.getAddress();
  console.log(`ReserveMonitor deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
