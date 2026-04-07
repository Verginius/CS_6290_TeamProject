import { useEffect, useState } from "react";
import { provider } from "../lib/web3";
import {
  getFlashLoanAttackContract,
  getWhaleManipulationContract
} from "../lib/web3";

export const useRecentAttacks = () => {

  const [attacks, setAttacks] = useState<
    Array<{ name: string; block: number }>
  >([]);

  useEffect(() => {

    const fetchAttacks = async () => {

      try {

        const flash = getFlashLoanAttackContract(false);
        const whale = getWhaleManipulationContract(false);

        const addresses = [
          await flash.getAddress(),
          await whale.getAddress()
        ];

        const latest = await provider.getBlockNumber();

        const logs = await provider.getLogs({
          address: addresses,
          fromBlock: latest - 200,
          toBlock: latest
        });

        const result = logs.slice(-5).map((log) => ({
          name: log.address === addresses[0]
            ? "Flash Loan Attack"
            : "Whale Manipulation",
          block: log.blockNumber
        }));

        setAttacks(result.reverse());

      } catch (err) {

        console.error("Failed to fetch attacks", err);

      }

    };

    fetchAttacks();

  }, []);

  return attacks;

};