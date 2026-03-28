// import { ethers } from 'ethers';

// const RPC_URL = import.meta.env.VITE_ANVIL_RPC || 'http://127.0.0.1:8545';

// export const provider = new ethers.JsonRpcProvider(RPC_URL);

// // 临时使用 Anvil 第一个账户私钥
// const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
// export const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// // 获取治理合约实例（等合约部署后替换地址）
// export const getGovernorContract = (mode: 'vulnerable' | 'defense') => {
//   // 临时返回空，或使用一个测试合约地址
//   const address = mode === 'vulnerable'
//     ? import.meta.env.VITE_GOVERNOR_VULNERABLE_ADDRESS
//     : import.meta.env.VITE_GOVERNOR_DEFENSE_ADDRESS;
//   if (!address) {
//     console.warn('Governor address not set, returning dummy contract');
//     // 这里可以返回一个空代理，避免报错，或者直接抛出错误
//     return null;
//   }
//   // 需要导入 ABI，等有了后再引入
//   return null; // 占位
// };

import { ethers } from 'ethers';

// ============================================
// 环境变量读取
// ============================================
const RPC_URL = import.meta.env.VITE_ANVIL_RPC || 'http://127.0.0.1:8545';
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
// ============================================
// Provider & Signer
// ============================================
export const provider = new ethers.JsonRpcProvider(RPC_URL);
export const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// ============================================
// ABI 导入（需要提前将 JSON 文件放入 src/lib/abi/ 目录）
// ============================================
// 治理核心合约
import governanceTokenAbi from './abi/GovernanceToken.json';
import governorVulnerableAbi from './abi/GovernorVulnerable.json';
import governorDefenseAbi from './abi/GovernorWithDefenses.json';
import timelockAbi from './abi/Timelock.json';

// Mock 合约
import mockTreasuryAbi from './abi/MockTreasury.json';

// 攻击合约
import flashLoanAttackAbi from './abi/FlashLoanAttack.json';
import whaleManipulationAbi from './abi/WhaleManipulation.json';
import proposalSpamAbi from './abi/ProposalSpam.json';
import quorumManipulationAbi from './abi/QuorumManipulation.json';
import timelockExploitAbi from './abi/TimelockExploit.json';

// ============================================
// 合约地址（从 .env 读取）
// ============================================
const GOVERNANCE_TOKEN_ADDRESS = import.meta.env.VITE_GOVERNANCE_TOKEN_ADDRESS;
const GOVERNOR_VULNERABLE_ADDRESS = import.meta.env.VITE_GOVERNOR_VULNERABLE_ADDRESS;
const GOVERNOR_DEFENSE_ADDRESS = import.meta.env.VITE_GOVERNOR_DEFENSE_ADDRESS;
const TIMELOCK_ADDRESS = import.meta.env.VITE_TIMELOCK_ADDRESS;
const MOCK_TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS; // MockTreasury 即国库地址

const FLASH_LOAN_ATTACK_ADDRESS = import.meta.env.VITE_FLASH_LOAN_ATTACK;
const WHALE_MANIPULATION_ADDRESS = import.meta.env.VITE_WHALE_MANIPULATION;
const PROPOSAL_SPAM_ADDRESS = import.meta.env.VITE_PROPOSAL_SPAM;
const QUORUM_MANIPULATION_ADDRESS = import.meta.env.VITE_QUORUM_MANIPULATION;
const TIMELOCK_EXPLOIT_ADDRESS = import.meta.env.VITE_TIMELOCK_EXPLOIT;

// ============================================
// 辅助函数：检查地址是否存在
// ============================================
function assertAddress(address: string | undefined, name: string): string {
  if (!address) throw new Error(`Missing address for ${name}`);
  return address;
}

// ============================================
// 核心治理合约工厂
// ============================================
export const getGovernanceTokenContract = () => {
  const address = assertAddress(GOVERNANCE_TOKEN_ADDRESS, 'GovernanceToken');
  return new ethers.Contract(address, governanceTokenAbi.abi, signer);
};

export const getGovernorContract = (mode: 'vulnerable' | 'defense') => {
  const address = mode === 'vulnerable'
    ? assertAddress(GOVERNOR_VULNERABLE_ADDRESS, 'GovernorVulnerable')
    : assertAddress(GOVERNOR_DEFENSE_ADDRESS, 'GovernorWithDefenses');
  const abi = mode === 'vulnerable' ? governorVulnerableAbi.abi : governorDefenseAbi.abi;
  return new ethers.Contract(address, abi, signer);
};

export const getTimelockContract = () => {
  const address = assertAddress(TIMELOCK_ADDRESS, 'Timelock');
  return new ethers.Contract(address, timelockAbi.abi, signer);
};

// ============================================
// Mock 合约工厂
// ============================================
export const getTreasuryContract = () => {
  const address = assertAddress(MOCK_TREASURY_ADDRESS, 'MockTreasury');
  return new ethers.Contract(address, mockTreasuryAbi.abi, signer);
};

// ============================================
// 攻击合约工厂
// ============================================
export const getFlashLoanAttackContract = () => {
  const address = assertAddress(FLASH_LOAN_ATTACK_ADDRESS, 'FlashLoanAttack');
  return new ethers.Contract(address, flashLoanAttackAbi.abi, signer);
};

export const getWhaleManipulationContract = () => {
  const address = assertAddress(WHALE_MANIPULATION_ADDRESS, 'WhaleManipulation');
  return new ethers.Contract(address, whaleManipulationAbi.abi, signer);
};

export const getProposalSpamContract = () => {
  const address = assertAddress(PROPOSAL_SPAM_ADDRESS, 'ProposalSpam');
  return new ethers.Contract(address, proposalSpamAbi.abi, signer);
};

export const getQuorumManipulationContract = () => {
  const address = assertAddress(QUORUM_MANIPULATION_ADDRESS, 'QuorumManipulation');
  return new ethers.Contract(address, quorumManipulationAbi.abi, signer);
};

export const getTimelockExploitContract = () => {
  const address = assertAddress(TIMELOCK_EXPLOIT_ADDRESS, 'TimelockExploit');
  return new ethers.Contract(address, timelockExploitAbi.abi, signer);
};