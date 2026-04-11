// export interface AttackSuccessRateRow {
//   attackType: string;
//   noDefense: number;
//   basicDefense: number;
//   enhancedDefense: number;
// }

// export interface CostBenefitItem {
//   name: string;
//   cost: number;
//   success: number;
// }

// export interface DefenseRadarItem {
//   subject: string;
//   value: number;        // 防御效果评分 (0-100)
//   fullMark: number;
// }

// export interface ComparisonData {
//   matrix: AttackSuccessRateRow[];
//   costBenefit: CostBenefitItem[];
//   radar: DefenseRadarItem[];
//   recommendations: {
//     attackType: string;
//     roi: number;
//     cost: string;
//     profit: string;
//   }[];
// }
export interface AttackSuccessRateRow {
  attackType: string;
  noDefense: number;
  defense: number | null; 
}

export interface CostBenefitItem {
  name: string;
  cost: number;
  success: number;
}

export interface DefenseRadarItem {
  subject: string;
  value: number;        // 防御效果评分 (0-100)
  fullMark: number;
}

export interface ComparisonData {
  matrix: AttackSuccessRateRow[];
  costBenefit: CostBenefitItem[];
  radar: DefenseRadarItem[];
  recommendations: {
    attackType: string;
    roi: number;
    cost: string;
    profit: string;
  }[];
}