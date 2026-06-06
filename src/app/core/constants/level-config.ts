import { LevelConfig } from '../models/level.model';

// timerTicks: 100ms per tick (e.g. 300 ticks = 30 seconds)
// gridRows: number of buttons per row, must sum to buttonCount
export const LEVEL_CONFIGS: LevelConfig[] = [
  { level: 1,  buttonCount: 12, gridRows: [2,4,4,2], timerTicks: 300, goalValue: 10, scoreTarget: 130, color: '#008000', tier: 'green'  },
  { level: 2,  buttonCount: 12, gridRows: [2,4,4,2], timerTicks: 350, goalValue: 11, scoreTarget: 150, color: '#008000', tier: 'green'  },
  { level: 3,  buttonCount: 12, gridRows: [2,4,4,2], timerTicks: 400, goalValue: 12, scoreTarget: 170, color: '#008000', tier: 'green'  },
  { level: 4,  buttonCount: 14, gridRows: [3,4,4,3], timerTicks: 400, goalValue: 13, scoreTarget: 200, color: '#0000FF', tier: 'blue'   },
  { level: 5,  buttonCount: 14, gridRows: [3,4,4,3], timerTicks: 450, goalValue: 14, scoreTarget: 230, color: '#0000FF', tier: 'blue'   },
  { level: 6,  buttonCount: 14, gridRows: [3,4,4,3], timerTicks: 500, goalValue: 15, scoreTarget: 260, color: '#0000FF', tier: 'blue'   },
  { level: 7,  buttonCount: 14, gridRows: [3,4,4,3], timerTicks: 550, goalValue: 16, scoreTarget: 290, color: '#0000FF', tier: 'blue'   },
  { level: 8,  buttonCount: 16, gridRows: [2,4,4,4,2], timerTicks: 500, goalValue: 17, scoreTarget: 330, color: '#9400D3', tier: 'violet' },
  { level: 9,  buttonCount: 16, gridRows: [2,4,4,4,2], timerTicks: 550, goalValue: 18, scoreTarget: 370, color: '#9400D3', tier: 'violet' },
  { level: 10, buttonCount: 16, gridRows: [2,4,4,4,2], timerTicks: 600, goalValue: 19, scoreTarget: 410, color: '#9400D3', tier: 'violet' },
  { level: 11, buttonCount: 16, gridRows: [2,4,4,4,2], timerTicks: 650, goalValue: 20, scoreTarget: 450, color: '#9400D3', tier: 'violet' },
  { level: 12, buttonCount: 18, gridRows: [3,4,4,4,3], timerTicks: 600, goalValue: 21, scoreTarget: 500, color: '#FF0000', tier: 'red'    },
  { level: 13, buttonCount: 18, gridRows: [3,4,4,4,3], timerTicks: 650, goalValue: 22, scoreTarget: 550, color: '#FF0000', tier: 'red'    },
  { level: 14, buttonCount: 18, gridRows: [3,4,4,4,3], timerTicks: 700, goalValue: 23, scoreTarget: 600, color: '#FF0000', tier: 'red'    },
  { level: 15, buttonCount: 18, gridRows: [3,4,4,4,3], timerTicks: 750, goalValue: 24, scoreTarget: 0,   color: '#C0C0C0', tier: 'silver' },
];
