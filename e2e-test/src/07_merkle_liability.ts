/**
 * Step 7: Merkle tree liability source — end-to-end test
 *
 * Tests:
 *   1. Register a protocol with liabilitySource = "merkle" + merkleTreeData
 *   2. Verify merkleRoot is computed and returned
 *   3. Update Merkle tree data via PUT /protocol/:id/merkle-tree
 *   4. Verify a leaf via POST /protocol/:id/merkle-verify
 *   5. Verify an invalid leaf is rejected
 *   6. Register a protocol with liabilitySource = "api" (validation test)
 *
 * Requires: backend API server running
 */
import { post, get, assert, assertEq, API_BASE_URL } from "./utils/index.ts";

async function main() {
  console.log("=== Step 7: Merkle & API Liability Sources ===\n");

  const protocolId = `merkle-${Date.now()}`;

  // Sample liability leaves
  const leaves = [
    { userId: "user-alice", balance: "1000000000000000000" },   // 1 ETH
    { userId: "user-bob", balance: "2000000000000000000" },     // 2 ETH
    { userId: "user-charlie", balance: "500000000000000000" },  // 0.5 ETH
  ];

  // 1. Register protocol with merkle liability source
  console.log("1. Registering protocol with Merkle liability source...");
  const proto = await post("/protocol", {
    protocolId,
    name: "Merkle Test Protocol",
    reserveWallets: ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"],
    liabilitySource: "merkle",
    merkleTreeData: leaves,
    minReserveRatio: 1.0,
    warningRatio: 1.1,
    criticalRatio: 0.95,
  });
  assertEq(proto.protocolId, protocolId, "registered with merkle source");
  assertEq(proto.liabilitySource, "merkle", "liability source is merkle");
  assert(!!proto.merkleRoot, "merkleRoot is set");
  console.log(`  Merkle root: ${proto.merkleRoot}`);

  // 2. Verify protocol is listed
  console.log("\n2. Verifying protocol listed...");
  const list = await get("/protocols");
  const found = list.find((p: any) => p.protocolId === protocolId);
  assert(!!found, "found in list");
  assertEq(found.liabilitySource, "merkle", "liability source persisted");
  assert(!!found.merkleRoot, "merkleRoot persisted");

  // 3. Update Merkle tree data
  console.log("\n3. Updating Merkle tree via PUT...");
  const updatedLeaves = [
    ...leaves,
    { userId: "user-dave", balance: "3000000000000000000" }, // 3 ETH
  ];
  const putRes = await fetch(`${API_BASE_URL}/protocol/${protocolId}/merkle-tree`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leaves: updatedLeaves }),
  });
  assertEq(putRes.status, 200, "PUT merkle-tree succeeded");
  const putData = await putRes.json() as any;
  assertEq(putData.leafCount, 4, "4 leaves in updated tree");
  assert(!!putData.merkleRoot, "new merkleRoot computed");
  assert(putData.merkleRoot !== proto.merkleRoot, "merkleRoot changed after update");
  console.log(`  Updated root: ${putData.merkleRoot}`);
  console.log(`  Total liabilities: ${putData.totalLiabilities}`);

  // Expected total: 1 + 2 + 0.5 + 3 = 6.5 ETH = 6500000000000000000
  assertEq(putData.totalLiabilities, "6500000000000000000", "total liabilities correct");

  // 4. Verify a valid leaf (we need to get the proof from the tree)
  //    The merkle-verify endpoint checks against the stored root
  //    We need to build the tree client-side to get the proof
  console.log("\n4. Verifying valid leaf via merkle-verify...");

  // Build tree client-side to generate proof
  // We'll use a simple approach: import ethers to hash leaves
  const { ethers } = await import("ethers");

  function hashLeaf(leaf: { userId: string; balance: string }): string {
    return ethers.solidityPackedKeccak256(
      ["string", "uint256"],
      [leaf.userId, BigInt(leaf.balance)]
    );
  }

  function hashPair(a: string, b: string): string {
    const [left, right] = a < b ? [a, b] : [b, a];
    return ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [left, right]);
  }

  // Build tree from updatedLeaves
  let currentLayer = updatedLeaves.map(hashLeaf);
  const layers: string[][] = [currentLayer];
  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        nextLayer.push(hashPair(currentLayer[i], currentLayer[i + 1]));
      } else {
        nextLayer.push(currentLayer[i]);
      }
    }
    currentLayer = nextLayer;
    layers.push(currentLayer);
  }

  // Generate proof for leaf 0 (alice)
  function genProof(layers: string[][], index: number): string[] {
    const proof: string[] = [];
    let idx = index;
    for (let i = 0; i < layers.length - 1; i++) {
      const layer = layers[i];
      const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;
      if (siblingIdx < layer.length) {
        proof.push(layer[siblingIdx]);
      }
      idx = Math.floor(idx / 2);
    }
    return proof;
  }

  const aliceProof = genProof(layers, 0);

  const verifyRes = await post(`/protocol/${protocolId}/merkle-verify`, {
    userId: "user-alice",
    balance: "1000000000000000000",
    proof: aliceProof,
  });
  assertEq(verifyRes.valid, true, "alice's proof is valid");

  // 5. Verify invalid leaf is rejected
  console.log("\n5. Verifying invalid leaf is rejected...");
  const invalidRes = await post(`/protocol/${protocolId}/merkle-verify`, {
    userId: "user-fake",
    balance: "9999999999999999999",
    proof: aliceProof,
  });
  assertEq(invalidRes.valid, false, "fake user proof is invalid");

  // 6. Register protocol with API liability source (validation only)
  console.log("\n6. Registering protocol with API liability source...");
  const apiProtocolId = `api-${Date.now()}`;
  const apiProto = await post("/protocol", {
    protocolId: apiProtocolId,
    name: "API Test Protocol",
    reserveWallets: ["0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"],
    liabilitySource: "api",
    liabilityApiUrl: "https://httpbin.org/json",
    liabilityApiPath: "slideshow.slides.length",
    minReserveRatio: 1.0,
    warningRatio: 1.1,
    criticalRatio: 0.95,
  });
  assertEq(apiProto.protocolId, apiProtocolId, "registered with api source");
  assertEq(apiProto.liabilitySource, "api", "liability source is api");
  assertEq(apiProto.liabilityApiUrl, "https://httpbin.org/json", "api URL persisted");
  assertEq(apiProto.liabilityApiPath, "slideshow.slides.length", "api path persisted");

  // 7. Verify PUT merkle-tree validation
  console.log("\n7. Validating PUT merkle-tree error cases...");
  const emptyPut = await fetch(`${API_BASE_URL}/protocol/${protocolId}/merkle-tree`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leaves: [] }),
  });
  assertEq(emptyPut.status, 400, "empty leaves rejected");

  const notFoundPut = await fetch(`${API_BASE_URL}/protocol/nonexistent-${Date.now()}/merkle-tree`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leaves: [{ userId: "a", balance: "1" }] }),
  });
  assertEq(notFoundPut.status, 404, "nonexistent protocol rejected");

  console.log("\nMerkle & API liability tests passed!");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
