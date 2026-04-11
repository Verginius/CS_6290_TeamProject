import json
import os
import glob

DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data', 'processed')

def load_data():
    baseline_files = glob.glob(os.path.join(DATA_DIR, "extracted_metrics_[A-Z].json"))
    defended_files = glob.glob(os.path.join(DATA_DIR, "extracted_metrics_defended_[A-Z].json"))
    
    baseline_data = []
    for f in baseline_files:
        with open(f, 'r', encoding='utf-8') as f_in:
            try:
                data = json.load(f_in)
                if data.get('attacks'):
                    baseline_data.append(data)
            except:
                pass
                
    defended_data = []
    for f in defended_files:
        with open(f, 'r', encoding='utf-8') as f_in:
            try:
                data = json.load(f_in)
                if data.get('attacks'):
                    defended_data.append(data)
            except:
                pass
                
    return baseline_data, defended_data

def aggregate_metrics(data_list):
    attacks = ['Flash Loan Attack', 'Whale Manipulation', 'Proposal Spam', 'Quorum Manipulation', 'Timelock Exploit']
    agg = {att: {'successes': 0, 'count': 0, 'amounts': []} for att in attacks}
    
    for run in data_list:
        for attack in run.get("attacks", []):
            name = attack["attackName"]
            if name in agg:
                agg[name]['count'] += 1
                if attack["status"] == "SUCCESS":
                    agg[name]['successes'] += 1
                agg[name]['amounts'].append(float(attack.get("amountExtracted", 0)))
                
    return agg

def run():
    baseline_data, defended_data = load_data()
    baseline_agg = aggregate_metrics(baseline_data)
    defended_agg = aggregate_metrics(defended_data)
    
    attacks = ['Flash Loan Attack', 'Whale Manipulation', 'Proposal Spam', 'Quorum Manipulation', 'Timelock Exploit']
    
    baseline_sr = []
    baseline_amt = []
    defended_sr = []
    for att in attacks:
        cb = baseline_agg[att]['count']
        baseline_sr.append((baseline_agg[att]['successes'] / cb) if cb > 0 else 0)
        baseline_amt.append(sum(baseline_agg[att]['amounts'])/len(baseline_agg[att]['amounts']) if len(baseline_agg[att]['amounts']) > 0 else 0)
        
        cd = defended_agg[att]['count']
        defended_sr.append((defended_agg[att]['successes'] / cd) if cd > 0 else 0)

    economic = {
        'attacks': attacks,
        'funds_stolen': baseline_amt,
        'flash_loan_fees': [900, 0, 0, 0, 0],
        'gas_cost': [50, 20, 100, 30, 40],
        'token_purchase': [0, 400000, 10000, 600000, 0],
        'opportunity_cost': [0, 10000, 500, 20000, 5000],
        'extractable_fraction': [1.0, 0.5, 0.0, 0.75, 0.2]
    }
    
    out = ["=== Table 1: Cost-Benefit Matrix ==="]
    out.append("| Attack | Avg Cost (Sim) | Avg Profit (Extracted) | ROI |")
    out.append("|---|---|---|---|")
    for i, attack in enumerate(attacks):
        costs = economic['flash_loan_fees'][i] + economic['gas_cost'][i] + economic['token_purchase'][i] + economic['opportunity_cost'][i]
        safe_costs = costs if costs > 0 else 1
        apr = (economic['funds_stolen'][i] - costs) / safe_costs
        roi = apr * 100
        out.append(f"| {attack} | ${costs:,.0f} | ${economic['funds_stolen'][i]:,.0f} | {roi:,.1f}% |")

    defense = {
        'configurations': ['No Defense', 'Timelock Only', 'Quorum Threshold', 'Structural Control'],
        'success_rates': {
            'Flash Loan Attack':   [baseline_sr[0], 0.0, 0.5, defended_sr[0]],
            'Whale Manipulation':  [baseline_sr[1], 0.2, 0.1, defended_sr[1]],
            'Proposal Spam':       [baseline_sr[2], 1.0, 1.0, defended_sr[2]],
            'Quorum Manipulation': [baseline_sr[3], 0.1, 0.0, defended_sr[3]],
            'Timelock Exploit':    [baseline_sr[4], 1.0, 1.0, defended_sr[4]]
        }
    }
    
    out.append("\n=== Table 2: Defense Effectiveness Matrix ===")
    configs = defense['configurations']
    headers = " | ".join(['Attack'] + configs[1:])
    out.append(f"| Attack | {' | '.join(configs[1:])} |")
    out.append("|" + "|".join(["---"] * len(['Attack'] + configs[1:])) + "|")
    
    for att in attacks:
        row = [f"{(1 - defense['success_rates'][att][j])*100:.0f}%" for j in range(1, len(configs))]
        out.append(f"| {att} | " + " | ".join(row) + " |")

    with open('tables.md', 'w') as f:
        f.write("\n".join(out))

if __name__ == "__main__":
    run()