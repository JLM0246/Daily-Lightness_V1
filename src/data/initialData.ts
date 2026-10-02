import { BowelLog, RecommendationItem } from '../types';

export const PRESET_FOOD_OPTIONS = [
  { label: '고구마', type: 'good', desc: '식이섬유 풍부' },
  { label: '사과', type: 'good', desc: '펙틴 유산균 먹이' },
  { label: '키위', type: 'good', desc: '수분·소화 효소' },
  { label: '양배추·채소', type: 'good', desc: '장 점막 보호' },
  { label: '바나나', type: 'good', desc: '부드러운 섬유질' },
  { label: '미역·해조류', type: 'good', desc: '알긴산 윤활 작용' },
  { label: '요구르트·유산균', type: 'good', desc: '유익균 보충' },
  { label: '현미·잡곡밥', type: 'good', desc: '장 연동운동 자극' },
  { label: '물 충분히(1.5L+)', type: 'good', desc: '변을 부드럽게 함' },
  { label: '푸룬(건자두)', type: 'good', desc: '솔비톨 수분 흡수' },
  { label: '밀가루·빵·면', type: 'caution', desc: '소화 지연 주의' },
  { label: '기름진 고기·튀김', type: 'caution', desc: '수분 부족 유발' },
  { label: '커피·진한 차', type: 'caution', desc: '이뇨 작용으로 수분 감소' },
  { label: '맵고 짠 음식', type: 'caution', desc: '장 자극 주의' },
];

export const PRESET_HELPFUL_FOOD_OPTIONS = [
  '따뜻한 물(미온수)',
  '푸룬주스·푸룬',
  '사과양배추즙',
  '키위 1~2개',
  '요구르트·유산균',
  '차전자피',
  'ABC주스',
  '찐 고구마',
  '잘 익은 바나나',
  '올리브오일 1스푼',
  '미역·해조류',
  '오트밀·귀리',
];

export const INITIAL_RECOMMENDATIONS: RecommendationItem[] = [
  // 2일 이상 미배변: 소화 촉진 & 수분 보충
  {
    id: 'rec-2-1',
    minDays: 2,
    category: '소화 촉진 & 수분 보충',
    title: '제스프리 골드 키위 / 그린 키위',
    description: '액티니딘 소화 효소와 수용성 식이섬유가 풍부해 장에 수분을 채워주고 아침 배변을 부드럽게 도와줍니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%ED%82%A4%EC%9C%84',
    benefitText: '장의 수분을 늘리고 소화를 돕는 과일',
  },
  {
    id: 'rec-2-2',
    minDays: 2,
    category: '소화 촉진 & 수분 보충',
    title: '유기농 사과양배추즙 100%',
    description: '사과의 펙틴 성분과 양배추의 식이섬유가 만나 속을 편안하게 달래주며 자연스러운 장 움직임을 깨워줍니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%EC%82%AC%EA%B3%BC%EC%96%91%EB%B0%B0%EC%B6%94%EC%A6%99',
    benefitText: '속 쓰림 없이 장을 촉촉하게 적셔주는 즙',
  },
  {
    id: 'rec-2-3',
    minDays: 2,
    category: '소화 촉진 & 수분 보충',
    title: '농후발효유 그릭 요거트 & 프로바이오틱스',
    description: '장내 유익균을 늘려주고 장 환경을 따뜻하고 활발하게 만들어 배변 리듬을 되찾아 줍니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%EC%9A%94%EA%B5%AC%EB%A5%B4%ED%8A%B8+%EC%9C%A0%EC%82%B0%EA%B7%A0',
    benefitText: '유익균을 보충해 장 리듬을 깨우는 발효유',
  },
  {
    id: 'rec-2-4',
    minDays: 2,
    category: '소화 촉진 & 수분 보충',
    title: '국내산 꿀 무화과 / 반건조 무화과',
    description: '피신(Ficin) 효소와 펙틴이 풍부하여 간식처럼 맛있게 드시면서 소화를 돕기에 좋습니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%EB%AC%B4%ED%99%94%EA%B3%BC',
    benefitText: '부드러운 식감으로 소화를 촉진하는 자연 간식',
  },

  // 3일 이상 미배변: 팽창성 식이섬유 & 장 활성
  {
    id: 'rec-3-1',
    minDays: 3,
    category: '팽창성 식이섬유 & 장 활성',
    title: '차전자피 식이섬유 환 / 분말 스틱',
    description: '물과 만나면 40배까지 부풀어 올라 장벽을 부드럽게 자극하고, 딱딱해진 변의 부피를 늘려 밀어내 줍니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%EC%B0%A8%EC%A0%84%EC%9E%90%ED%94%BC+%EC%8B%9D%EC%9D%B4%EC%84%AC%EC%9C%A0',
    benefitText: '수분을 흡수해 변의 부피를 키워주는 식이섬유',
  },
  {
    id: 'rec-3-2',
    minDays: 3,
    category: '팽창성 식이섬유 & 장 활성',
    title: 'NFC 착즙 ABC 주스 (사과·비트·당근)',
    description: '건더기 식이섬유와 천연 과채 성분이 장 속에 머무는 노폐물을 부드럽게 정돈하고 배출을 유도합니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=ABC%EC%A3%BC%EC%8A%A4',
    benefitText: '세 가지 과채 섬유질로 장 활력을 높이는 주스',
  },
  {
    id: 'rec-3-3',
    minDays: 3,
    category: '팽창성 식이섬유 & 장 활성',
    title: '유기농 오트밀 & 잘 익은 바나나 세트',
    description: '귀리의 베타글루칸과 잘 익은 바나나의 올리고당이 장 속 수분을 붙잡아 변을 말랑하게 만들어 줍니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%EC%98%A4%ED%8A%B8%EB%B0%80+%EA%B7%80%EB%A6%AC',
    benefitText: '따뜻한 죽으로 드시기 좋은 팽창성 곡물 식단',
  },

  // 4일 이상 미배변: Fast-Relief & 삼투압 작용
  {
    id: 'rec-4-1',
    minDays: 4,
    category: 'Fast-Relief & 삼투압 작용',
    title: '테일러 푸룬주스 (건자두 농축 과즙)',
    description: '천연 솔비톨과 이사틴 성분이 장 속으로 수분을 끌어당기는 삼투압 작용을 해 묵직한 아랫배를 빠르게 비워줍니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%ED%91%B8%EB%A3%AC%EC%A3%BC%EC%8A%A4',
    benefitText: '변을 부드럽게 녹여주는 대표적인 쾌변 주스',
  },
  {
    id: 'rec-4-2',
    minDays: 4,
    category: 'Fast-Relief & 삼투압 작용',
    title: '테일러 딥워터 / 딥푸룬 오리지널',
    description: '일반 푸룬주스보다 더욱 진하게 농축된 솔비톨과 식이섬유가 들어 있어 4일째 답답한 날 공복에 드시기 좋습니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%ED%85%8C%EC%9D%BC%EB%9F%AC+%EB%94%A5%EC%9B%8C%ED%84%B0',
    benefitText: '공복 1병으로 빠른 신호를 돕는 진한 푸룬 음료',
  },
  {
    id: 'rec-4-3',
    minDays: 4,
    category: 'Fast-Relief & 삼투압 작용',
    title: '국내산 볶은 팽이버섯차 티백',
    description: '양배추의 2배 이상 풍부한 버섯 키토산과 식이섬유를 따뜻한 차로 우려내어 수분과 섬유질을 동시에 채워줍니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%ED%8C%BD%EC%9D%B4%EB%B2%84%EC%84%AF%EC%B0%A8',
    benefitText: '따뜻하게 마시며 장 운동을 깨우는 식이섬유 차',
  },

  // 5일 이상 미배변: 고농축 집중 케어
  {
    id: 'rec-5-1',
    minDays: 5,
    category: '고농축 집중 케어',
    title: '고농축 푸룬 딥 액티브 스틱 / 앰플',
    description: '5일 이상 지연되어 변이 단단해졌을 때, 고농축 푸룬 추출물과 유산균 배합으로 강한 수분 유입을 돕습니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%EA%B3%A0%EB%86%8D%EC%B6%95+%ED%91%B8%EB%A3%AC',
    benefitText: '오래 머문 변에 수분을 집중 공급하는 고농축 케어',
  },
  {
    id: 'rec-5-2',
    minDays: 5,
    category: '고농축 집중 케어',
    title: '유기농 냉압착 엑스트라버진 올리브오일',
    description: '아침 공복에 한 스푼 드시면 장 내부에 천연 윤활 코팅막을 형성하여 딱딱한 변이 미끄러지듯 나오도록 돕습니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%EC%97%91%EC%8A%A4%ED%8A%B8%EB%9D%BC%EB%B2%84%EC%A7%84+%EC%98%AC%EB%A6%AC%EB%B8%8C%EC%98%A4%EC%9D%BC',
    benefitText: '장 길을 매끄럽게 코팅해 주는 아침 공복 오일',
  },
  {
    id: 'rec-5-3',
    minDays: 5,
    category: '고농축 집중 케어',
    title: '액상 마그네슘 & 장 수분 밸런스 음료',
    description: '마그네슘 성분이 대장 내 수분 흡수를 도와 딱딱하게 굳은 변을 촉촉하고 부드러운 상태로 풀어줍니다.',
    coupangUrl: 'https://www.coupang.com/np/search?q=%EB%A7%88%EA%B7%B8%EB%84%A4%EC%8A%98+%EC%95%A1%EC%83%81',
    benefitText: '단단해진 변에 수분을 끌어당기는 마그네슘 음료',
  },
];

// Helper to create initial logs relative to current date (2026-10-02)
export function getInitialBowelLogs(todayStr: string): Record<string, BowelLog> {
  const baseDate = new Date(todayStr + 'T00:00:00');
  const formatOffset = (daysAgo: number) => {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - daysAgo);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Default seed state: Last bowel movement was 3 days ago so the user immediately sees
  // a realistic "3일째 미배변" dashboard and tailored recommendations, plus rich past logs.
  const d1 = formatOffset(1);
  const d3 = formatOffset(3);
  const d5 = formatOffset(5);
  const d7 = formatOffset(7);
  const d9 = formatOffset(9);
  const d11 = formatOffset(11);
  const d14 = formatOffset(14);

  return {
    [d1]: {
      date: d1,
      amount: 'small',
      hasBowelMovement: false,
      time: '',
      cycle: '2일 간격',
      foods: ['밀가루·빵·면', '커피·진한 차'],
      note: '점심에 칼국수를 먹고 물을 조금 적게 마셨음. 아랫배가 약간 묵직한 느낌.',
      aiFeedback: {
        summary: '어제는 밀가루 음식과 커피로 인해 장 속 수분이 다소 부족했던 하루였어요.',
        dietAnalysis:
          '칼국수 같은 밀가루 음식은 소화가 천천히 진행되고, 커피는 수분을 배출시켜 변이 조금 단단해질 수 있습니다.',
        waterAndHabitTip:
          '오늘 아침에는 미지근한 물 한 컵을 천천히 드시고, 배꼽 주변을 시계 방향으로 부드럽게 쓸어주시면 장이 한결 편안해집니다.',
        recommendedNextMeal: '찐 고구마, 사과양배추즙, 따뜻한 미역국',
      },
    },
    [d3]: {
      date: d3,
      amount: 'medium',
      hasBowelMovement: true,
      time: '09:00',
      cycle: '2일 간격',
      foods: ['고구마', '사과', '물 충분히(1.5L+)'],
      note: '오전 9시경 기분 좋게 배변 완료. 아침 산책 20분.',
      aiFeedback: {
        summary: '드신 고구마와 사과가 식이섬유를 가득 채워주어 오늘 원활한 배변에 큰 도움이 되었습니다!',
        dietAnalysis:
          '고구마의 식이섬유와 사과의 펙틴 성분이 충분한 수분과 만나 장을 부드럽게 깨워주었습니다.',
        waterAndHabitTip:
          '오늘처럼 오전 산책 20분과 따뜻한 물 섭취 습관을 이어가시면 매일 속이 편안하실 거예요.',
        recommendedNextMeal: '현미잡곡밥, 된장국, 키위 1개',
      },
    },
    [d5]: {
      date: d5,
      amount: 'large',
      hasBowelMovement: true,
      time: '08:20',
      cycle: '2일 간격',
      foods: ['현미·잡곡밥', '미역·해조류', '요구르트·유산균', '물 충분히(1.5L+)'],
      note: '미역국과 유산균을 챙겨 먹은 뒤 아주 시원하게 쾌변!',
      aiFeedback: {
        summary: '미역국과 유산균 덕분에 장이 촉촉해져서 아주 시원하고 건강한 배변을 하셨네요!',
        dietAnalysis:
          '해조류의 끈적한 알긴산 성분이 장 속 윤활유 역할을 해주고 유산균이 장 운동을 활발하게 도왔습니다.',
        waterAndHabitTip:
          '식후 30분 뒤 미지근한 물을 한 잔씩 나누어 드시면 좋은 리듬이 계속 유지됩니다.',
        recommendedNextMeal: '양배추찜, 두부조림, 잘 익은 바나나',
      },
    },
    [d7]: {
      date: d7,
      amount: 'small',
      hasBowelMovement: true,
      time: '10:15',
      cycle: '2일 간격',
      foods: ['기름진 고기·튀김', '사과'],
      note: '약간 힘겹게 소량만 봄.',
    },
    [d9]: {
      date: d9,
      amount: 'medium',
      hasBowelMovement: true,
      time: '08:45',
      cycle: '2일 간격',
      foods: ['키위', '양배추·채소', '현미·잡곡밥'],
      note: '컨디션 양호, 아침 식사 후 편안하게 배변.',
    },
    [d11]: {
      date: d11,
      amount: 'large',
      hasBowelMovement: true,
      time: '07:50',
      cycle: '3일 간격',
      foods: ['푸룬(건자두)', '요구르트·유산균', '물 충분히(1.5L+)'],
      note: '푸룬 간식 먹고 속이 아주 편해짐.',
    },
    [d14]: {
      date: d14,
      amount: 'medium',
      hasBowelMovement: true,
      time: '09:10',
      cycle: '2일 간격',
      foods: ['고구마', '바나나', '물 충분히(1.5L+)'],
      note: '보통 상태로 편안하게 봄.',
    },
  };
}
