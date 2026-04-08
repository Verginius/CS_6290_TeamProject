import json
import os
import re
import sys

def parse_forge_log(filepath):
    """Parse a raw foundry script log and extract attack simulation metrics."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    result = {
        "scenario": os.path.basename(filepath).replace(".json", ""), # temp name
        "target_dao": "Compound Finance",
        "governance_token": "COMP",
        "technical_framework": "Governor Bravo",
        "attacks": []
    }

    # Use regex to find lines containing results, e.g.:
    # Attack 1: Flash Loan Attack
    #   Status:  SUCCESS
    #   Amount Extracted:  xx
    #   Details:  xxxx

    attack_matches = re.finditer(r"Attack \d+: (.*?)\n\s*Status: \s*(SUCCESS|FAILED)\n\s*Amount Extracted: \s*(\d+)\n\s*Details: \s*(.*)", content)
    for m in attack_matches:
        attack_name = m.group(1).strip()
        status = m.group(2).strip()
        extracted = int(m.group(3).strip())
        details = m.group(4).strip()
        result["attacks"].append({
            "attackName": attack_name,
            "status": status,
            "isFlashLoanOrGovernanceTakeover": attack_name in ["Flash Loan Attack", "Whale Manipulation", "Quorum Manipulation"],
            "amountExtracted": extracted,
            "details": details
        })

    # Overall Success Rate line
    success_rate_match = re.search(r"Overall Success Rate:.*?(\d+)\s*%", content)
    if success_rate_match:
        result["overallSuccessRate"] = int(success_rate_match.group(1))
    
    return result

def main():
    raw_dir = "analysis/data/raw"
    processed_dir = "analysis/data/processed"

    if not os.path.exists(processed_dir):
        os.makedirs(processed_dir)

    for filename in os.listdir(raw_dir):
        if filename.startswith("attack_simulation_") and filename.endswith(".json"):
            filepath = os.path.join(raw_dir, filename)
            
            try:
                # Try to parse as raw forge execution log from stdout (saved as txt/json)
                parsed_data = parse_forge_log(filepath)
                
                # Match naming convention 
                scenario_suffix = ""
                m = re.search(r'_(A|B|C|D|E)\.json$', filename)
                if m:
                    scenario_suffix = f"_{m.group(1)}"
                
                out_name = f"extracted_metrics{scenario_suffix}.json"
                if "defended" in filename:
                    out_name = f"extracted_metrics_defended{scenario_suffix}.json"

                out_path = os.path.join(processed_dir, out_name)
                with open(out_path, 'w', encoding='utf-8') as out:
                    json.dump(parsed_data, out, indent=4)
                    
                print(f"Successfully processed {filename} -> {out_name}")
            except Exception as e:
                print(f"Failed to process {filename}: {e}")

if __name__ == "__main__":
    main()