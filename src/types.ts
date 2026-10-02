export type BowelAmount = 'small' | 'medium' | 'large';

export interface RecommendedFoodItem {
  id: string;
  name: string;
  emoji: string;
  reason: string;
  tag: string;
}

export interface MealIdea {
  breakfast: string;
  snack: string;
  lunch: string;
  dinner: string;
}

export interface AIFeedbackResult {
  summary: string;
  dietAnalysis?: string;
  waterAndHabitTip?: string;
  recommendedNextMeal?: string;
  bowelStatusHeadline?: string; // e.g. "2~3일 간격이에요."
  bowelStatusTip?: string; // e.g. "조금 더 자주 확인해 주세요."
  cycleAnalysisText?: string;
  dietTrendText?: string;
  recommendedFoods?: RecommendedFoodItem[];
  todayActionTip?: string; // e.g. "오늘은 물을 조금 더 챙겨 마셔보세요. 💧"
  mealIdea?: MealIdea;
  aiTip?: string;
}

export interface BowelLog {
  date: string; // YYYY-MM-DD
  amount: BowelAmount;
  hasBowelMovement?: boolean; // true when bowel movement occurred, false if only diet/memo logged
  time?: string; // 배변 시간 (e.g. '08:30' or '오전 8시 30분')
  cycle?: string; // 배변 주기 (e.g. '1일 주기', '2일 주기', '3일 주기')
  foods: string[]; // 배변 전 먹은 음식
  helpfulFoods?: string[]; // 배변에 도움이 된 음식 또는 주스
  note: string;
  aiFeedback?: AIFeedbackResult;
}

export interface RecommendationItem {
  id: string;
  minDays: number; // 2 | 3 | 4 | 5
  category: string;
  title: string;
  description: string;
  coupangUrl: string;
  benefitText?: string;
}
