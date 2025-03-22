# MulTEEverse: Decentralized TEE Verification Network

A 3D visualization tool for the Multi-TEE Verification Network, powered by a blockchain-based **Proof of Attestation** consensus mechanism.

## The Problem

Trusted Execution Environments (TEEs) provide hardware-based security guarantees for applications, but they have a critical weakness: their verification typically relies on centralized authorities or hardware manufacturers. This creates:

- **Single Points of Failure**: If the central authority is compromised, the entire TEE ecosystem is at risk
- **Trust Issues**: Users must blindly trust hardware manufacturers' attestation services
- **Limited Cross-Vendor Compatibility**: Difficult to verify TEEs from different manufacturers in the same network

## Our Solution: Proof of Attestation

> **Proof of Attestation** is a novel consensus mechanism where TEEs collectively verify each other rather than relying on centralized authorities.

MulTEEverse implements this groundbreaking approach where:

1. **Decentralized Verification**: TEEs verify each other's attestations in a peer-to-peer network
2. **Trust Scores**: Each TEE earns a trust score based on successful verifications by peers
3. **Dynamic Status**: TEEs are classified as "secure", "warning", or "anomaly" based on their trust scores
4. **Blockchain Transparency**: All verifications are recorded on-chain for full auditability

### How Proof of Attestation Works

1. TEEs submit their attestation proofs to the network
2. Other TEEs in the network verify these attestations
3. Each verification result (success or failure) is recorded on-chain
4. Trust scores are calculated based on the ratio of successful verifications
5. The network collectively identifies potentially compromised TEEs

## Network Visualization

Our 3D visualizer provides:

- Real-time view of the TEE network with node status (green = secure, yellow = warning, red = anomaly)
- Interactive exploration of TEE relationships and trust scores
- Live verification events from the blockchain

## Technical Implementation

- **Smart Contracts**: TEERegistry, AttestationVerificationRecord, TrustScoreEngine (Solidity)
- **Blockchain Integration**: Ethereum Sepolia testnet
- **Frontend**: React with Three.js for 3D visualization
- **Data Flow**: Smart contracts → ethers.js → React components → 3D visualization

## Deployed Contracts (Sepolia Testnet)

| Contract | Address | Link |
|----------|---------|------|
| TEE Registry | 0x7D2efD3823E120e6459abc2706BB9a050D08719e | [View on Etherscan](https://sepolia.etherscan.io/address/0x7D2efD3823E120e6459abc2706BB9a050D08719e) |
| Attestation Verification Record | 0xe2e74C434DF808074428a73aFe922aEb85b278fa | [View on Etherscan](https://sepolia.etherscan.io/address/0xe2e74C434DF808074428a73aFe922aEb85b278fa) |

## Getting Started

```bash
# Install dependencies
npm install

# Start the development server
npm start
```

Connect to Ethereum Sepolia testnet to see live verification data.

## Future Development

- Multi-platform TEE support (Intel SGX, AMD SEV, ARM TrustZone)
- Governance mechanisms for parameter updates
- Cross-chain verification bridges
- Enhanced anomaly detection algorithms

---

Built for the EthGlobal Trifecta Hackathon by Lovish Badlani & Ishan Lakhwani.
