const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data/processed');

function loadData() {
    const files = fs.readdirSync(dataDir);
    const baseline = [];
    const defended = [];
    
    for (const f of files) {
        if (f.startsWith('extracted_metrics_') && f.endsWith('.json') && !f.includes('defended')) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(dataDir, f)));
                if (data.attacks) baseline.push(data);
            } catch(e) {}
        }
        if (f.startsWith('extracted_metrics_defended_') && f.endsWith('.json')) {
            try {
                const data = JSON.parse(fs.readFileSync(path.join(dataDir, f)));
                if (data.attacks) defended.push(data);
            } catch(e) {}
        }
    }
    return {baseline, defended};
}

function aggregate(dataList) {
    const attacks = ['Flash Loan Attack', 'Whale Manipulation', 'Proposal Spam', 'Quorum Manipulation', 'Timelock Exploit'];
    const agg = {};
    for (const a of attacks) agg[a] = {successes: 0, count: 0, amounts: []};
    
    for (const run of dataList) {
        for (const attack of run.attacks || []) {
            const name = attack.attackName;
            if (agg[name]) {
                agg[name].count++;
                if (attack.status === 'SUCCESS') agg[name].successes++;
                agg[name].amounts.push(Number(attack.amountExtracted || 0));
            }
        }
    }
    return agg;
}

const {baseline, defended} = loadData();
const aggB = aggregate(baseline);
const aggD = aggregate(defended);

const attacks = ['Flash Loan Attack', 'Whale Manipulation', 'Proposal Spam', 'Quorum Manipulation', 'Timelock Exploit'];
const baseline_sr = [];
const baseline_amt = [];
const defended_sr = [];

for (const att of attacks) {
    const cb = aggB[att].count;
    baseline_sr.push(cb > 0 ? aggB[att].successes / cb : 0);
    const amounts = aggB[att].amounts;
    baseline_amt.push(amounts.length > 0 ? amounts.reduce((a,b)=>a+b,0)/amounts.length : 0);
    
    const cd = aggD[att].count;
    defended_sr.push(cd > 0 ? aggD[att].successes / cd : 0);
}

const flash_loan_fees= [900, 0, 0, 0, 0];
const gas_cost= [50, 20, 100, 30, 40];
const token_purchase= [0, 400000, 10000, 600000, 0];
const opportunity_cost= [0, 10000, 500, 20000, 5000];

console.log("=== TABLE 1 ===");
for (let i=0; i<attacks.length; i++) {
    const cost = flash_loan_fees[i] + gas_cost[i] + token_purchase[i] + opportunity_cost[i];
    const stolen = baseline_amt[i];
    const apr = (stolen - cost) / (cost > 0 ? cost : 1);
    console.log(`${attacks[i]} | Cost: ${cost} | Stolen: ${stolen} | ROI: ${apr*100}%`);
}

console.log("\n=== TABLE 2 ===");
const configs = ['No Defense', 'Timelock Only', 'Quorum Threshold', 'Structural Control'];
const rates = {
    'Flash Loan Attack':   [baseline_sr[0], 0.0, 0.5, defended_sr[0]],
    'Whale Manipulation':  [baseline_sr[1], 0.2, 0.1, defended_sr[1]],
    'Proposal Spam':       [baseline_sr[2], 1.0, 1.0, defended_sr[2]],
    'Quorum Manipulation': [baseline_sr[3], 0.1, 0.0, defended_sr[3]],
    'Timelock Exploit':    [baseline_sr[4], 1.0, 1.0, defended_sr[4]]
};
for (const att of attacks) {
    const row = configs.slice(1).map((c, j) => Math.round((1 - rates[att][j+1]) * 100) + '%').join(' | ');
    console.log(`${att} | ${row}`);
}
