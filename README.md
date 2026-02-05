# 🛡️ Project TARS: Trustless Integrity & Automated Privacy
## Decentralized Forensic Disclosure Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tech Stack: Next.js 14](https://img.shields.io/badge/Frontend-Next.js%2014-black)](https://nextjs.org/)
[![Blockchain: Polygon Amoy](https://img.shields.com/badge/Blockchain-Polygon%20Amoy-blueviolet)](https://polygon.technology/)
[![Features: ZK%20Proof%20%7C%20Multi--Sig%20%7C%20IPFS](https://img.shields.io/badge/Security-ZK%20Proof%20%7C%20Multi--Sig%20%7C%20IPFS-red)](https://github.com/TARS-Platform)

## 🌟 Mission Statement

> "To replace centralized trust with cryptographic certainty. TARS ensures that evidence is immutable, anonymized, forensically audited, and requires a decentralized consensus from multiple authorities before final validation."

## 🚀 Key Architectural Pillars

Project TARS introduces five critical security layers for digital whistleblowing:

1.  **Zero-Knowledge Authority (ZK-Auth):**
    *   **Goal:** Prove identity without revealing the secret.
    *   **Mechanism:** Admin must pass a ZK Merkle Proof check (`verifyAuthority`) to log in.

2.  **Consensus Voting (3/3 Multi-Sig):**
    *   **Goal:** Prevent single-point-of-failure governance.
    *   **Mechanism:** Final report validation requires **3 unique ZK-Secret holders** to cryptographically sign a vote transaction (`castValidationVote`).

3.  **Immutable Audit Trail (Super Log):**
    *   **Goal:** Record every action taken by an official.
    *   **Mechanism:** Every decryption action by an officer triggers an on-chain transaction (`recordAccess`), storing their wallet and ZK-identifier forever.

4.  **Sharded Forensic Lock:**
    *   **Goal:** Protect the Super Log from unilateral access.
    *   **Mechanism:** The access history is locked behind a **5-part master key** (`TARS-ALPHA-SECURITY-OMEGA-PROTOCOL`). The final PDF is also encrypted with this key.

5.  **Pixel Wash & Encrypted Dossier:**
    *   **Goal:** Ensure absolute anonymity and evidence security.
    *   **Mechanism:** Images are **stripped of all metadata (Pixel Wash)** via Canvas re-rendering, and the entire evidence dossier (media, map data, statements) is secured with AES-256 client-side encryption.

---

## 🛠️ Tech Stack & Setup

| Category | Technology | Libraries |
| :--- | :--- | :--- |
| **Frontend/UI** | Next.js 14 (App Router) | Tailwind, Framer Motion |
| **Blockchain** | Polygon Amoy Testnet | Solidity |
| **Web3** | Viem, Wagmi, RainbowKit | |
| **Security** | Merkle Tree, ZK Proof | `merkletreejs`, `keccak256`, `crypto-js` |
| **Storage** | IPFS (Pinata) | `axios` |
| **Forensics** | PDF Encryption | `jspdf` |

### **Installation Commands**

```bash
# 1. Clone the repository (Assuming you already created the tars-platform folder)
cd tars-platform

# 2. Install Core Dependencies
npm install @rainbow-me/rainbowkit wagmi viem @tanstack/react-query framer-motion lucide-react exifr
npm install merkletreejs keccak256 crypto-js axios jspdf jspdf-autotable

# 3. Start the application (Always run on a non-default port to avoid conflicts)
npm run dev -- -p 5000
