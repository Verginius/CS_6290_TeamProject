// import { useEffect, useState } from 'react';
// import { provider } from '../lib/web3';
// import { ethers } from 'ethers';

// const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS; // 从 .env 读取

// export const useTreasury = () => {
//   const [balance, setBalance] = useState<string>('0');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchBalance = async () => {
//       try {
//         setLoading(true);
//         if (!TREASURY_ADDRESS) throw new Error('Treasury address not configured');
//         const bal = await provider.getBalance(TREASURY_ADDRESS);
//         setBalance(ethers.formatEther(bal));
//         setError(null);
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Failed to fetch treasury balance');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchBalance();
//     const interval = setInterval(fetchBalance, 10000); // 每10秒刷新
//     return () => clearInterval(interval);
//   }, []);

//   return { balance, loading, error };
// };
// src/hooks/useTreasury.ts
// import { useEffect, useState } from 'react';
// import { provider } from '../lib/web3';
// import { ethers } from 'ethers';

// const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS;

// export const useTreasury = () => {
//   const [balance, setBalance] = useState<string>('0');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchBalance = async () => {
//       try {
//         if (!TREASURY_ADDRESS) throw new Error('Treasury address not configured');
//         const bal = await provider.getBalance(TREASURY_ADDRESS);
//         setBalance(ethers.formatEther(bal));
//         setError(null);
//       } catch (err) {
//         console.error(err);
//         setError('Failed to fetch treasury balance');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchBalance();
//     const interval = setInterval(fetchBalance, 10000);
//     return () => clearInterval(interval);
//   }, []);

//   return { balance, loading, error };
// };

// src/hooks/useTreasury.ts
import { useEffect, useState } from 'react';
import { provider } from '../lib/web3';
import { ethers } from 'ethers';

const TREASURY_ADDRESS = import.meta.env.VITE_TREASURY_ADDRESS;

export const useTreasury = () => {
  const [balance, setBalance] = useState<string>('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (!TREASURY_ADDRESS) throw new Error('Treasury address not configured');
        // 直接获取 ETH 余额，不调用合约方法
        const bal = await provider.getBalance(TREASURY_ADDRESS);
        setBalance(ethers.formatEther(bal));
        setError(null);
      } catch (err) {
        console.error('Failed to fetch treasury balance', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch treasury balance');
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, []);

  return { balance, loading, error };
};