// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ReserveMonitor
 * @notice Contract that stores protocol config and allows safeguards to trigger.
 *         Called by CRE workflows when solvency risk is detected.
 * @dev    Implements role-based access control: admin has full authority,
 *         oracles (CRE DON nodes) can trigger withdrawal pauses and alerts.
 */
contract ReserveMonitor {
    address public admin;
    bool public withdrawalsPaused;
    bool public depositsPaused;

    /// @notice Tracks addresses granted the oracle role (CRE DON nodes)
    mapping(address => bool) public oracles;

    event ReserveAlert(uint256 ratio);
    event WithdrawalsPaused();
    event DepositsPaused();
    event WithdrawalsUnpaused();
    event DepositsUnpaused();
    event OracleRoleGranted(address indexed oracle);
    event OracleRoleRevoked(address indexed oracle);

    error OnlyAdmin();
    error OnlyAuthorized();

    constructor() {
        admin = msg.sender;
    }

    /// @dev Restricts to admin only
    modifier onlyAdmin() {
        if (msg.sender != admin) revert OnlyAdmin();
        _;
    }

    /// @dev Restricts to admin or a granted oracle
    modifier onlyAuthorized() {
        if (msg.sender != admin && !oracles[msg.sender]) revert OnlyAuthorized();
        _;
    }

    // ── Oracle Role Management (admin-only) ──────────────────────────

    /// @notice Grant oracle role to an address (e.g. CRE DON forwarder)
    function grantOracleRole(address oracle) external onlyAdmin {
        oracles[oracle] = true;
        emit OracleRoleGranted(oracle);
    }

    /// @notice Revoke oracle role from an address
    function revokeOracleRole(address oracle) external onlyAdmin {
        oracles[oracle] = false;
        emit OracleRoleRevoked(oracle);
    }

    // ── Withdrawal Safeguards (admin OR oracle) ──────────────────────

    function pauseWithdrawals() external onlyAuthorized {
        withdrawalsPaused = true;
        emit WithdrawalsPaused();
    }

    function unpauseWithdrawals() external onlyAuthorized {
        withdrawalsPaused = false;
        emit WithdrawalsUnpaused();
    }

    // ── Deposit Safeguards (admin-only) ──────────────────────────────

    function pauseDeposits() external onlyAdmin {
        depositsPaused = true;
        emit DepositsPaused();
    }

    function unpauseDeposits() external onlyAdmin {
        depositsPaused = false;
        emit DepositsUnpaused();
    }

    // ── Reserve Alerts (admin OR oracle) ─────────────────────────────

    /// @dev Called by CRE workflow (or authorized oracle) when reserve ratio breaches threshold
    function emitReserveAlert(uint256 ratio) external onlyAuthorized {
        emit ReserveAlert(ratio);
    }
}
