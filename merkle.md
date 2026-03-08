# Merkle Tree Liability Verification

## Overview

ProofSentinel uses Merkle trees to enable **cryptographically verifiable liability tracking**. Instead of relying on a single total-supply value from a token contract, exchanges and protocols can submit individual user liability data as Merkle tree leaves. This allows:

- **Provable total liabilities** — the sum of all leaves is the total liability
- **User-level verification** — any user can verify their balance is included without seeing other users' data
- **Tamper detection** — any change to the underlying data changes the Merkle root

## How It Works

### 1. Data Structure

Each leaf in the Merkle tree represents a single user's liability:

```json
{
  "userId": "user-alice",
  "balance": "1000000000000000000"
}
```

- `userId` — unique identifier for the user (can be hashed for privacy)
- `balance` — liability amount as a raw integer string (wei-scale)

### 2. Tree Construction

```
        Root
       /    \
     H(0,1)  H(2,3)
     /   \    /   \
   H(A)  H(B) H(C) H(D)
```

1. Each leaf is hashed: `keccak256(abi.encodePacked(userId, balance))`
2. Sibling hashes are sorted (smaller first) before combining — this makes proofs order-independent
3. Pairs are hashed up the tree until a single root remains
4. Odd nodes are promoted to the next level

### 3. Verification

A user can prove their liability is included by providing:
- Their leaf data (`userId` + `balance`)
- A Merkle proof (array of sibling hashes from leaf to root)

The verifier re-computes the root from the leaf + proof and checks it matches the stored root.

## API Endpoints

### Register a Protocol with Merkle Liabilities

```bash
POST /protocol
```

```json
{
  "protocolId": "my-exchange",
  "name": "My Exchange",
  "reserveWallets": ["0x..."],
  "liabilitySource": "merkle",
  "merkleTreeData": [
    { "userId": "user-alice", "balance": "1000000000000000000" },
    { "userId": "user-bob", "balance": "2000000000000000000" }
  ],
  "warningRatio": 1.1,
  "criticalRatio": 0.95
}
```

The server builds the tree, computes the root, and stores everything. The response includes the computed `merkleRoot`.

### Update Merkle Tree Data

```bash
PUT /protocol/:protocolId/merkle-tree
```

```json
{
  "leaves": [
    { "userId": "user-alice", "balance": "1500000000000000000" },
    { "userId": "user-bob", "balance": "2000000000000000000" },
    { "userId": "user-charlie", "balance": "500000000000000000" }
  ]
}
```

Response:

```json
{
  "protocolId": "my-exchange",
  "merkleRoot": "0xfa867...",
  "totalLiabilities": "4000000000000000000",
  "leafCount": 3
}
```

### Verify a User's Inclusion

```bash
POST /protocol/:protocolId/merkle-verify
```

```json
{
  "userId": "user-alice",
  "balance": "1500000000000000000",
  "proof": ["0xabc...", "0xdef..."]
}
```

Response:

```json
{
  "valid": true,
  "userId": "user-alice",
  "merkleRoot": "0xfa867..."
}
```

## Monitoring Flow

When a protocol uses `liabilitySource: "merkle"`, the monitoring service:

1. Reads the stored `merkleTreeData` leaves from the database
2. Verifies the computed root matches the stored `merkleRoot` (tamper check)
3. Sums all leaf balances to get total liabilities
4. Compares against on-chain reserves to compute the reserve ratio
5. Evaluates risk thresholds as usual (healthy / warning / critical)

## Security Properties

| Property | Guarantee |
|----------|-----------|
| **Integrity** | Any modification to a single leaf changes the root hash |
| **Inclusion proof** | Users can verify their balance without seeing the full dataset |
| **Deterministic** | Same input data always produces the same root (sorted pair hashing) |
| **Tamper detection** | Monitoring checks root consistency on every run |

## Source Code

- Tree construction & verification: `backend/merkle-service/index.ts`
- Monitoring integration: `backend/monitoring-service/index.ts`
- API routes: `backend/api-server/app.ts`
- E2E tests: `e2e-test/src/07_merkle_liability.ts`
