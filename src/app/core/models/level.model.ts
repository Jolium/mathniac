export interface LevelConfig {
  level: number;
  buttonCount: number;
  gridRows: number[];
  timerTicks: number;
  goalValue: number;
  scoreTarget: number;
  color: string;
  tier: 'green' | 'blue' | 'violet' | 'red' | 'silver';
}
