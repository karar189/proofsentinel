// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ReserveMonitor
 * @notice Contract that stores protocol config and allows safeguards to trigger.
 *        Called by CRE workflows when solvency risk is detected.
 */
contract ReserveMonitor {
    address public admin;
    bool public withdrawalsPaused;
    bool public depositsPaused;

    event ReserveAlert(uint256 ratio);
    event WithdrawalsPaused();
    event DepositsPaused();
    event WithdrawalsUnpaused();
    event DepositsUnpaused();

    error OnlyAdmin();

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    function pauseWithdrawals() external onlyAdmin {
        withdrawalsPaused = true;
        emit WithdrawalsPaused();
    }

    function unpauseWithdrawals() external onlyAdmin {
        withdrawalsPaused = false;
        emit WithdrawalsUnpaused();
    }

    function pauseDeposits() external onlyAdmin {
        depositsPaused = true;
        emit DepositsPaused();
    }

    function unpauseDeposits() external onlyAdmin {
        depositsPaused = false;
        emit DepositsUnpaused();
    }

    /// @dev Called by CRE workflow (or authorized oracle) when reserve ratio breaches threshold
    function emitReserveAlert(uint256 ratio) external onlyAdmin {
        emit ReserveAlert(ratio);
    }
}
