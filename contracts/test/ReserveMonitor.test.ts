import { expect } from "chai";
import { ethers } from "hardhat";
import { ReserveMonitor } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ReserveMonitor", function () {
  let monitor: ReserveMonitor;
  let admin: HardhatEthersSigner;
  let oracle: HardhatEthersSigner;
  let unauthorized: HardhatEthersSigner;

  beforeEach(async function () {
    [admin, oracle, unauthorized] = await ethers.getSigners();
    const ReserveMonitor = await ethers.getContractFactory("ReserveMonitor");
    monitor = await ReserveMonitor.deploy();
    await monitor.waitForDeployment();
  });

  // ── Deployment ─────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("should set deployer as admin", async function () {
      expect(await monitor.admin()).to.equal(admin.address);
    });

    it("should initialize withdrawalsPaused to false", async function () {
      expect(await monitor.withdrawalsPaused()).to.equal(false);
    });

    it("should initialize depositsPaused to false", async function () {
      expect(await monitor.depositsPaused()).to.equal(false);
    });
  });

  // ── Oracle Role Management ─────────────────────────────────────────

  describe("grantOracleRole", function () {
    it("should allow admin to grant oracle role", async function () {
      await monitor.grantOracleRole(oracle.address);
      expect(await monitor.oracles(oracle.address)).to.equal(true);
    });

    it("should emit OracleRoleGranted event", async function () {
      await expect(monitor.grantOracleRole(oracle.address))
        .to.emit(monitor, "OracleRoleGranted")
        .withArgs(oracle.address);
    });

    it("should revert when non-admin tries to grant oracle role", async function () {
      await expect(
        monitor.connect(oracle).grantOracleRole(unauthorized.address)
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");
    });

    it("should revert when oracle tries to grant oracle role", async function () {
      await monitor.grantOracleRole(oracle.address);
      await expect(
        monitor.connect(oracle).grantOracleRole(unauthorized.address)
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");
    });
  });

  describe("revokeOracleRole", function () {
    beforeEach(async function () {
      await monitor.grantOracleRole(oracle.address);
    });

    it("should allow admin to revoke oracle role", async function () {
      await monitor.revokeOracleRole(oracle.address);
      expect(await monitor.oracles(oracle.address)).to.equal(false);
    });

    it("should emit OracleRoleRevoked event", async function () {
      await expect(monitor.revokeOracleRole(oracle.address))
        .to.emit(monitor, "OracleRoleRevoked")
        .withArgs(oracle.address);
    });

    it("should revert when non-admin tries to revoke oracle role", async function () {
      await expect(
        monitor.connect(unauthorized).revokeOracleRole(oracle.address)
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");
    });
  });

  // ── Withdrawal Pause (onlyAuthorized: admin OR oracle) ─────────────

  describe("pauseWithdrawals", function () {
    it("should allow admin to pause withdrawals", async function () {
      await monitor.pauseWithdrawals();
      expect(await monitor.withdrawalsPaused()).to.equal(true);
    });

    it("should allow oracle to pause withdrawals", async function () {
      await monitor.grantOracleRole(oracle.address);
      await monitor.connect(oracle).pauseWithdrawals();
      expect(await monitor.withdrawalsPaused()).to.equal(true);
    });

    it("should emit WithdrawalsPaused event", async function () {
      await expect(monitor.pauseWithdrawals())
        .to.emit(monitor, "WithdrawalsPaused");
    });

    it("should revert when unauthorized address calls", async function () {
      await expect(
        monitor.connect(unauthorized).pauseWithdrawals()
      ).to.be.revertedWithCustomError(monitor, "OnlyAuthorized");
    });
  });

  describe("unpauseWithdrawals", function () {
    beforeEach(async function () {
      await monitor.pauseWithdrawals();
    });

    it("should allow admin to unpause withdrawals", async function () {
      await monitor.unpauseWithdrawals();
      expect(await monitor.withdrawalsPaused()).to.equal(false);
    });

    it("should allow oracle to unpause withdrawals", async function () {
      await monitor.grantOracleRole(oracle.address);
      await monitor.connect(oracle).unpauseWithdrawals();
      expect(await monitor.withdrawalsPaused()).to.equal(false);
    });

    it("should emit WithdrawalsUnpaused event", async function () {
      await expect(monitor.unpauseWithdrawals())
        .to.emit(monitor, "WithdrawalsUnpaused");
    });

    it("should revert when unauthorized address calls", async function () {
      await expect(
        monitor.connect(unauthorized).unpauseWithdrawals()
      ).to.be.revertedWithCustomError(monitor, "OnlyAuthorized");
    });
  });

  // ── Deposit Pause (onlyAdmin) ──────────────────────────────────────

  describe("pauseDeposits", function () {
    it("should allow admin to pause deposits", async function () {
      await monitor.pauseDeposits();
      expect(await monitor.depositsPaused()).to.equal(true);
    });

    it("should emit DepositsPaused event", async function () {
      await expect(monitor.pauseDeposits())
        .to.emit(monitor, "DepositsPaused");
    });

    it("should revert when oracle tries to pause deposits", async function () {
      await monitor.grantOracleRole(oracle.address);
      await expect(
        monitor.connect(oracle).pauseDeposits()
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");
    });

    it("should revert when unauthorized address calls", async function () {
      await expect(
        monitor.connect(unauthorized).pauseDeposits()
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");
    });
  });

  describe("unpauseDeposits", function () {
    beforeEach(async function () {
      await monitor.pauseDeposits();
    });

    it("should allow admin to unpause deposits", async function () {
      await monitor.unpauseDeposits();
      expect(await monitor.depositsPaused()).to.equal(false);
    });

    it("should emit DepositsUnpaused event", async function () {
      await expect(monitor.unpauseDeposits())
        .to.emit(monitor, "DepositsUnpaused");
    });

    it("should revert when oracle tries to unpause deposits", async function () {
      await monitor.grantOracleRole(oracle.address);
      await expect(
        monitor.connect(oracle).unpauseDeposits()
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");
    });

    it("should revert when unauthorized address calls", async function () {
      await expect(
        monitor.connect(unauthorized).unpauseDeposits()
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");
    });
  });

  // ── Reserve Alert (onlyAuthorized: admin OR oracle) ────────────────

  describe("emitReserveAlert", function () {
    const testRatio = 8500n; // 85.00%

    it("should allow admin to emit reserve alert", async function () {
      await expect(monitor.emitReserveAlert(testRatio))
        .to.emit(monitor, "ReserveAlert")
        .withArgs(testRatio);
    });

    it("should allow oracle to emit reserve alert", async function () {
      await monitor.grantOracleRole(oracle.address);
      await expect(monitor.connect(oracle).emitReserveAlert(testRatio))
        .to.emit(monitor, "ReserveAlert")
        .withArgs(testRatio);
    });

    it("should emit ReserveAlert with correct ratio value", async function () {
      const ratios = [0n, 5000n, 10000n, 123456789n];
      for (const ratio of ratios) {
        await expect(monitor.emitReserveAlert(ratio))
          .to.emit(monitor, "ReserveAlert")
          .withArgs(ratio);
      }
    });

    it("should revert when unauthorized address calls", async function () {
      await expect(
        monitor.connect(unauthorized).emitReserveAlert(testRatio)
      ).to.be.revertedWithCustomError(monitor, "OnlyAuthorized");
    });
  });

  // ── Access Control Edge Cases ──────────────────────────────────────

  describe("Access control edge cases", function () {
    it("should deny oracle access after role is revoked", async function () {
      await monitor.grantOracleRole(oracle.address);
      await monitor.connect(oracle).pauseWithdrawals();
      expect(await monitor.withdrawalsPaused()).to.equal(true);

      await monitor.revokeOracleRole(oracle.address);
      await expect(
        monitor.connect(oracle).unpauseWithdrawals()
      ).to.be.revertedWithCustomError(monitor, "OnlyAuthorized");
    });

    it("should allow re-granting oracle role after revocation", async function () {
      await monitor.grantOracleRole(oracle.address);
      await monitor.revokeOracleRole(oracle.address);
      await monitor.grantOracleRole(oracle.address);
      expect(await monitor.oracles(oracle.address)).to.equal(true);
    });

    it("should not allow unauthorized to call any protected function", async function () {
      await expect(
        monitor.connect(unauthorized).pauseWithdrawals()
      ).to.be.revertedWithCustomError(monitor, "OnlyAuthorized");

      await expect(
        monitor.connect(unauthorized).unpauseWithdrawals()
      ).to.be.revertedWithCustomError(monitor, "OnlyAuthorized");

      await expect(
        monitor.connect(unauthorized).pauseDeposits()
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");

      await expect(
        monitor.connect(unauthorized).unpauseDeposits()
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");

      await expect(
        monitor.connect(unauthorized).emitReserveAlert(100n)
      ).to.be.revertedWithCustomError(monitor, "OnlyAuthorized");

      await expect(
        monitor.connect(unauthorized).grantOracleRole(unauthorized.address)
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");

      await expect(
        monitor.connect(unauthorized).revokeOracleRole(unauthorized.address)
      ).to.be.revertedWithCustomError(monitor, "OnlyAdmin");
    });
  });
});
