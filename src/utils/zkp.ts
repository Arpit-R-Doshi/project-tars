import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

// For a hackathon, we'll use a set of pre-defined "Admin Passphrases"
// In a real ZK system, these would be random 32-byte scalars.
const ADMIN_SECRETS = [
  "tars-authority-alpha-99",
  "tars-authority-beta-42",
  "tars-authority-gamma-13"
];

// 1. Generate the Root (Run this once to get the value for your contract)
export const generateMerkleRoot = () => {
  const leaves = ADMIN_SECRETS.map(x => keccak256(x));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  return tree.getHexRoot();
};

// 2. Generate the Proof for a specific secret
export const generateZKProof = (secret: string) => {
  const leaves = ADMIN_SECRETS.map(x => keccak256(x));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const leaf = keccak256(secret);
  const proof = tree.getHexProof(leaf);
  return { proof, leaf: '0x' + leaf.toString('hex') };
};