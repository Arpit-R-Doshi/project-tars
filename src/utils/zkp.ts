import { MerkleTree } from 'merkletreejs';
import keccak256 from 'keccak256';

// THESE MUST MATCH EXACTLY WHAT YOU USE TO GENERATE THE ROOT
const ADMIN_SECRETS = [
  "tars-authority-alpha-99",
  "tars-authority-beta-42",
  "tars-authority-gamma-13"
];

// 1. Generate the Root (Call this in console to get the value for Remix)
export const generateMerkleRoot = () => {
  const leaves = ADMIN_SECRETS.map(x => keccak256(x));
  // sortPairs: true is critical for Solidity compatibility
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  return tree.getHexRoot();
};

// 2. Generate Proof
export const generateZKProof = (secret: string) => {
  const leaves = ADMIN_SECRETS.map(x => keccak256(x));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const leaf = keccak256(secret);
  const proof = tree.getHexProof(leaf);
  
  return { 
    proof: proof as `0x${string}`[], 
    leaf: `0x${leaf.toString('hex')}` as `0x${string}` 
  };
};