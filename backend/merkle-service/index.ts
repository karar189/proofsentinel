/**
 * Merkle tree liability service: builds a Merkle tree from user liability data
 * and computes total liabilities from verified leaves.
 */
import { ethers } from "ethers";

export type LiabilityLeaf = {
  userId: string;
  balance: string; // BigInt as string
};

/**
 * Hash a single leaf: keccak256(abi.encodePacked(userId, balance))
 */
export function hashLeaf(leaf: LiabilityLeaf): string {
  return ethers.solidityPackedKeccak256(
    ["string", "uint256"],
    [leaf.userId, BigInt(leaf.balance)]
  );
}

/**
 * Hash two sibling nodes (sorted to ensure deterministic ordering)
 */
function hashPair(a: string, b: string): string {
  const [left, right] = a < b ? [a, b] : [b, a];
  return ethers.solidityPackedKeccak256(["bytes32", "bytes32"], [left, right]);
}

/**
 * Build a Merkle tree from leaves. Returns all layers (bottom-up) and the root.
 */
export function buildMerkleTree(leaves: LiabilityLeaf[]): {
  root: string;
  layers: string[][];
  leaves: LiabilityLeaf[];
} {
  if (leaves.length === 0) {
    return { root: ethers.ZeroHash, layers: [[]], leaves: [] };
  }

  let currentLayer = leaves.map(hashLeaf);
  const layers: string[][] = [currentLayer];

  while (currentLayer.length > 1) {
    const nextLayer: string[] = [];
    for (let i = 0; i < currentLayer.length; i += 2) {
      if (i + 1 < currentLayer.length) {
        nextLayer.push(hashPair(currentLayer[i], currentLayer[i + 1]));
      } else {
        // Odd node: promote to next layer
        nextLayer.push(currentLayer[i]);
      }
    }
    currentLayer = nextLayer;
    layers.push(currentLayer);
  }

  return { root: currentLayer[0], layers, leaves };
}

/**
 * Generate a Merkle proof for a given leaf index.
 */
export function generateProof(layers: string[][], index: number): string[] {
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

/**
 * Verify a Merkle proof for a leaf against a root.
 */
export function verifyProof(
  leaf: LiabilityLeaf,
  proof: string[],
  root: string
): boolean {
  let hash = hashLeaf(leaf);

  for (const sibling of proof) {
    hash = hashPair(hash, sibling);
  }

  return hash === root;
}

/**
 * Compute total liabilities from all leaves (sum of balances).
 */
export function computeTotalLiabilities(leaves: LiabilityLeaf[]): bigint {
  return leaves.reduce((sum, leaf) => sum + BigInt(leaf.balance), 0n);
}

/**
 * Full pipeline: build tree, compute liabilities, return root + total.
 */
export function processLiabilities(leaves: LiabilityLeaf[]): {
  root: string;
  totalLiabilities: bigint;
  tree: { root: string; layers: string[][]; leaves: LiabilityLeaf[] };
} {
  const tree = buildMerkleTree(leaves);
  const totalLiabilities = computeTotalLiabilities(leaves);
  return { root: tree.root, totalLiabilities, tree };
}
