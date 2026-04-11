import fs from 'fs';
import path from 'path';

// Define the absolute paths to your data directories relative to this file
// Adjust if your backend logic is running elsewhere
const PROCESSED_DATA_DIR = path.resolve(__dirname, '../../../analysis/data/processed');

export class DataService {
  /**
   * Reads a JSON file safely from the processed data directory
   */
  public static readJsonFile(filename: string): any | null {
    const filePath = path.join(PROCESSED_DATA_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`[DataService] File not found: ${filePath}`);
      return null;
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(fileContent);
    } catch (error) {
      console.error(`[DataService] Failed to read or parse file ${filename}:`, error);
      return null;
    }
  }

  /**
   * Retrieves the latest Attack Simulation results
   */
  public static getAttackResults() {
    return this.readJsonFile('attack_simulation_results.json') || null;
  }

  /**
   * Retrieves the latest Defended Simulation results
   */
  public static getDefendedResults() {
    return this.readJsonFile('attack_simulation_defended_results.json') || null;
  }
}
