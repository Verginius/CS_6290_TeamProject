// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";

/**
 * @title ExportDefendedData
 * @dev Exports real simulation output from raw JSON into processed JSON.
 *
 * Expected producer:
 *   script/SimulateAttacks.s.sol writes ./analysis/data/raw/attack_simulation_defended_raw.json
 */
contract ExportDefendedData is Script {
    string private constant DEFAULT_RAW_INPUT_FILE = "./analysis/data/raw/attack_simulation_defended_raw.json";
    string private constant OUTPUT_FILE = "./analysis/data/processed/attack_simulation_defended_results.json";

    function run() external {
        console.log("[EXPORTING ATTACK DATA TO JSON]");

        string memory inputFile =
            vm.envExists("RAW_INPUT_FILE") ? vm.envString("RAW_INPUT_FILE") : DEFAULT_RAW_INPUT_FILE;

        string memory rawJson;
        // forge-lint: disable-next-line(unsafe-cheatcode)
        try vm.readFile(inputFile) returns (string memory content) {
            rawJson = content;
        } catch {
            revert("ExportDefendedData: raw simulation JSON not found; run SimulateAttacks first or set RAW_INPUT_FILE");
        }

        // forge-lint: disable-next-line(unsafe-cheatcode)
        vm.writeFile(OUTPUT_FILE, rawJson);

        console.log("Source file: ", inputFile);
        console.log("Processed file: ", OUTPUT_FILE);
        console.log("Export completed successfully!");
    }
}

