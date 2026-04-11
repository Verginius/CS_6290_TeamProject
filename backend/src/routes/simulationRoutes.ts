import { Router } from 'express';
import { DataService } from '../services/dataService';

const router = Router();

// Endpoint to fetch basic attack simulations
router.get('/attacks', (req, res) => {
  const result = DataService.getAttackResults();
  
  if (result) {
    res.json(result);
  } else {
    res.status(404).json({ error: 'Simulation data not found. Please wait for the script to generate.' });
  }
});

// Endpoint to fetch defended attack simulations
router.get('/defended', (req, res) => {
  const result = DataService.getDefendedResults();
  
  if (result) {
    res.json(result);
  } else {
    res.status(404).json({ error: 'Defended simulation data not found. Please wait for the script to generate.' });
  }
});

// Overall results summary combining both scenarios
router.get('/summary', (req, res) => {
  const attack = DataService.getAttackResults();
  const defended = DataService.getDefendedResults();

  res.json({
    metrics: {
        attackSimsAvailable: !!attack,
        defendedSimsAvailable: !!defended
    },
    data: {
        baseline: attack || {},
        defended: defended || {},
    }
  });
});

export default router;
