import { Router } from 'express';
import { DataService } from '../services/dataService';
import { scriptRunner } from '../index';

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

// Start simulation
router.post('/run', (req, res) => {
  const { scenario, defenseEnabled } = req.body;
  
  if (scriptRunner.isRunning()) {
    res.status(400).json({ error: 'Simulation already running' });
    return;
  }

  scriptRunner.runSimulation(scenario, defenseEnabled);
  res.json({ message: 'Simulation started', scenario: scenario || 'all', defenseEnabled: defenseEnabled || false });
});

// Stop simulation
router.post('/stop', (req, res) => {
  if (!scriptRunner.isRunning()) {
    res.status(400).json({ error: 'No simulation running' });
    return;
  }

  scriptRunner.stopSimulation();
  res.json({ message: 'Simulation stopped' });
});

// Check simulation status
router.get('/status', (req, res) => {
  res.json({ isRunning: scriptRunner.isRunning() });
});

export default router;
