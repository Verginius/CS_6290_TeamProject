// import { ethers } from 'ethers';
// 导入 ABI 文件（下一步会创建）
// import governorVulnerableAbi from './abi/GovernorVulnerable.json';
// import governorDefenseAbi from './abi/GovernorWithDefenses.json';
// import tokenAbi from './abi/GovernanceToken.json';

// const RPC_URL = import.meta.env.VITE_ANVIL_RPC || 'http://127.0.0.1:8545';

// export const provider = new ethers.JsonRpcProvider(RPC_URL);

// // 使用 Anvil 第一个账户私钥（请替换为你实际的私钥）
// // 也可以后续让用户通过 MetaMask 连接，但测试阶段先用固定私钥
// const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
// export const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// // 获取治理合约实例（根据模式切换）
// export const getGovernorContract = (mode: 'vulnerable' | 'defense') => {
//   const address = mode === 'vulnerable'
//     ? import.meta.env.VITE_GOVERNOR_VULNERABLE_ADDRESS
//     : import.meta.env.VITE_GOVERNOR_DEFENSE_ADDRESS;
//   const abi = mode === 'vulnerable' ? governorVulnerableAbi : governorDefenseAbi;
//   if (!address) throw new Error(`Missing address for ${mode} governor`);
//   return new ethers.Contract(address, abi, signer);
// };

// // 获取代币合约实例
// export const getTokenContract = () => {
//   const address = import.meta.env.VITE_GOVERNANCE_TOKEN_ADDRESS;
//   if (!address) throw new Error('Missing token address');
//   return new ethers.Contract(address, tokenAbi, signer);
// };

import { ethers } from 'ethers';

const RPC_URL = import.meta.env.VITE_ANVIL_RPC || 'http://127.0.0.1:8545';

export const provider = new ethers.JsonRpcProvider(RPC_URL);

// 临时使用 Anvil 第一个账户私钥
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
export const signer = new ethers.Wallet(PRIVATE_KEY, provider);

// 获取治理合约实例（等合约部署后替换地址）
export const getGovernorContract = (mode: 'vulnerable' | 'defense') => {
  // 临时返回空，或使用一个测试合约地址
  const address = mode === 'vulnerable'
    ? import.meta.env.VITE_GOVERNOR_VULNERABLE_ADDRESS
    : import.meta.env.VITE_GOVERNOR_DEFENSE_ADDRESS;
  if (!address) {
    console.warn('Governor address not set, returning dummy contract');
    // 这里可以返回一个空代理，避免报错，或者直接抛出错误
    return null;
  }
  // 需要导入 ABI，等有了后再引入
  return null; // 占位
};