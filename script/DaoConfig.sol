// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

library DaoConfig {
    enum DaoType {
        COMPOUND,
        UNISWAP,
        AAVE
    }

    struct DaoParameters {
        string name;
        uint256 totalSupply;
        uint256 proposalThresholdBps;
        uint256 quorumBps;
        uint256 votingDelay;
        uint256 votingPeriod;
        uint256 timelockDelay;
        uint256 maxSafeVolume;
    }

    function getParameters(DaoType daoType) internal pure returns (DaoParameters memory) {
        if (daoType == DaoType.COMPOUND) {
            return DaoParameters({
                name: "Compound",
                totalSupply: 10_000_000e18,
                proposalThresholdBps: 250,
                quorumBps: 4000,
                votingDelay: 1,
                votingPeriod: 50400,
                timelockDelay: 172800,
                maxSafeVolume: 50_000e18
            });
        } else if (daoType == DaoType.UNISWAP) {
            return DaoParameters({
                name: "Uniswap",
                totalSupply: 1_000_000_000e18,
                proposalThresholdBps: 250,
                quorumBps: 4000,
                votingDelay: 1,
                votingPeriod: 50400,
                timelockDelay: 172800,
                maxSafeVolume: 2_500_000e18
            });
        } else if (daoType == DaoType.AAVE) {
            return DaoParameters({
                name: "Aave",
                totalSupply: 16_000_000e18,
                proposalThresholdBps: 100,
                quorumBps: 3200,
                votingDelay: 1,
                votingPeriod: 43200,
                timelockDelay: 172800,
                maxSafeVolume: 20_000e18
            });
        }

        revert("Unknown DAO type");
    }

    function fromString(string memory daoName) internal pure returns (DaoType) {
        if (_stringsEqual(daoName, "COMPOUND")) {
            return DaoType.COMPOUND;
        } else if (_stringsEqual(daoName, "UNISWAP")) {
            return DaoType.UNISWAP;
        } else if (_stringsEqual(daoName, "AAVE")) {
            return DaoType.AAVE;
        }

        revert("Invalid DAO name");
    }

    function _stringsEqual(string memory a, string memory b) internal pure returns (bool) {
        return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
    }
}