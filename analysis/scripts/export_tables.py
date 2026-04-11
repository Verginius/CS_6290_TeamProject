import sys
import os

sys.path.append(os.path.dirname(__file__))
from visualize_metrics import load_data, aggregate_metrics, build_full_data
import numpy as np

def run():
    baseline_data, defended_data = load_data()
    baseline_agg = aggregate_metrics(baseline_data)
    defended_agg = aggregate_metrics(defended_data)
    data = build_full_data(baseline_agg, defended_agg)

    print("=== Table 1: Cost-Benefit Matrix ===")
    eco = data['economic']
    costs = np.array(eco['flash_loan_fees']) + np.array(eco['gas_cost']) + np.array(eco['token_purchase']) + np.array(eco['opportunity_cost'])
    safe_costs = np.where(costs == 0, 1, costs)
    apr = (np.array(eco['funds_stolen']) - costs) / safe_costs
    
    print("| Attack | Avg Cost (Sim) | Avg Profit (Extracted) | ROI |")
    print("|---|---|---|---|")
    for i, attack in enumerate(eco['attacks']):
        roi = apr[i] * 100
        print(f"| {attack} | ${costs[i]:,.0f} | ${eco['funds_stolen'][i]:,.0f} | {roi:,.1f}% |")

    print("\n=== Table 2: Defense Effectiveness Matrix ===")
    df_data = data['defense']
    configs = df_data['configurations'] # ['No Defense', 'Timelock Only', 'Quorum Threshold', 'Structural Control']
    attacks = [a for a in df_data['success_rates'].keys()]
    
    headers = " | ".join(['Attack'] + configs[1:])
    print(f"| {headers} |")
    print("|" + "|".join(["---"] * len(['Attack'] + configs[1:])) + "|")
    
    for att in attacks:
        row = [f"{(1 - df_data['success_rates'][att][j])*100:.0f}%" for j in range(1, len(configs))]
        print(f"| {att} | " + " | ".join(row) + " |")

if __name__ == "__main__":
    run()