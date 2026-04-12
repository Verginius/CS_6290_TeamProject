import { ethers } from 'ethers';

const RPC_URL = 'http://127.0.0.1:8545'; // Anvil 默认

const provider = new ethers.JsonRpcProvider(RPC_URL);

export async function getChainInfo() {
  try {
    const blockNumber = await provider.getBlockNumber();
    const network = await provider.getNetwork();

    return {
      blockNumber,
      chainId: Number(network.chainId),
      connected: true,
    };
  } catch (e) {
    return {
      blockNumber: 0,
      chainId: 0,
      connected: false,
    };
  }
}