// src/services/types/index.ts

// 概览页
export * from './home.types';

// 攻击模拟页
export * from './attack.types';

// 对比分析页
export * from './comparative.types';

// 治理监控页
export * from './governance.types';

// 经济分析页
export * from './economic.types';

// 防御实验室页
export * from './defense.types';

// 历史数据页
export * from './historical.types';

// 全局共用类型
export type Mode = 'baseline' | 'defense';
export type TimeRange = '1h' | '24h' | '7d' | '30d' | '90d' | 'custom';
export type Network = 'mainnet' | 'goerli' | 'anvil' | 'localhost';