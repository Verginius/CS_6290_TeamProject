import pandas as pd
import matplotlib.pyplot as plt

df = pd.read_csv('COMP_UniswapV3_Liquidity.csv')
initial_price = 17.00

target_volumes = [10000, 50000, 100000, 200000, 300000, 400000]
slippage_results = []
cost_results = []

for target in target_volumes:
    remaining = target
    total_cost = 0
    
    for index, row in df.iterrows():
        if remaining <= 0:
            break
        buy_amount = min(remaining, row['Available_COMP_Liquidity'])
        total_cost += buy_amount * row['Price_USD']
        remaining -= buy_amount
        
    avg_price = total_cost / target
    slippage_pct = ((avg_price - initial_price) / initial_price) * 100
    
    slippage_results.append(slippage_pct)
    cost_results.append(total_cost)

print("--- COMP Governance Attack: Slippage Analysis ---")
for i in range(len(target_volumes)):
    print(f"Buy Volume: {target_volumes[i]:,} COMP | Avg Price: ${cost_results[i]/target_volumes[i]:.2f} | Slippage: {slippage_results[i]:.2f}% | Total Cost: ${cost_results[i]:,.2f}")

plt.figure(figsize=(10, 6))
plt.plot(target_volumes, slippage_results, marker='o', color='red', linewidth=2)
plt.title('Compound (COMP) Slippage-to-Volume Curve on Uniswap V3', fontsize=14)
plt.xlabel('Volume of COMP Purchased (Tokens)', fontsize=12)
plt.ylabel('Price Slippage (%)', fontsize=12)
plt.grid(True, linestyle='--', alpha=0.7)
plt.fill_between(target_volumes, slippage_results, color='red', alpha=0.1)

plt.savefig('Slippage-to-Volume_Curve.png')
plt.show()