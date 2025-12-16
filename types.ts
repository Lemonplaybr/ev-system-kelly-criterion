export interface BetInputs {
  probability: number | string; // Allow string for empty input state
  houseOdd: number | string;
  stake: number | string;
}

export interface BetResult {
  fairOdd: number;
  evDecimal: number;
  evMonetary: number;
  isPositive: boolean;
  message: string;
}

export enum EVStatus {
  POSITIVE = "EV+ POSITIVO",
  NEGATIVE = "EV- NEGATIVO"
}

export interface KellyInputs {
  bankroll: number | string;   // Allow string for empty input state
  kellyFactor: number;         // Keep as number (select dropdown)
}

export interface KellyResult {
  fullKellyFraction: number;     // 1.0 Kelly %
  appliedKellyFraction: number;  // Applied %
  recommendedStake: number;      // Value in R$
  riskMessage: string;
}

export interface AggressivenessResult {
  level: string;
  suggestedFactor: number;
  actionMessage: string;
}