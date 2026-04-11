// import { ethers } from 'ethers';

// // ============================================
// // Environment Variables
// // ============================================
// const RPC_URL = import.meta.env.VITE_ANVIL_RPC || 'http://127.0.0.1:8545';
// const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// // ============================================
// // Provider & Signer
// // ============================================
// export const provider = new ethers.JsonRpcProvider(RPC_URL);
// export const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// // ============================================
// // ABIs (import from JSON files)
// // ============================================
// import governanceTokenAbi from './abi/GovernanceToken.json';
// import governorVulnerableAbi from './abi/GovernorVulnerable.json';
// import governorDefenseAbi from './abi/GovernorWithDefenses.json';
// import timelockAbi from './abi/Timelock.json';
// import flashLoanAttackAbi from './abi/FlashLoanAttack.json';
// import whaleManipulationAbi from './abi/WhaleManipulation.json';
// import proposalSpamAbi from './abi/ProposalSpam.json';
// import quorumManipulationAbi from './abi/QuorumManipulation.json';
// import timelockExploitAbi from './abi/TimelockExploit.json';
// import mockTreasuryAbi from './abi/MockTreasury.json';

// // ============================================
// // Contract Addresses
// // ============================================
// const GOVERNANCE_TOKEN_ADDRESS = import.meta.env.VITE_GOVERNANCE_TOKEN_ADDRESS;
// const GOVERNOR_VULNERABLE_ADDRESS = import.meta.env.VITE_GOVERNOR_VULNERABLE_ADDRESS;
// const GOVERNOR_DEFENSE_ADDRESS = import.meta.env.VITE_GOVERNOR_DEFENSE_ADDRESS;
// const TIMELOCK_ADDRESS = import.meta.env.VITE_TIMELOCK_ADDRESS;
// const MOCK_TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS;

// // Vulnerable attack contracts
// const FLASH_LOAN_ATTACK_VULN = import.meta.env.VITE_FLASH_LOAN_ATTACK;
// const WHALE_MANIPULATION_ATTACK_VULN = import.meta.env.VITE_WHALE_MANIPULATION;
// const PROPOSAL_SPAM_ATTACK_VULN = import.meta.env.VITE_PROPOSAL_SPAM;
// const QUORUM_MANIPULATION_ATTACK_VULN = import.meta.env.VITE_QUORUM_MANIPULATION;
// const TIMELOCK_EXPLOIT_ATTACK_VULN = import.meta.env.VITE_TIMELOCK_EXPLOIT;

// // Defense attack contracts
// const FLASH_LOAN_ATTACK_DEFENSE = import.meta.env.VITE_FLASH_LOAN_ATTACK_DEFENSE;
// const WHALE_MANIPULATION_ATTACK_DEFENSE = import.meta.env.VITE_WHALE_MANIPULATION_ATTACK_DEFENSE;
// const PROPOSAL_SPAM_ATTACK_DEFENSE = import.meta.env.VITE_PROPOSAL_SPAM_ATTACK_DEFENSE;
// const QUORUM_MANIPULATION_ATTACK_DEFENSE = import.meta.env.VITE_QUORUM_MANIPULATION_ATTACK_DEFENSE;
// const TIMELOCK_EXPLOIT_ATTACK_DEFENSE = import.meta.env.VITE_TIMELOCK_EXPLOIT_ATTACK_DEFENSE;

// // ============================================
// // Helper: Ensure address exists
// // ============================================
// function assertAddress(addr: string | undefined, name: string): string {
//   if (!addr) throw new Error(`Missing address for ${name}`);
//   return addr;
// }

// // ============================================
// // Governance Contracts
// // ============================================
// export const getGovernanceTokenContract = () => {
//   const addr = assertAddress(GOVERNANCE_TOKEN_ADDRESS, 'GovernanceToken');
//   return new ethers.Contract(addr, governanceTokenAbi.abi, signer);
// };

// export const getGovernorContract = (mode: 'vulnerable' | 'defense') => {
//   const addr = mode === 'vulnerable'
//     ? assertAddress(GOVERNOR_VULNERABLE_ADDRESS, 'GovernorVulnerable')
//     : assertAddress(GOVERNOR_DEFENSE_ADDRESS, 'GovernorWithDefenses');
//   const abi = mode === 'vulnerable' ? governorVulnerableAbi.abi : governorDefenseAbi.abi;
//   return new ethers.Contract(addr, abi, signer);
// };

// export const getTimelockContract = () => {
//   const addr = assertAddress(TIMELOCK_ADDRESS, 'Timelock');
//   return new ethers.Contract(addr, timelockAbi.abi, signer);
// };

// export const getTreasuryContract = () => {
//   const addr = assertAddress(MOCK_TREASURY_ADDRESS, 'MockTreasury');
//   return new ethers.Contract(addr, mockTreasuryAbi.abi, signer);
// };

// // ============================================
// // Attack Contracts (with defense mode selection)
// // ============================================
// export const getFlashLoanAttackContract = (defenseMode: boolean) => {
//   const addr = defenseMode
//     ? assertAddress(FLASH_LOAN_ATTACK_DEFENSE, 'FlashLoanAttackDefense')
//     : assertAddress(FLASH_LOAN_ATTACK_VULN, 'FlashLoanAttack');
//   return new ethers.Contract(addr, flashLoanAttackAbi.abi, signer);
// };

// export const getWhaleManipulationContract = (defenseMode: boolean) => {
//   const addr = defenseMode
//     ? assertAddress(WHALE_MANIPULATION_ATTACK_DEFENSE, 'WhaleManipulationDefense')
//     : assertAddress(WHALE_MANIPULATION_ATTACK_VULN, 'WhaleManipulation');
//   return new ethers.Contract(addr, whaleManipulationAbi.abi, signer);
// };

// export const getProposalSpamContract = (defenseMode: boolean) => {
//   const addr = defenseMode
//     ? assertAddress(PROPOSAL_SPAM_ATTACK_DEFENSE, 'ProposalSpamDefense')
//     : assertAddress(PROPOSAL_SPAM_ATTACK_VULN, 'ProposalSpam');
//   return new ethers.Contract(addr, proposalSpamAbi.abi, signer);
// };

// export const getQuorumManipulationContract = (defenseMode: boolean) => {
//   const addr = defenseMode
//     ? assertAddress(QUORUM_MANIPULATION_ATTACK_DEFENSE, 'QuorumManipulationDefense')
//     : assertAddress(QUORUM_MANIPULATION_ATTACK_VULN, 'QuorumManipulation');
//   return new ethers.Contract(addr, quorumManipulationAbi.abi, signer);
// };

// export const getTimelockExploitContract = (defenseMode: boolean) => {
//   const addr = defenseMode
//     ? assertAddress(TIMELOCK_EXPLOIT_ATTACK_DEFENSE, 'TimelockExploitDefense')
//     : assertAddress(TIMELOCK_EXPLOIT_ATTACK_VULN, 'TimelockExploit');
//   return new ethers.Contract(addr, timelockExploitAbi.abi, signer);
// };

// lib/web3.ts
import { ethers } from 'ethers';

// ============================================
// Environment Variables (fallback)
// ============================================
const RPC_URL = import.meta.env.VITE_ANVIL_RPC || 'http://127.0.0.1:8545';
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// ============================================
// Provider & Signer
// ============================================
export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// ============================================
// ABIs (import from JSON files)
// ============================================
import governanceTokenAbi from './abi/GovernanceToken.json';
import governorVulnerableAbi from './abi/GovernorVulnerable.json';
import governorDefenseAbi from './abi/GovernorWithDefenses.json';
import timelockAbi from './abi/Timelock.json';
import flashLoanAttackAbi from './abi/FlashLoanAttack.json';
import whaleManipulationAbi from './abi/WhaleManipulation.json';
import proposalSpamAbi from './abi/ProposalSpam.json';
import quorumManipulationAbi from './abi/QuorumManipulation.json';
import timelockExploitAbi from './abi/TimelockExploit.json';
import mockTreasuryAbi from './abi/MockTreasury.json';

// ============================================
// Default Contract Addresses (from .env)
// ============================================
const GOVERNANCE_TOKEN_ADDRESS = import.meta.env.VITE_GOVERNANCE_TOKEN_ADDRESS;
const GOVERNOR_VULNERABLE_ADDRESS = import.meta.env.VITE_GOVERNOR_VULNERABLE_ADDRESS;
const GOVERNOR_DEFENSE_ADDRESS = import.meta.env.VITE_GOVERNOR_DEFENSE_ADDRESS;
const TIMELOCK_ADDRESS = import.meta.env.VITE_TIMELOCK_ADDRESS;
const MOCK_TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS;

// Vulnerable attack contracts
const FLASH_LOAN_ATTACK_VULN = import.meta.env.VITE_FLASH_LOAN_ATTACK;
const WHALE_MANIPULATION_ATTACK_VULN = import.meta.env.VITE_WHALE_MANIPULATION;
const PROPOSAL_SPAM_ATTACK_VULN = import.meta.env.VITE_PROPOSAL_SPAM;
const QUORUM_MANIPULATION_ATTACK_VULN = import.meta.env.VITE_QUORUM_MANIPULATION;
const TIMELOCK_EXPLOIT_ATTACK_VULN = import.meta.env.VITE_TIMELOCK_EXPLOIT;

// Defense attack contracts
const FLASH_LOAN_ATTACK_DEFENSE = import.meta.env.VITE_FLASH_LOAN_ATTACK_DEFENSE;
const WHALE_MANIPULATION_ATTACK_DEFENSE = import.meta.env.VITE_WHALE_MANIPULATION_ATTACK_DEFENSE;
const PROPOSAL_SPAM_ATTACK_DEFENSE = import.meta.env.VITE_PROPOSAL_SPAM_ATTACK_DEFENSE;
const QUORUM_MANIPULATION_ATTACK_DEFENSE = import.meta.env.VITE_QUORUM_MANIPULATION_ATTACK_DEFENSE;
const TIMELOCK_EXPLOIT_ATTACK_DEFENSE = import.meta.env.VITE_TIMELOCK_EXPLOIT_ATTACK_DEFENSE;

function assertAddress(addr: string | undefined, name: string): string {
  if (!addr) throw new Error(`Missing address for ${name}`);
  return addr;
}

// ============================================
// Governance Contracts (use dynamic addresses)
// ============================================
export const getGovernanceTokenContract = (customAddress?: string) => {
  const addr = customAddress || assertAddress(GOVERNANCE_TOKEN_ADDRESS, 'GovernanceToken');
  return new ethers.Contract(addr, governanceTokenAbi.abi, signer);
};

export const getGovernorContract = (mode: 'vulnerable' | 'defense', customAddress?: string) => {
  let addr: string;
  if (customAddress) {
    addr = customAddress;
  } else {
    addr = mode === 'vulnerable'
      ? assertAddress(GOVERNOR_VULNERABLE_ADDRESS, 'GovernorVulnerable')
      : assertAddress(GOVERNOR_DEFENSE_ADDRESS, 'GovernorWithDefenses');
  }
  const abi = mode === 'vulnerable' ? governorVulnerableAbi.abi : governorDefenseAbi.abi;
  return new ethers.Contract(addr, abi, signer);
};

export const getTimelockContract = (customAddress?: string) => {
  const addr = customAddress || assertAddress(TIMELOCK_ADDRESS, 'Timelock');
  return new ethers.Contract(addr, timelockAbi.abi, signer);
};

export const getTreasuryContract = (customAddress?: string) => {
  const addr = customAddress || assertAddress(MOCK_TREASURY_ADDRESS, 'MockTreasury');
  return new ethers.Contract(addr, mockTreasuryAbi.abi, signer);
};

// ============================================
// Attack Contracts (with dynamic address support)
// ============================================
export const getFlashLoanAttackContract = (defenseMode: boolean, customAddress?: string) => {
  const addr = customAddress || (defenseMode
    ? assertAddress(FLASH_LOAN_ATTACK_DEFENSE, 'FlashLoanAttackDefense')
    : assertAddress(FLASH_LOAN_ATTACK_VULN, 'FlashLoanAttack'));
  return new ethers.Contract(addr, flashLoanAttackAbi.abi, signer);
};

export const getWhaleManipulationContract = (defenseMode: boolean, customAddress?: string) => {
  const addr = customAddress || (defenseMode
    ? assertAddress(WHALE_MANIPULATION_ATTACK_DEFENSE, 'WhaleManipulationDefense')
    : assertAddress(WHALE_MANIPULATION_ATTACK_VULN, 'WhaleManipulation'));
  return new ethers.Contract(addr, whaleManipulationAbi.abi, signer);
};

export const getProposalSpamContract = (defenseMode: boolean, customAddress?: string) => {
  const addr = customAddress || (defenseMode
    ? assertAddress(PROPOSAL_SPAM_ATTACK_DEFENSE, 'ProposalSpamDefense')
    : assertAddress(PROPOSAL_SPAM_ATTACK_VULN, 'ProposalSpam'));
  return new ethers.Contract(addr, proposalSpamAbi.abi, signer);
};

export const getQuorumManipulationContract = (defenseMode: boolean, customAddress?: string) => {
  const addr = customAddress || (defenseMode
    ? assertAddress(QUORUM_MANIPULATION_ATTACK_DEFENSE, 'QuorumManipulationDefense')
    : assertAddress(QUORUM_MANIPULATION_ATTACK_VULN, 'QuorumManipulation'));
  return new ethers.Contract(addr, quorumManipulationAbi.abi, signer);
};

export const getTimelockExploitContract = (defenseMode: boolean, customAddress?: string) => {
  const addr = customAddress || (defenseMode
    ? assertAddress(TIMELOCK_EXPLOIT_ATTACK_DEFENSE, 'TimelockExploitDefense')
    : assertAddress(TIMELOCK_EXPLOIT_ATTACK_VULN, 'TimelockExploit'));
  return new ethers.Contract(addr, timelockExploitAbi.abi, signer);
};