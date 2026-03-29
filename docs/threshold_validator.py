# M3 Threshold Validation Script
# Author: QI Nan (Data Analyst Role)

class CircuitBreakerSimulator:
    def __init__(self, safe_threshold):
        self.safe_threshold = safe_threshold
        self.trigger_count = 0
        self.passed_count = 0

    def process_transaction(self, tx_id, amount_comp, is_governance_action):
        print(f"[Tx {tx_id}] Processing {amount_comp:,} COMP...")
        
        if amount_comp > self.safe_threshold:
            print(f"  -> 🚨 ALARM! Circuit Breaker Triggered. Flash loan attack suspected.")
            if is_governance_action:
                print("  -> ⛔ ACTION BLOCKED: Governance proposal reverted.")
            self.trigger_count += 1
            return False
        else:
            print("  -> ✅ Passed. Normal volume detected.")
            if is_governance_action:
                print("  -> 🟢 ACTION ALLOWED: Governance proposal submitted.")
            self.passed_count += 1
            return True

print("=== Initializing Volume-Based Defense Mechanism ===")
MAX_SAFE_VOLUME = 50000 
defender = CircuitBreakerSimulator(safe_threshold=MAX_SAFE_VOLUME)

test_transactions = [
    {"id": "0x1A", "amount": 1000, "gov_action": False, "desc": "Normal Retail Buy"},
    {"id": "0x2B", "amount": 10000, "gov_action": False, "desc": "Whale Swap (from M2 baseline)"},
    {"id": "0x3C", "amount": 400000, "gov_action": True, "desc": "M1 Simulated Quorum Flash Loan"},
    {"id": "0x4D", "amount": 150000, "gov_action": True, "desc": "Partial Attack Attempt"}
]

print("\n=== Running Simulation ===")
for tx in test_transactions:
    print(f"\nScenario: {tx['desc']}")
    defender.process_transaction(tx["id"], tx["amount"], tx["gov_action"])

print("\n=== Validation Summary ===")
print(f"Threshold Set: {MAX_SAFE_VOLUME:,} COMP")
print(f"Transactions Blocked: {defender.trigger_count}")
print(f"Transactions Passed: {defender.passed_count}")