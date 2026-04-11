// lib/scenarios.ts

export interface ScenarioAddresses {
  governanceToken: string;
  governorVulnerable: string;
  governorDefense: string;
  timelock: string;
  treasury: string;
  // 可选：为每个场景单独部署的攻击合约地址（如果不同场景使用不同攻击合约）
  whaleAttackContract?: string;
  flashLoanAttackContract?: string;
  proposalSpamContract?: string;
  quorumManipulationContract?: string;
  timelockExploitContract?: string;
}

export interface Scenario {
  key: string;
  name: string;
  description: string;
  addresses: ScenarioAddresses;
}

// 从环境变量获取默认地址（fallback）
const DEFAULT_ADDRESSES: ScenarioAddresses = {
  governanceToken: import.meta.env.VITE_GOVERNANCE_TOKEN_ADDRESS || '',
  governorVulnerable: import.meta.env.VITE_GOVERNOR_VULNERABLE_ADDRESS || '',
  governorDefense: import.meta.env.VITE_GOVERNOR_DEFENSE_ADDRESS || '',
  timelock: import.meta.env.VITE_TIMELOCK_ADDRESS || '',
  treasury: import.meta.env.VITE_TREASURY_ADDRESS || '',
};

// 场景 A 地址（用户提供的新地址）
const SCENARIO_A_ADDRESSES: ScenarioAddresses = {
  governanceToken: "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f",
  governorVulnerable: "0x4A679253410272dd5232B3Ff7cF5dbB88f295319",
  governorDefense: "0x0000000000000000000000000000000000000000",
  timelock: "",
  treasury: "0x09635F643e140090A9A8Dcd712eD6285858ceBef",
};

// 场景 B-E
const SCENARIO_B_ADDRESSES: ScenarioAddresses = {
  governanceToken: "0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E",
  governorVulnerable: "0x84eA74d481Ee0A5332c457a4d796187F6Ba67fEB",
  governorDefense: "0x9E545E3C0baAB3E08CdfD552C960A1050f373042",
  timelock: "0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690",
  treasury: "0xf5059a5D33d5853360D16C683c16e67980206f36",
};

const SCENARIO_C_ADDRESSES: ScenarioAddresses = {
  governanceToken: "0x70e0bA845a1A0F2DA3359C97E0285013525FFC49",
  governorVulnerable: "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf",
  governorDefense: "0x0E801D84Fa97b50751Dbf25036d067dCf18858bF",
  timelock: "0x4826533B4897376654Bb4d4AD88B7faFD0C98528",
  treasury: "0x927b167526bAbB9be047421db732C663a0b77B11",
};
const SCENARIO_D_ADDRESSES: ScenarioAddresses = {
  governanceToken: "0x01c1DeF3b91672704716159C9041Aeca392DdFfb",
  governorVulnerable: "0x638A246F0Ec8883eF68280293FFE8Cfbabe61B44",
  governorDefense: "0x6C2d83262fF84cBaDb3e416D527403135D757892",
  timelock: "0x02b0B4EFd909240FCB2Eb5FAe060dC60D112E3a4",
  treasury: "0x56D13Eb21a625EdA8438F55DF2C31dC3632034f5",
};
const SCENARIO_E_ADDRESSES: ScenarioAddresses = {
  governanceToken: "0xE8addD62feD354203d079926a8e563BC1A7FE81e",
  governorVulnerable: "0x071586BA1b380B00B793Cc336fe01106B0BFbE6D",
  governorDefense: "0xe70f935c32dA4dB13e7876795f1e175465e6458e",
  timelock: "0xe039608E695D21aB11675EBBA00261A0e750526c",
  treasury: "0xA21DDc1f17dF41589BC6A5209292AED2dF61Cc94",
};

export const SCENARIOS: Record<string, Scenario> = {
  default: {
    key: 'default',
    name: 'Default (Current Deployment)',
    description: '使用当前环境变量中的地址',
    addresses: DEFAULT_ADDRESSES,
  },
  A: {
    key: 'A',
    name: 'Scenario A - Extreme Vulnerability',
    description: 'Single whale with 60% voting power, zero quorum, no timelock.',
    addresses: SCENARIO_A_ADDRESSES,
  },
  B: {
    key: 'B',
    name: 'Scenario B - Whale-Heavy Distribution',
    description: 'Top 3 whales hold 80% of tokens, 4% quorum, 2-day timelock.',
    addresses: SCENARIO_B_ADDRESSES,
  },
  C: {
    key: 'C',
    name: 'Scenario C - Distributed Holdings',
    description: 'Tokens evenly distributed across 100 addresses.',
    addresses: SCENARIO_C_ADDRESSES,
  },
  D: {
    key: 'D',
    name: 'Scenario D - Fair Governance',
    description: 'Gaussian distribution with median holdings.',
    addresses: SCENARIO_D_ADDRESSES,
  },
  E: {
    key: 'E',
    name: 'Scenario E - Paranoid Security',
    description: 'Equal distribution across 1000 addresses with max security.',
    addresses: SCENARIO_E_ADDRESSES,
  },
};

export const SCENARIO_LIST = Object.values(SCENARIOS);