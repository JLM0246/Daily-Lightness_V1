/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Plus,
  Trash2,
  Check,
  AlertTriangle,
  HeartHandshake,
  Utensils,
  Droplets,
  ShieldAlert,
  Lock,
  RotateCcw,
  Clock,
  CheckCircle2,
  ShoppingBag,
  Settings,
  Link as LinkIcon,
  X,
  Edit3,
  Info,
  CheckCheck,
} from 'lucide-react';
import {
  BowelAmount,
  BowelLog,
  RecommendationItem,
  AIFeedbackResult,
  RecommendedFoodItem,
} from './types';
import {
  PRESET_FOOD_OPTIONS,
  PRESET_HELPFUL_FOOD_OPTIONS,
  INITIAL_RECOMMENDATIONS,
  getInitialBowelLogs,
} from './data/initialData';

const STORAGE_KEY_LOGS = 'senior_bowel_care_logs_v6';
const STORAGE_KEY_RECS = 'senior_bowel_care_recs_v6';
const STORAGE_KEY_EATEN_FOODS = 'senior_bowel_care_eaten_foods_v3';
const TODAY_STR = '2026-10-02';
const ADMIN_PIN = '0246';

// 3 Bottom Navigation Tabs: 1. 배변 달력, 2. AI분석, 3. 맞춤 추천
type MobileTab = 'calendar' | 'ai' | 'recommend';

const CYCLE_OPTIONS = ['매일 (1일 간격)', '2일 간격', '3일 간격', '4일 이상 간격'];

// Senior 3 Simple Foods
const SENIOR_TOP_3_FOODS: RecommendedFoodItem[] = [
  {
    id: 'kiwi',
    name: '키위',
    emoji: '🥝',
    reason: '식이섬유를 챙길 수 있어요.',
    tag: '과일',
  },
  {
    id: 'sweet_potato',
    name: '고구마',
    emoji: '🍠',
    reason: '식이섬유가 들어 있어요.',
    tag: '식이섬유',
  },
  {
    id: 'oatmeal',
    name: '오트밀',
    emoji: '🥣',
    reason: '간편하게 먹기 좋아요.',
    tag: '통곡물',
  },
];

function buildLocalFallbackFeedback(
  amount: BowelAmount,
  hasBowelMovement: boolean,
  foods: string[],
  previousDayFoods: string[],
  elapsedDays: number,
  totalBowelCount: number,
  avgIntervalDays: number = 2.5
): AIFeedbackResult {
  const isDelay = elapsedDays >= 3;
  const isEnoughRecords = totalBowelCount >= 2;

  let bowelStatusHeadline = '2~3일 간격이에요.';
  let bowelStatusTip = '조금 더 자주 확인해 주세요.';

  if (!isEnoughRecords) {
    bowelStatusHeadline = '아직 기록이 많지 않아요.';
    bowelStatusTip = '며칠 더 기록해주시면 배변 주기를 알려드릴게요.';
  } else if (isDelay) {
    bowelStatusHeadline = '2~3일 간격이에요.';
    bowelStatusTip = '조금 더 자주 확인해 주세요.';
  } else if (avgIntervalDays <= 1.5) {
    bowelStatusHeadline = '비교적 일정해요.';
    bowelStatusTip = '지금처럼 관리해보세요.';
  } else {
    bowelStatusHeadline = '비교적 일정해요.';
    bowelStatusTip = '지금처럼 관리해보세요.';
  }

  // Exactly 3 recommended foods
  const recommendedFoods = SENIOR_TOP_3_FOODS;

  // Exactly 1 action tip
  let todayActionTip = '오늘은 물을 조금 더 챙겨 마셔보세요. 💧';
  if (isDelay) {
    todayActionTip = '오늘은 물을 조금 더 챙겨 마셔보세요. 💧';
  } else if (foods.some((f) => f.includes('고기') || f.includes('밀가루'))) {
    todayActionTip = '오늘 식사에 채소를 조금 추가해보세요. 🥬';
  } else {
    todayActionTip = '오늘은 가볍게 산책해보세요. 🚶';
  }

  return {
    summary: `${bowelStatusHeadline} ${bowelStatusTip}`,
    bowelStatusHeadline,
    bowelStatusTip,
    recommendedFoods,
    todayActionTip,
  };
}

function getPreviousDateStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatKoreanDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  return `${y}년 ${m}월 ${d}일 (${weekdays[dateObj.getDay()]})`;
}

function formatMonthDay(dateStr: string): string {
  const [, m, d] = dateStr.split('-').map(Number);
  return `${m}월 ${d}일`;
}

export default function App() {
  // 1. Data Persistence State
  const [logs, setLogs] = useState<Record<string, BowelLog>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return getInitialBowelLogs(TODAY_STR);
  });

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_RECS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_RECOMMENDATIONS;
  });

  // Track eaten recommended foods for today
  const [eatenFoodIds, setEatenFoodIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EATEN_FOODS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs));
    } catch {
      // ignore
    }
  }, [logs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_RECS, JSON.stringify(recommendations));
    } catch {
      // ignore
    }
  }, [recommendations]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EATEN_FOODS, JSON.stringify(eatenFoodIds));
    } catch {
      // ignore
    }
  }, [eatenFoodIds]);

  // Senior Accessibility: Large Text Mode
  const [largeTextMode, setLargeTextMode] = useState<boolean>(true);

  // Splash Loading Screen State ("편안한 장, 편안한 하루" -> 1.5s -> 배변 달력 화면)
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [splashFading, setSplashFading] = useState<boolean>(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setSplashFading(true);
    }, 1300);
    const hideTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Main Bottom Navigation: 1. 배변 달력 (default), 2. AI분석, 3. 맞춤 추천
  const [activeTab, setActiveTab] = useState<MobileTab>('calendar');

  // Calendar & Selected Date State
  const [currentMonth, setCurrentMonth] = useState<{ year: number; month: number }>({
    year: 2026,
    month: 10,
  });
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_STR);

  // Date Record Input Bottom Sheet Panel
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState<boolean>(false);

  // Form State inside Bottom Sheet
  const [editHasBowel, setEditHasBowel] = useState<boolean>(true);
  const [editAmount, setEditAmount] = useState<BowelAmount>('medium');
  const [editTime, setEditTime] = useState<string>('08:30');
  const [editCycle, setEditCycle] = useState<string>('2일 간격');
  const [editFoods, setEditFoods] = useState<string[]>([]);
  const [customFoodInput, setCustomFoodInput] = useState<string>('');
  const [editHelpfulFoods, setEditHelpfulFoods] = useState<string[]>([]);
  const [customHelpfulFoodInput, setCustomHelpfulFoodInput] = useState<string>('');
  const [editNote, setEditNote] = useState<string>('');
  const [isAnalyzingAI, setIsAnalyzingAI] = useState<boolean>(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  // Recommendation Stage Filter
  const [recStageFilter, setRecStageFilter] = useState<'auto' | 'all' | 2 | 3 | 4 | 5>('auto');

  // Admin Mode State (Password 0246, never exposed in UI)
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState<string>('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [adminFilterDays, setAdminFilterDays] = useState<'all' | 2 | 3 | 4 | 5>('all');

  // Quick Coupang URL editing map inside Admin
  const [quickUrlDrafts, setQuickUrlDrafts] = useState<Record<string, string>>({});
  const [quickSavedId, setQuickSavedId] = useState<string | null>(null);

  // Admin Add/Edit Form State
  const [isRecFormOpen, setIsRecFormOpen] = useState<boolean>(false);
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [recFormMinDays, setRecFormMinDays] = useState<number>(2);
  const [recFormCategory, setRecFormCategory] = useState<string>('소화 촉진 & 수분 보충');
  const [recFormTitle, setRecFormTitle] = useState<string>('');
  const [recFormBenefit, setRecFormBenefit] = useState<string>('');
  const [recFormDesc, setRecFormDesc] = useState<string>('');
  const [recFormUrl, setRecFormUrl] = useState<string>('');

  // Compute default bowel cycle for a given date based on previous bowel movement
  const getComputedCycleLabel = (targetDate: string): string => {
    const prevBowelDates = Object.values(logs)
      .filter((l) => l.hasBowelMovement !== false && l.date < targetDate)
      .map((l) => l.date)
      .sort();

    if (prevBowelDates.length === 0) return '2일 간격';
    const lastDate = prevBowelDates[prevBowelDates.length - 1];
    const diff = Math.round(
      (new Date(targetDate + 'T00:00:00').getTime() -
        new Date(lastDate + 'T00:00:00').getTime()) /
        (1000 * 60 * 60 * 24)
    );
    if (diff <= 1) return '매일 (1일 간격)';
    if (diff === 2) return '2일 간격';
    if (diff === 3) return '3일 간격';
    return '4일 이상 간격';
  };

  // Sync editor when selectedDate changes
  useEffect(() => {
    const existing = logs[selectedDate];
    if (existing) {
      setEditHasBowel(existing.hasBowelMovement !== false);
      setEditAmount(existing.amount || 'medium');
      setEditTime(existing.time || '08:30');
      setEditCycle(existing.cycle || getComputedCycleLabel(selectedDate));
      setEditFoods(existing.foods || []);
      setEditHelpfulFoods(existing.helpfulFoods || []);
      setEditNote(existing.note || '');
    } else {
      setEditHasBowel(true);
      setEditAmount('medium');
      setEditTime('08:30');
      setEditCycle(getComputedCycleLabel(selectedDate));
      setEditFoods([]);
      setEditHelpfulFoods([]);
      setEditNote('');
    }
    setCustomFoodInput('');
    setCustomHelpfulFoodInput('');
  }, [selectedDate, logs]);

  // Sync quickUrlDrafts when recommendations change
  useEffect(() => {
    const drafts: Record<string, string> = {};
    recommendations.forEach((item) => {
      drafts[item.id] = item.coupangUrl;
    });
    setQuickUrlDrafts(drafts);
  }, [recommendations]);

  // Calculate Bowel Cycle Metrics & Elapsed Days
  const cycleStats = useMemo(() => {
    const bowelDates = Object.values(logs)
      .filter((log) => log.hasBowelMovement !== false && log.date <= TODAY_STR)
      .map((log) => log.date)
      .sort();

    const todayTime = new Date(TODAY_STR + 'T00:00:00').getTime();
    let elapsedDays = 0;
    let lastBowelDate: string | null = null;

    if (bowelDates.length > 0) {
      lastBowelDate = bowelDates[bowelDates.length - 1];
      const lastTime = new Date(lastBowelDate + 'T00:00:00').getTime();
      elapsedDays = Math.max(0, Math.round((todayTime - lastTime) / (1000 * 60 * 60 * 24)));
    } else {
      elapsedDays = 3;
    }

    let avgIntervalDays = 1.0;
    if (bowelDates.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < bowelDates.length; i++) {
        const t1 = new Date(bowelDates[i - 1] + 'T00:00:00').getTime();
        const t2 = new Date(bowelDates[i] + 'T00:00:00').getTime();
        totalDiff += Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
      }
      avgIntervalDays = Math.round((totalDiff / (bowelDates.length - 1)) * 10) / 10;
    }

    const monthPrefix = `${currentMonth.year}-${String(currentMonth.month).padStart(2, '0')}`;
    const monthlyCount = Object.values(logs).filter(
      (l) => l.date.startsWith(monthPrefix) && l.hasBowelMovement !== false
    ).length;

    return {
      elapsedDays,
      lastBowelDate,
      avgIntervalDays,
      monthlyCount,
      totalBowelCount: bowelDates.length,
    };
  }, [logs, currentMonth]);

  // Status Banner
  const statusBanner = useMemo(() => {
    const d = cycleStats.elapsedDays;
    if (d === 0) {
      return {
        badge: '오늘 배변 완료',
        title: '오늘 배변 완료',
        Icon: CheckCircle2,
      };
    }
    if (d === 1) {
      return {
        badge: '건강한 배변 주기',
        title: '1일째 배변 경과',
        Icon: CheckCircle2,
      };
    }
    return {
      badge: `${d}일째 미배변`,
      title: `${d}일째 배변 지연`,
      Icon: d >= 4 ? ShieldAlert : d === 3 ? AlertTriangle : Droplets,
    };
  }, [cycleStats.elapsedDays]);

  const activeStageMinDays = useMemo(() => {
    if (recStageFilter !== 'auto' && recStageFilter !== 'all') {
      return recStageFilter;
    }
    const d = cycleStats.elapsedDays;
    if (d <= 2) return 2;
    if (d === 3) return 3;
    if (d === 4) return 4;
    return 5;
  }, [recStageFilter, cycleStats.elapsedDays]);

  const displayedRecommendations = useMemo(() => {
    if (recStageFilter === 'all') {
      return [...recommendations].sort((a, b) => a.minDays - b.minDays);
    }
    return recommendations.filter((item) => item.minDays === activeStageMinDays);
  }, [recommendations, recStageFilter, activeStageMinDays]);

  const adminFilteredRecommendations = useMemo(() => {
    const list =
      adminFilterDays === 'all'
        ? recommendations
        : recommendations.filter((r) => r.minDays === adminFilterDays);
    return [...list].sort((a, b) => a.minDays - b.minDays);
  }, [recommendations, adminFilterDays]);

  // Calendar Grid
  const calendarDays = useMemo(() => {
    const { year, month } = currentMonth;
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    const cells: Array<{ dateStr: string | null; dayNum: number | null }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ dateStr: null, dayNum: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ dateStr, dayNum: d });
    }
    return cells;
  }, [currentMonth]);

  // Handlers
  const handlePrevMonth = () => {
    setCurrentMonth((prev) =>
      prev.month === 1 ? { year: prev.year - 1, month: 12 } : { year: prev.year, month: prev.month - 1 }
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) =>
      prev.month === 12 ? { year: prev.year + 1, month: 1 } : { year: prev.year, month: prev.month + 1 }
    );
  };

  const handleCalendarDateClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowDeleteConfirm(false);
    setIsBottomSheetOpen(true);
  };

  const toggleFoodOption = (foodLabel: string) => {
    setEditFoods((prev) =>
      prev.includes(foodLabel) ? prev.filter((f) => f !== foodLabel) : [...prev, foodLabel]
    );
  };

  const handleAddCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customFoodInput.trim();
    if (!trimmed) return;
    if (!editFoods.includes(trimmed)) {
      setEditFoods((prev) => [...prev, trimmed]);
    }
    setCustomFoodInput('');
  };

  const toggleHelpfulOption = (item: string) => {
    setEditHelpfulFoods((prev) =>
      prev.includes(item) ? prev.filter((f) => f !== item) : [...prev, item]
    );
  };

  const handleAddCustomHelpful = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customHelpfulFoodInput.trim();
    if (!trimmed) return;
    if (!editHelpfulFoods.includes(trimmed)) {
      setEditHelpfulFoods((prev) => [...prev, trimmed]);
    }
    setCustomHelpfulFoodInput('');
  };

  const requestAIFeedback = async (
    targetDate: string,
    amount: BowelAmount,
    hasBowelMovement: boolean,
    foods: string[],
    note: string
  ): Promise<AIFeedbackResult> => {
    const prevDateStr = getPreviousDateStr(targetDate);
    const previousDayFoods = logs[prevDateStr]?.foods || [];

    try {
      const response = await fetch('/api/ai/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: targetDate,
          amount,
          hasBowelMovement,
          foods,
          previousDayFoods,
          note,
          elapsedDays: cycleStats.elapsedDays,
        }),
      });
      if (!response.ok) throw new Error('Server AI error');
      const data = await response.json();
      if (data && (data.bowelStatusHeadline || data.summary)) return data as AIFeedbackResult;
      throw new Error('Invalid AI response');
    } catch {
      return buildLocalFallbackFeedback(
        amount,
        hasBowelMovement,
        foods,
        previousDayFoods,
        cycleStats.elapsedDays,
        cycleStats.totalBowelCount,
        cycleStats.avgIntervalDays
      );
    }
  };

  const handleSaveLog = async (options?: { closeModal?: boolean; goToTab?: MobileTab }) => {
    setIsAnalyzingAI(true);
    const aiResult = await requestAIFeedback(
      selectedDate,
      editAmount,
      editHasBowel,
      editFoods,
      editNote
    );

    const newLog: BowelLog = {
      date: selectedDate,
      amount: editAmount,
      hasBowelMovement: editHasBowel,
      time: editHasBowel ? editTime : '',
      cycle: editCycle,
      foods: editFoods,
      helpfulFoods: editHelpfulFoods,
      note: editNote,
      aiFeedback: aiResult,
    };

    setLogs((prev) => ({
      ...prev,
      [selectedDate]: newLog,
    }));

    setIsAnalyzingAI(false);
    if (options?.closeModal) {
      setIsBottomSheetOpen(false);
    }
    if (options?.goToTab) {
      setActiveTab(options.goToTab);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    setSaveToast(`${formatKoreanDate(selectedDate)} 기록이 저장되었습니다.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleDeleteLog = () => {
    setLogs((prev) => {
      const next = { ...prev };
      delete next[selectedDate];
      return next;
    });
    setIsBottomSheetOpen(false);
    setSaveToast(`${formatKoreanDate(selectedDate)} 기록이 삭제되었습니다.`);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Toggle "먹었어요" (I ate this) for recommended food items
  const handleToggleEatenFood = (food: RecommendedFoodItem) => {
    const isEaten = eatenFoodIds.includes(food.id);
    let updatedIds: string[];
    if (isEaten) {
      updatedIds = eatenFoodIds.filter((id) => id !== food.id);
      setSaveToast(`[${food.name}] 섭취 표시가 취소되었습니다.`);
    } else {
      updatedIds = [...eatenFoodIds, food.id];
      setSaveToast(`[${food.name}] 오늘 먹었어요! 기록에 반영되었습니다.`);

      // Also append to today's log's foods if not already present
      setLogs((prev) => {
        const todayLog = prev[TODAY_STR] || {
          date: TODAY_STR,
          amount: 'medium',
          hasBowelMovement: false,
          foods: [],
          note: '',
        };
        if (!todayLog.foods.includes(food.name)) {
          return {
            ...prev,
            [TODAY_STR]: {
              ...todayLog,
              foods: [...todayLog.foods, food.name],
            },
          };
        }
        return prev;
      });
    }
    setEatenFoodIds(updatedIds);
    setTimeout(() => setSaveToast(null), 3000);
  };

  // Admin Authentication
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput.trim() === ADMIN_PIN) {
      setIsAdminAuthenticated(true);
      setAdminAuthError(null);
      setAdminPasswordInput('');
    } else {
      setAdminAuthError('비밀번호가 올바르지 않습니다. 다시 확인해 주세요.');
    }
  };

  const handleCloseAdmin = () => {
    setIsAdminOpen(false);
    setAdminPasswordInput('');
    setAdminAuthError(null);
  };

  const handleQuickSaveCoupangUrl = (id: string) => {
    const newUrl = (quickUrlDrafts[id] || '').trim();
    if (!newUrl) return;
    setRecommendations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, coupangUrl: newUrl } : item))
    );
    setQuickSavedId(id);
    setTimeout(() => setQuickSavedId(null), 2000);
  };

  const handleChangeRecMinDays = (days: number) => {
    setRecFormMinDays(days);
    const defaultCategoryMap: Record<number, string> = {
      2: '소화 촉진 & 수분 보충',
      3: '팽창성 식이섬유 & 장 활성',
      4: 'Fast-Relief & 삼투압 작용',
      5: '고농축 집중 케어',
    };
    if (defaultCategoryMap[days]) {
      setRecFormCategory(defaultCategoryMap[days]);
    }
  };

  const handleOpenNewRecForm = () => {
    setEditingRecId(null);
    setRecFormMinDays(adminFilterDays === 'all' ? 2 : adminFilterDays);
    setRecFormCategory('소화 촉진 & 수분 보충');
    setRecFormTitle('');
    setRecFormBenefit('');
    setRecFormDesc('');
    setRecFormUrl('');
    setIsRecFormOpen(true);
  };

  const handleStartEditRec = (item: RecommendationItem) => {
    setEditingRecId(item.id);
    setRecFormMinDays(item.minDays);
    setRecFormCategory(item.category);
    setRecFormTitle(item.title);
    setRecFormBenefit(item.benefitText || '');
    setRecFormDesc(item.description);
    setRecFormUrl(item.coupangUrl);
    setIsRecFormOpen(true);
  };

  const handleSaveRecommendation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recFormTitle.trim() || !recFormDesc.trim()) return;

    const cleanUrl =
      recFormUrl.trim() ||
      `https://www.coupang.com/np/search?q=${encodeURIComponent(recFormTitle.trim())}`;

    if (editingRecId) {
      setRecommendations((prev) =>
        prev.map((item) =>
          item.id === editingRecId
            ? {
                ...item,
                minDays: recFormMinDays,
                category: recFormCategory.trim(),
                title: recFormTitle.trim(),
                benefitText: recFormBenefit.trim() || '장 건강을 돕는 맞춤 식품',
                description: recFormDesc.trim(),
                coupangUrl: cleanUrl,
              }
            : item
        )
      );
    } else {
      const newItem: RecommendationItem = {
        id: `rec-${Date.now()}`,
        minDays: recFormMinDays,
        category: recFormCategory.trim(),
        title: recFormTitle.trim(),
        benefitText: recFormBenefit.trim() || '장 건강을 돕는 맞춤 식품',
        description: recFormDesc.trim(),
        coupangUrl: cleanUrl,
      };
      setRecommendations((prev) => [newItem, ...prev]);
    }

    setIsRecFormOpen(false);
    setEditingRecId(null);
  };

  const handleDeleteRec = (id: string) => {
    setRecommendations((prev) => prev.filter((item) => item.id !== id));
  };

  const selectedLog = logs[selectedDate];
  const prevDateStr = getPreviousDateStr(selectedDate);
  const prevLog = logs[prevDateStr];

  const currentFeedback: AIFeedbackResult = useMemo(() => {
    if (selectedLog?.aiFeedback) {
      return selectedLog.aiFeedback;
    }
    return buildLocalFallbackFeedback(
      editAmount,
      editHasBowel,
      editFoods,
      prevLog?.foods || [],
      cycleStats.elapsedDays,
      cycleStats.totalBowelCount,
      cycleStats.avgIntervalDays
    );
  }, [
    selectedLog,
    editAmount,
    editHasBowel,
    editFoods,
    prevLog,
    cycleStats.elapsedDays,
    cycleStats.totalBowelCount,
    cycleStats.avgIntervalDays,
  ]);

  const BannerIcon = statusBanner.Icon;

  // Senior-Simplified: Exactly 3 recommended foods
  const aiRecommendedFoods: RecommendedFoodItem[] = useMemo(() => {
    if (currentFeedback.recommendedFoods && currentFeedback.recommendedFoods.length > 0) {
      return currentFeedback.recommendedFoods.slice(0, 3);
    }
    return SENIOR_TOP_3_FOODS;
  }, [currentFeedback.recommendedFoods]);

  // Senior-Simplified: Single Action Tip
  const aiActionTip: string = useMemo(() => {
    if (currentFeedback.todayActionTip) {
      return currentFeedback.todayActionTip;
    }
    if (cycleStats.elapsedDays >= 3) {
      return '오늘은 물을 조금 더 챙겨 마셔보세요. 💧';
    }
    return '오늘 식사에 채소를 조금 추가해보세요. 🥬';
  }, [currentFeedback.todayActionTip, cycleStats.elapsedDays]);

  // Senior-Simplified: Bowel Status Headline & Subline
  const bowelStatusInfo = useMemo(() => {
    if (currentFeedback.bowelStatusHeadline && currentFeedback.bowelStatusTip) {
      return {
        headline: currentFeedback.bowelStatusHeadline,
        subline: currentFeedback.bowelStatusTip,
      };
    }
    if (cycleStats.totalBowelCount < 2) {
      return {
        headline: '아직 기록이 많지 않아요.',
        subline: '며칠 더 기록해주시면 배변 주기를 알려드릴게요.',
      };
    }
    if (cycleStats.elapsedDays >= 3) {
      return {
        headline: '2~3일 간격이에요.',
        subline: '조금 더 자주 확인해 주세요.',
      };
    }
    return {
      headline: '비교적 일정해요.',
      subline: '지금처럼 관리해보세요.',
    };
  }, [currentFeedback, cycleStats]);

  return (
    <div className="min-h-screen bg-stone-100/90 flex justify-center">
      {/* Mobile-First Senior-Friendly Container (max-w-[480px]) */}
      <div
        className={`w-full max-w-[480px] min-h-screen bg-white text-stone-900 flex flex-col shadow-xl border-x border-stone-200/90 relative ${
          largeTextMode ? 'text-[17px]' : 'text-base'
        }`}
      >
        {/* ==========================================
            APP START SPLASH / LOADING SCREEN ("편안한 장, 편안한 하루")
           ========================================== */}
        {showSplash && (
          <div
            onClick={() => setShowSplash(false)}
            className={`fixed inset-0 z-50 flex justify-center bg-stone-200/80 transition-opacity duration-300 ${
              splashFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <div className="w-full max-w-[480px] min-h-screen bg-gradient-to-b from-[#F0FDF4] via-white to-white flex flex-col items-center justify-between px-8 py-14 text-center select-none">
              <div className="pt-2">
                <span className="text-xs font-bold tracking-widest text-teal-800">
                  매일 챙기는 건강한 배변 습관
                </span>
              </div>

              {/* Center Illustration & Main/Sub Copy */}
              <div className="flex flex-col items-center max-w-xs space-y-6 my-auto">
                <div className="w-28 h-28 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center shadow-xs">
                  <svg
                    viewBox="0 0 120 120"
                    className="w-20 h-20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <circle cx="60" cy="56" r="34" fill="#CCFBF1" />
                    <circle cx="60" cy="56" r="24" fill="#99F6E4" fillOpacity="0.6" />
                    <path
                      d="M60 76V46"
                      stroke="#0F766E"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M60 58C60 44 74 36 84 38C84 50 74 60 60 58Z"
                      fill="#14B8A6"
                      fillOpacity="0.85"
                      stroke="#0F766E"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M60 64C60 52 47 44 37 46C37 57 47 66 60 64Z"
                      fill="#2DD4BF"
                      fillOpacity="0.85"
                      stroke="#0F766E"
                      strokeWidth="2.5"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M34 84C42 80 50 88 60 84C70 80 78 88 86 84"
                      stroke="#0D9488"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="space-y-2.5">
                  <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-display tracking-tight">
                    편안한 장, 편안한 하루
                  </h1>
                  <p className="text-base font-semibold text-stone-600 leading-relaxed">
                    오늘의 배변 습관을 기록해보세요.
                  </p>
                </div>

                <div className="w-36 h-1.5 bg-stone-200 rounded-full overflow-hidden mt-2">
                  <div className="h-full bg-teal-600 rounded-full animate-pulse w-full" />
                </div>
              </div>

              <div className="pb-2">
                <p className="text-xs font-semibold text-stone-400">
                  편안한 장 하루 · 배변 달력 및 장 건강 케어
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Mobile Top App Bar */}
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 flex items-center justify-between gap-2">
          {/* Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setIsAdminOpen(false);
              setActiveTab('calendar');
            }}
            className="text-lg font-bold tracking-tight text-stone-900 font-display whitespace-nowrap shrink-0 cursor-pointer"
          >
            편안한 장 하루
          </button>

          {/* Large Text Accessibility Toggle */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setLargeTextMode((prev) => !prev)}
              className="min-h-[38px] px-2.5 py-1 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {largeTextMode ? '글씨: 크게' : '글씨: 보통'}
            </button>

            {/* Admin Action Button */}
            <button
              type="button"
              onClick={() => setIsAdminOpen((prev) => !prev)}
              className={`min-h-[38px] px-2.5 py-1 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer inline-flex items-center gap-1 ${
                isAdminOpen
                  ? 'bg-stone-900 text-white'
                  : 'border border-stone-300 text-stone-700 hover:bg-stone-100'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>관리자</span>
            </button>
          </div>
        </header>

        {/* Save Toast Notification */}
        {saveToast && (
          <div className="sticky top-14 z-20 px-4 pt-2">
            <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-teal-900 text-white text-sm font-semibold shadow-md">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-teal-300 shrink-0" />
                <span>{saveToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveToast(null)}
                className="text-xs text-teal-200 hover:text-white ml-2 whitespace-nowrap cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        )}

        {/* MAIN SCROLLABLE VIEWPORT */}
        <main className="flex-1 px-4 pt-3 pb-28 space-y-4">
          {/* ==========================================
              ADMIN MODE SCREEN (Opened when 관리자 button clicked)
             ========================================== */}
          {isAdminOpen ? (
            <section className="bg-white border border-stone-200 rounded-3xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-stone-200 pb-4">
                <div>
                  <p className="text-xs text-stone-500">관리자 전용 설정</p>
                  <h1 className="text-xl font-bold text-stone-900 mt-0.5">
                    맞춤 추천 음식 & 쿠팡 링크 관리
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={handleCloseAdmin}
                  className="min-h-[44px] px-3.5 py-2 text-xs font-bold bg-stone-100 text-stone-800 rounded-xl hover:bg-stone-200 transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <X className="w-4 h-4" />
                  <span>닫기</span>
                </button>
              </div>

              {!isAdminAuthenticated ? (
                <form onSubmit={handleAdminLogin} className="space-y-4 py-4">
                  <div className="flex items-center gap-2 text-stone-800 font-bold text-base">
                    <Lock className="w-5 h-5 text-teal-800 shrink-0" />
                    <span>관리자 비밀번호를 입력해 주세요</span>
                  </div>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    맞춤 추천 음식 목록과 각 상품의 쿠팡 구매 링크를 수정하려면 관리자 인증이 필요합니다.
                  </p>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="비밀번호 4자리 입력"
                    className="w-full min-h-[52px] px-4 py-3 text-base border border-stone-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-stone-900 tracking-widest font-mono"
                    autoFocus
                  />
                  {adminAuthError && (
                    <p className="text-sm text-red-600 font-semibold">{adminAuthError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full min-h-[52px] py-3 bg-stone-900 text-white text-base font-bold rounded-2xl hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    관리자 모드 입장하기
                  </button>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-stone-800">
                        지연 일수별 추천 음식 ({adminFilteredRecommendations.length}개)
                      </span>
                      <button
                        type="button"
                        onClick={handleOpenNewRecForm}
                        className="min-h-[44px] px-4 py-2 bg-stone-900 text-white text-xs font-bold rounded-xl hover:bg-stone-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4" />
                        <span>새 추천 음식 추가</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5 bg-stone-100 p-1.5 rounded-2xl">
                      {(
                        [
                          { key: 'all', label: '전체' },
                          { key: 2, label: '2일+' },
                          { key: 3, label: '3일+' },
                          { key: 4, label: '4일+' },
                          { key: 5, label: '5일+' },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={String(tab.key)}
                          type="button"
                          onClick={() => setAdminFilterDays(tab.key)}
                          className={`min-h-[40px] text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                            adminFilterDays === tab.key
                              ? 'bg-white text-stone-900 shadow-xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isRecFormOpen && (
                    <form
                      onSubmit={handleSaveRecommendation}
                      className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-stone-900">
                          {editingRecId ? '추천 음식 상세 수정' : '새 추천 음식 등록'}
                        </h2>
                        <button
                          type="button"
                          onClick={() => setIsRecFormOpen(false)}
                          className="text-xs font-semibold text-stone-600 underline cursor-pointer"
                        >
                          취소
                        </button>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-700">
                          노출할 미배변 경과 일수
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {[2, 3, 4, 5].map((days) => (
                            <button
                              key={days}
                              type="button"
                              onClick={() => handleChangeRecMinDays(days)}
                              className={`min-h-[42px] text-xs font-bold rounded-xl border cursor-pointer tabular-nums ${
                                recFormMinDays === days
                                  ? 'bg-stone-900 text-white border-stone-900'
                                  : 'bg-white text-stone-700 border-stone-300'
                              }`}
                            >
                              {days}일 이상
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-700">
                          카테고리 분류
                        </label>
                        <input
                          type="text"
                          value={recFormCategory}
                          onChange={(e) => setRecFormCategory(e.target.value)}
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-700">
                          추천 음식 / 상품명
                        </label>
                        <input
                          type="text"
                          value={recFormTitle}
                          onChange={(e) => setRecFormTitle(e.target.value)}
                          placeholder="예: 테일러 푸룬주스 1.89L"
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-700">
                          핵심 효능 한 줄 요약
                        </label>
                        <input
                          type="text"
                          value={recFormBenefit}
                          onChange={(e) => setRecFormBenefit(e.target.value)}
                          placeholder="예: 변을 부드럽게 녹여주는 쾌변 주스"
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-700">
                          상세 설명
                        </label>
                        <textarea
                          rows={2}
                          value={recFormDesc}
                          onChange={(e) => setRecFormDesc(e.target.value)}
                          className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-xl"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-stone-700">
                          쿠팡 링크 URL 붙여넣기
                        </label>
                        <input
                          type="url"
                          value={recFormUrl}
                          onChange={(e) => setRecFormUrl(e.target.value)}
                          placeholder="https://link.coupang.com/..."
                          className="w-full min-h-[44px] px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-xl font-mono"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full min-h-[48px] py-2.5 bg-stone-900 text-white text-sm font-bold rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        {editingRecId ? '수정 내용 저장' : '추천 음식 등록 완료'}
                      </button>
                    </form>
                  )}

                  <div className="space-y-3">
                    {adminFilteredRecommendations.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-2xl border border-stone-200 bg-stone-50/70 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 text-xs text-stone-500 tabular-nums">
                              <span className="font-bold text-teal-800">
                                {item.minDays}일 이상 미배변
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{item.category}</span>
                            </div>
                            <h3 className="text-base font-bold text-stone-900 mt-0.5">
                              {item.title}
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEditRec(item)}
                              className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 cursor-pointer whitespace-nowrap"
                            >
                              상세수정
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRec(item.id)}
                              className="min-h-[36px] px-2.5 py-1 text-xs font-semibold text-red-700 bg-white border border-red-200 rounded-lg hover:bg-red-50 cursor-pointer whitespace-nowrap"
                            >
                              삭제
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-1 border-t border-stone-200/80">
                          <label className="flex items-center gap-1 text-xs font-bold text-stone-700">
                            <LinkIcon className="w-3.5 h-3.5 text-teal-800" />
                            <span>쿠팡 구매 링크 붙여넣기</span>
                          </label>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="url"
                              value={quickUrlDrafts[item.id] ?? item.coupangUrl}
                              onChange={(e) =>
                                setQuickUrlDrafts((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="쿠팡 파트너스 또는 상품 링크 붙여넣기"
                              className="flex-1 min-h-[42px] px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-stone-900"
                            />
                            <button
                              type="button"
                              onClick={() => handleQuickSaveCoupangUrl(item.id)}
                              className={`min-h-[42px] px-3.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                                quickSavedId === item.id
                                  ? 'bg-teal-800 text-white'
                                  : 'bg-stone-900 text-white hover:bg-stone-800'
                              }`}
                            >
                              {quickSavedId === item.id ? '저장됨!' : '링크 저장'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-stone-200 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setRecommendations(INITIAL_RECOMMENDATIONS)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>기본 추천 목록으로 초기화</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminAuthenticated(false);
                        setIsAdminOpen(false);
                      }}
                      className="text-xs font-semibold text-teal-800 underline cursor-pointer"
                    >
                      관리자 잠금 후 나가기
                    </button>
                  </div>
                </div>
              )}
            </section>
          ) : (
            <>
              {/* ==========================================
                  TAB 1: 배변 달력 (HERO SCREEN - NAVER CALENDAR CLEAN DESIGN)
                 ========================================== */}
              {activeTab === 'calendar' && (
                <div className="space-y-3.5">
                  {/* Subtle Light Sky Blue Status Bar */}
                  <div className="rounded-2xl border border-sky-200 bg-sky-100/90 px-4 py-2.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <BannerIcon className="w-4 h-4 text-sky-800 shrink-0" />
                      <span className="text-[16px] font-bold text-sky-950">
                        {statusBanner.title}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-sky-800 tabular-nums">
                      최근 배변: {cycleStats.lastBowelDate ? formatMonthDay(cycleStats.lastBowelDate) : '3일 전'}
                    </span>
                  </div>

                  {/* Clean Modern Naver-Calendar Style Container */}
                  <section className="bg-white border border-stone-200 rounded-3xl p-4 sm:p-5 shadow-xs select-none">
                    {/* 1. Calendar Header: ‹ 2026년 10월 › with 24~28px bold month text & stats */}
                    <div className="flex items-center justify-between pb-3">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        aria-label="이전 달"
                        className="w-12 h-12 rounded-full flex items-center justify-center text-stone-800 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer shrink-0"
                      >
                        <ChevronLeft className="w-7 h-7 stroke-[2.5]" />
                      </button>

                      <div className="text-center px-1">
                        <h1 className="text-[26px] sm:text-[28px] font-bold text-stone-900 tracking-tight leading-none tabular-nums">
                          {currentMonth.year}년 {currentMonth.month}월
                        </h1>
                        {/* Compact Clean Stats */}
                        <p className="text-[14px] font-semibold text-stone-500 mt-1 tabular-nums">
                          이번 달 배변 {cycleStats.monthlyCount}회 · 평균 {cycleStats.avgIntervalDays}일 간격
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleNextMonth}
                        aria-label="다음 달"
                        className="w-12 h-12 rounded-full flex items-center justify-center text-stone-800 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer shrink-0"
                      >
                        <ChevronRight className="w-7 h-7 stroke-[2.5]" />
                      </button>
                    </div>

                    {/* Today Jump Button row */}
                    <div className="flex justify-end pb-2 pr-1">
                      <button
                        type="button"
                        onClick={() => {
                          setCurrentMonth({ year: 2026, month: 10 });
                          setSelectedDate(TODAY_STR);
                        }}
                        className="min-h-[40px] px-3 py-1 rounded-xl bg-stone-100 hover:bg-stone-200 text-[14px] font-bold text-stone-800 transition-colors cursor-pointer"
                      >
                        오늘 ({formatMonthDay(TODAY_STR)})
                      </button>
                    </div>

                    {/* 2. Weekday Header: 일 월 화 수 목 금 토 (16~18px, minimal color difference) */}
                    <div className="grid grid-cols-7 text-center py-2.5 border-y border-stone-200/90 text-[17px] font-bold">
                      <div className="text-rose-500/90">일</div>
                      <div className="text-stone-800">월</div>
                      <div className="text-stone-800">화</div>
                      <div className="text-stone-800">수</div>
                      <div className="text-stone-800">목</div>
                      <div className="text-stone-800">금</div>
                      <div className="text-sky-700/90">토</div>
                    </div>

                    {/* 3. Date Grid (Spacious, 18~22px numbers, single point color dot ●) */}
                    <div className="grid grid-cols-7 gap-y-1.5 pt-2">
                      {calendarDays.map((cell, idx) => {
                        if (!cell.dateStr || !cell.dayNum) {
                          return <div key={`empty-${idx}`} className="min-h-[72px]" />;
                        }

                        const dayOfWeek = idx % 7;
                        const isSunday = dayOfWeek === 0;
                        const isSaturday = dayOfWeek === 6;

                        const log = logs[cell.dateStr];
                        const isSelected = selectedDate === cell.dateStr;
                        const isToday = cell.dateStr === TODAY_STR;
                        const hasBowel = log && log.hasBowelMovement !== false;
                        const hasDietOnly = log && log.hasBowelMovement === false;

                        let numberColor = isSunday
                          ? 'text-rose-600'
                          : isSaturday
                          ? 'text-sky-700'
                          : 'text-stone-900';

                        if (isSelected) {
                          numberColor = 'text-white';
                        }

                        return (
                          <button
                            key={cell.dateStr}
                            type="button"
                            onClick={() => handleCalendarDateClick(cell.dateStr!)}
                            aria-label={`${cell.dateStr} 배변 기록`}
                            className={`min-h-[74px] sm:min-h-[78px] py-1.5 px-0.5 rounded-2xl flex flex-col items-center justify-start gap-1 transition-all cursor-pointer active:scale-[0.96] ${
                              isSelected
                                ? 'bg-teal-50/60 ring-2 ring-teal-600/40'
                                : 'hover:bg-stone-50'
                            }`}
                          >
                            {/* Date Number Circle (18~22px, default 21px bold) */}
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center text-[21px] font-bold tabular-nums leading-none transition-colors ${
                                isSelected
                                  ? 'bg-teal-800 text-white shadow-xs'
                                  : isToday
                                  ? 'border-2 border-teal-600 bg-teal-50/70 text-teal-950 font-black'
                                  : numberColor
                              }`}
                            >
                              {cell.dayNum}
                            </div>

                            {/* Bowel Record Mark: Clean, Single Point Color Circle Dot (●) */}
                            <div className="h-4 flex items-center justify-center">
                              {hasBowel ? (
                                <span
                                  className="w-2.5 h-2.5 rounded-full bg-teal-600 shadow-xs"
                                  title="배변 완료"
                                />
                              ) : hasDietOnly ? (
                                <span
                                  className="w-2 h-2 rounded-full bg-stone-300"
                                  title="식단만 기록"
                                />
                              ) : isToday ? (
                                <span className="text-[12px] font-bold text-teal-800 leading-none">
                                  오늘
                                </span>
                              ) : null}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Single Point Color Legend */}
                    <div className="pt-3 mt-1 border-t border-stone-100 flex items-center justify-center gap-6 text-[15px] font-bold text-stone-600">
                      <div className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                        <span>배변 완료</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full border-2 border-teal-600 bg-teal-50/80 inline-block" />
                        <span>오늘 날짜</span>
                      </div>
                    </div>
                  </section>

                  {/* Selected Date Summary & Bottom Sheet Trigger Card */}
                  <section className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-stone-500">선택한 날짜</span>
                        <h2 className="text-[22px] font-bold text-stone-900 tabular-nums mt-0.5">
                          {formatKoreanDate(selectedDate)}
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setIsBottomSheetOpen(true);
                        }}
                        className="min-h-[50px] px-4 py-2.5 bg-teal-800 text-white text-[16px] font-bold rounded-2xl hover:bg-teal-900 active:scale-[0.98] transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>{selectedLog ? '기록 수정' : '배변 기록 입력'}</span>
                      </button>
                    </div>

                    {selectedLog ? (
                      <div className="space-y-2 text-[16px] text-stone-800 pt-2 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900 shrink-0">배변 상태:</span>
                          <span className="font-semibold text-teal-900">
                            {selectedLog.hasBowelMovement === false
                              ? '미배변 (식단만 기록)'
                              : selectedLog.amount === 'small'
                              ? '적음 (소량 💩)'
                              : selectedLog.amount === 'medium'
                              ? '보통 (편안함 💩💩)'
                              : '많음 (쾌변 💩💩💩)'}
                          </span>
                          {selectedLog.hasBowelMovement !== false && selectedLog.time && (
                            <span className="text-stone-500 tabular-nums">· {selectedLog.time}</span>
                          )}
                        </div>

                        {selectedLog.foods.length > 0 && (
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-stone-900 shrink-0">섭취 음식:</span>
                            <span className="text-stone-700 leading-snug">
                              {selectedLog.foods.join(' · ')}
                            </span>
                          </div>
                        )}

                        {selectedLog.helpfulFoods && selectedLog.helpfulFoods.length > 0 && (
                          <div className="flex items-baseline gap-2">
                            <span className="font-bold text-teal-900 shrink-0">도움된 음식/주스:</span>
                            <span className="text-teal-800 font-semibold leading-snug">
                              {selectedLog.helpfulFoods.join(' · ')}
                            </span>
                          </div>
                        )}

                        {selectedLog.note && (
                          <div className="pt-1">
                            <p className="p-3 rounded-xl bg-stone-50 text-stone-700 border border-stone-200/80 leading-relaxed text-[15px]">
                              {selectedLog.note}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[16px] text-stone-500 pt-1 leading-relaxed">
                        아직 기록이 없는 날짜입니다. 위의 <strong>[배변 기록 입력]</strong> 버튼을 누르거나 날짜를 클릭하여 기록해보세요.
                      </p>
                    )}
                  </section>
                </div>
              )}

              {/* ==========================================
                  TAB 2: AI분석 (SENIOR-SIMPLIFIED 3 ESSENTIAL CARDS)
                  1. 상단: AI 배변 분석 / 최근 기록을 바탕으로 알려드려요.
                  2. 🚽 나의 배변 상태 (주기 & 한 줄 안내)
                  3. 🍎 오늘의 추천 음식 (최대 3개 & [먹었어요])
                  4. 💬 오늘의 한마디 (딱 1가지 실천 행동)
                 ========================================== */}
              {activeTab === 'ai' && (
                <section className="space-y-4">
                  {/* Top Header Card */}
                  <div className="bg-white border-2 border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex items-center justify-between">
                    <div>
                      <h1 className="text-[26px] sm:text-[28px] font-bold text-stone-900 tracking-tight leading-tight">
                        AI 배변 분석
                      </h1>
                      <p className="text-[16px] font-semibold text-stone-500 mt-1">
                        최근 기록을 바탕으로 알려드려요.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isAnalyzingAI}
                      onClick={() => handleSaveLog()}
                      className="min-h-[44px] px-3.5 py-2 text-xs font-bold text-teal-900 border-2 border-teal-300 rounded-xl hover:bg-teal-50 transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs disabled:opacity-50 shrink-0"
                    >
                      <Sparkles className="w-4 h-4 text-teal-700" />
                      <span>{isAnalyzingAI ? '확인 중...' : '다시 확인'}</span>
                    </button>
                  </div>

                  {/* 1. 첫 번째 카드 — 🚽 나의 배변 상태 (Big, Simple, No complex charts) */}
                  <div className="bg-white border-2 border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none">🚽</span>
                      <h2 className="text-[22px] font-bold text-stone-900 tracking-tight">
                        나의 배변 상태
                      </h2>
                    </div>

                    <div className="p-5 rounded-2xl bg-teal-50/80 border-2 border-teal-200/90 space-y-2">
                      <p className="text-[15px] font-bold text-teal-900">
                        최근 배변 주기
                      </p>
                      <p className="text-[25px] sm:text-[27px] font-bold text-stone-900 leading-tight">
                        {bowelStatusInfo.headline}
                      </p>
                      <p className="text-[18px] font-bold text-teal-900 pt-1">
                        {bowelStatusInfo.subline}
                      </p>
                    </div>
                  </div>

                  {/* 2. 두 번째 카드 — 🍎 오늘의 추천 음식 (최대 3개 & [먹었어요] 버튼) */}
                  <div className="bg-white border-2 border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none">🍎</span>
                      <h2 className="text-[22px] font-bold text-stone-900 tracking-tight">
                        오늘의 추천 음식
                      </h2>
                    </div>

                    {/* Maximum 3 clean food rows */}
                    <div className="space-y-3">
                      {aiRecommendedFoods.map((item) => {
                        const isEaten = eatenFoodIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 ${
                              isEaten
                                ? 'bg-teal-50/90 border-teal-600 shadow-xs'
                                : 'bg-stone-50/80 border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-3xl select-none shrink-0">
                                {item.emoji}
                              </span>
                              <div className="min-w-0">
                                <h3 className="text-[20px] font-bold text-stone-900 leading-tight truncate">
                                  {item.name}
                                </h3>
                                <p className="text-[15px] font-medium text-stone-600 mt-0.5 leading-snug">
                                  {item.reason}
                                </p>
                              </div>
                            </div>

                            {/* [ 먹었어요 ] Large Senior Button */}
                            <button
                              type="button"
                              onClick={() => handleToggleEatenFood(item)}
                              className={`min-h-[48px] px-3.5 py-2 rounded-xl text-[16px] font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                                isEaten
                                  ? 'bg-teal-700 text-white shadow-xs'
                                  : 'bg-white hover:bg-stone-100 text-teal-900 border-2 border-teal-600'
                              }`}
                            >
                              {isEaten ? (
                                <>
                                  <Check className="w-4 h-4 text-teal-200 stroke-[3]" />
                                  <span>먹었어요!</span>
                                </>
                              ) : (
                                <span>먹었어요</span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. 세 번째 카드 — 💬 오늘의 한마디 (딱 1가지 실천 행동만!) */}
                  <div className="bg-white border-2 border-stone-200/90 rounded-3xl p-6 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl select-none">💬</span>
                      <h2 className="text-[22px] font-bold text-stone-900 tracking-tight">
                        오늘의 한마디
                      </h2>
                    </div>

                    <div className="p-5 rounded-2xl bg-teal-50/80 border-2 border-teal-200/90 text-center sm:text-left">
                      <p className="text-[20px] sm:text-[22px] font-bold text-teal-950 leading-relaxed">
                        {aiActionTip}
                      </p>
                    </div>
                  </div>

                  {/* Quick link to Tab 3 for detailed shopping */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab('recommend')}
                      className="w-full min-h-[54px] py-3 px-4 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white text-[17px] font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                    >
                      <ShoppingBag className="w-5 h-5 text-teal-200" />
                      <span>단계별 장 케어 식품 보기</span>
                    </button>
                  </div>

                  {/* Subtle Safety Note */}
                  <p className="text-center text-[13px] text-stone-600 px-4 leading-relaxed pt-1">
                    ※ 본 안내는 일상 건강 관리용 참고 정보이며, 질병의 진단이나 치료 목적이 아닙니다.
                  </p>
                </section>
              )}

              {/* ==========================================
                  TAB 3: 맞춤 추천 (PERSONALIZED DIET & COUPANG RECOMMENDATIONS)
                 ========================================== */}
              {activeTab === 'recommend' && (
                <section className="space-y-4">
                  {/* Stage Guide */}
                  <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4">
                    <div>
                      <p className="text-xs text-stone-500">
                        배변 기록 및 AI 분석 결과 기반 개인화 가이드
                      </p>
                      <h2 className="text-xl font-bold text-stone-900 mt-0.5">
                        오늘의 맞춤 식단 & 생활습관 추천
                      </h2>
                    </div>

                    <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                          <Utensils className="w-4 h-4 shrink-0 text-teal-700" />
                          <span>추천 다음 식사 · 간식 구성</span>
                        </div>
                        <p className="text-base font-bold text-stone-900">
                          찐 고구마, 골드 키위 1개, 따뜻한 미역국
                        </p>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-teal-200/80">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-teal-900">
                          <Clock className="w-4 h-4 shrink-0 text-teal-700" />
                          <span>오늘 실천할 맞춤 생활습관</span>
                        </div>
                        <p className="text-sm text-stone-700 leading-relaxed">
                          하루 6~8잔의 미지근한 물을 나누어 마시고 가볍게 산책해주세요.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4">
                    <div>
                      <p className="text-xs text-stone-500">
                        미배변 경과 일수별 맞춤 장 케어 식품
                      </p>
                      <h2 className="text-xl font-bold text-stone-900 mt-0.5">
                        단계별 추천 음식 & 쿠팡 구매
                      </h2>
                    </div>

                    {/* Filter Buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRecStageFilter('auto')}
                        className={`col-span-2 min-h-[48px] px-4 py-2.5 text-sm font-bold rounded-2xl border transition-colors cursor-pointer tabular-nums ${
                          recStageFilter === 'auto'
                            ? 'bg-teal-800 text-white border-teal-800'
                            : 'bg-stone-50 text-stone-800 border-stone-200'
                        }`}
                      >
                        현재 내 상태 맞춤 보기 ({activeStageMinDays}일 이상 단계)
                      </button>
                      {([2, 3, 4, 5] as const).map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => setRecStageFilter(stage)}
                          className={`min-h-[48px] px-3 py-2 text-sm font-bold rounded-2xl border transition-colors cursor-pointer tabular-nums ${
                            recStageFilter === stage
                              ? 'bg-teal-800 text-white border-teal-800'
                              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {stage}일 이상 미배변
                        </button>
                      ))}
                    </div>

                    {/* Stage description */}
                    <div className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200 space-y-1">
                      <p className="text-xs font-bold text-teal-900 tabular-nums">
                        {activeStageMinDays}일 이상 미배변 시 핵심 케어
                      </p>
                      <p className="text-sm text-stone-800 leading-relaxed font-medium">
                        {activeStageMinDays === 2 &&
                          '장의 수분을 늘리고 소화를 촉진하는 과일·양배추즙·발효유가 좋습니다.'}
                        {activeStageMinDays === 3 &&
                          '팽창성 식이섬유가 풍부한 식품으로 장 연동운동을 활발하게 깨워줍니다.'}
                        {activeStageMinDays === 4 &&
                          '장 속으로 수분을 끌어당겨 변을 부드럽게 녹여주는 푸룬주스·딥푸룬·팽이버섯차를 권장합니다.'}
                        {activeStageMinDays >= 5 &&
                          '고농축 푸룬 액티브, 아침 공복 올리브오일, 마그네슘 음료로 집중 수분·윤활 케어를 해주세요.'}
                      </p>
                    </div>
                  </div>

                  {/* Recommendation Cards */}
                  <div className="space-y-3.5">
                    {displayedRecommendations.map((item) => (
                      <article
                        key={item.id}
                        className="bg-white border border-stone-200 rounded-3xl p-5 space-y-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs text-stone-500 tabular-nums">
                            <span className="font-bold text-teal-800">
                              {item.minDays}일 이상 미배변
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{item.category}</span>
                          </div>

                          <h3 className="text-lg font-bold text-stone-900 leading-snug">
                            {item.title}
                          </h3>

                          {item.benefitText && (
                            <p className="text-sm font-bold text-teal-800">
                              {item.benefitText}
                            </p>
                          )}

                          <p className="text-sm text-stone-700 leading-relaxed pt-1">
                            {item.description}
                          </p>
                        </div>

                        <a
                          href={item.coupangUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full min-h-[54px] px-4 py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white text-base font-bold transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-xs"
                        >
                          <span>쿠팡에서 구매하기</span>
                          <ExternalLink className="w-4 h-4 shrink-0" />
                        </a>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </main>

        {/* ==========================================
            REQUIREMENT 8: BOTTOM SHEET (날짜 클릭 후 상세 기록)
           ========================================== */}
        {isBottomSheetOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end justify-center animate-in fade-in duration-200">
            <div className="w-full max-w-[480px] max-h-[90vh] bg-white rounded-t-[32px] p-5 sm:p-6 overflow-y-auto space-y-6 shadow-2xl flex flex-col">
              {/* Drag Handle & Header */}
              <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto -mt-1 mb-1 shrink-0" />

              <div className="flex items-center justify-between border-b border-stone-200 pb-4 shrink-0">
                <div>
                  <h2 className="text-[25px] sm:text-[27px] font-bold text-stone-900 tabular-nums leading-tight tracking-tight">
                    {formatMonthDay(selectedDate)} 배변 기록
                  </h2>
                  <p className="text-[14px] font-semibold text-stone-500 mt-0.5">
                    {formatKoreanDate(selectedDate)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setIsBottomSheetOpen(false);
                  }}
                  className="min-h-[48px] px-4 py-2 text-[16px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-900 rounded-2xl active:scale-[0.97] transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <X className="w-5 h-5" />
                  <span>닫기</span>
                </button>
              </div>

              {/* 1. 배변 여부 */}
              <div className="space-y-2.5">
                <label className="block text-[18px] font-bold text-stone-900">
                  1. 배변 여부
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditHasBowel(true)}
                    className={`min-h-[56px] rounded-2xl border-2 text-[18px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      editHasBowel
                        ? 'bg-teal-800 text-white border-teal-800 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 text-teal-300" />
                    <span>배변 완료 (O)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditHasBowel(false)}
                    className={`min-h-[56px] rounded-2xl border-2 text-[18px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      !editHasBowel
                        ? 'bg-stone-800 text-white border-stone-800 shadow-sm'
                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>미배변 (X)</span>
                  </button>
                </div>
              </div>

              {/* 2. 배변량: [ 적음 ] [ 보통 ] [ 많음 ] */}
              {editHasBowel && (
                <div className="space-y-2.5">
                  <label className="block text-[18px] font-bold text-stone-900">
                    2. 배변량 선택
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(
                      [
                        { key: 'small', label: '적음', sub: '소량 💩' },
                        { key: 'medium', label: '보통', sub: '보통 💩💩' },
                        { key: 'large', label: '많음', sub: '쾌변 💩💩💩' },
                      ] as const
                    ).map((opt) => {
                      const active = editAmount === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setEditAmount(opt.key)}
                          className={`min-h-[64px] px-2 py-3 rounded-2xl border-2 text-center flex flex-col items-center justify-center transition-all cursor-pointer active:scale-[0.98] ${
                            active
                              ? 'border-teal-700 bg-teal-50 text-teal-950 font-bold shadow-xs'
                              : 'border-stone-200 bg-stone-50/80 text-stone-700 hover:bg-stone-100 font-semibold'
                          }`}
                        >
                          <span className="text-[19px] leading-tight font-bold">{opt.label}</span>
                          <span
                            className={`text-[13px] mt-0.5 ${
                              active ? 'text-teal-800 font-bold' : 'text-stone-500'
                            }`}
                          >
                            {opt.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. 배변 시간 */}
              {editHasBowel && (
                <div className="space-y-2.5">
                  <label className="block text-[18px] font-bold text-stone-900">
                    3. 배변 시간
                  </label>
                  <div className="space-y-2">
                    <input
                      type="time"
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full min-h-[54px] px-4 py-3 text-[19px] font-mono font-bold border-2 border-stone-200 rounded-2xl bg-stone-50 text-stone-900 focus:outline-none focus:border-teal-700"
                    />
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: '아침 8시', val: '08:00' },
                        { label: '오전 10시', val: '10:00' },
                        { label: '오후 2시', val: '14:00' },
                        { label: '저녁 8시', val: '20:00' },
                      ].map((t) => (
                        <button
                          key={t.val}
                          type="button"
                          onClick={() => setEditTime(t.val)}
                          className={`min-h-[48px] py-2 px-2 text-[15px] font-bold rounded-xl border-2 transition-all cursor-pointer whitespace-nowrap ${
                            editTime === t.val
                              ? 'bg-teal-800 text-white border-teal-800'
                              : 'bg-white text-stone-800 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. 배변 주기 */}
              <div className="space-y-2.5">
                <label className="block text-[18px] font-bold text-stone-900">
                  {editHasBowel ? '4. 배변 주기' : '2. 현재 배변 주기'}
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {CYCLE_OPTIONS.map((cLabel) => (
                    <button
                      key={cLabel}
                      type="button"
                      onClick={() => setEditCycle(cLabel)}
                      className={`min-h-[52px] px-3.5 py-2.5 text-[16px] font-bold rounded-2xl border-2 transition-all cursor-pointer ${
                        editCycle === cLabel
                          ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                          : 'bg-stone-50 text-stone-800 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {cLabel}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. 배변 전 먹은 음식 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[18px] font-bold text-stone-900">
                    {editHasBowel ? '5. 배변 전 먹은 음식' : '3. 섭취한 음식'}
                  </label>
                  <span className="text-[14px] font-bold text-teal-800 tabular-nums">
                    {editFoods.length}개 선택됨
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {PRESET_FOOD_OPTIONS.map((item) => {
                    const selected = editFoods.includes(item.label);
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => toggleFoodOption(item.label)}
                        className={`min-h-[52px] px-3.5 py-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                          selected
                            ? item.type === 'good'
                              ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                              : 'bg-amber-900 text-white border-amber-900 shadow-xs'
                            : 'bg-stone-50 text-stone-900 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span className="text-[16px] font-bold truncate">{item.label}</span>
                        {selected && <Check className="w-5 h-5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleAddCustomFood} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customFoodInput}
                    onChange={(e) => setCustomFoodInput(e.target.value)}
                    placeholder="직접 음식 입력 (예: 된장찌개)"
                    className="flex-1 min-h-[52px] px-4 py-3 text-[16px] border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-teal-700"
                  />
                  <button
                    type="submit"
                    className="min-h-[52px] px-5 py-3 text-[16px] font-bold bg-stone-200 text-stone-900 rounded-2xl hover:bg-stone-300 transition-all cursor-pointer whitespace-nowrap"
                  >
                    + 추가
                  </button>
                </form>
              </div>

              {/* 6. 배변에 도움이 된 음식 또는 주스 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[18px] font-bold text-stone-900">
                    {editHasBowel ? '6. 배변에 도움이 된 음식 또는 주스' : '4. 장 건강에 도움된 음식/주스'}
                  </label>
                  <span className="text-[14px] font-bold text-teal-800 tabular-nums">
                    {editHelpfulFoods.length}개 선택됨
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {PRESET_HELPFUL_FOOD_OPTIONS.map((item) => {
                    const selected = editHelpfulFoods.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => toggleHelpfulOption(item)}
                        className={`min-h-[52px] px-3.5 py-2.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
                          selected
                            ? 'bg-teal-800 text-white border-teal-800 shadow-xs'
                            : 'bg-stone-50 text-stone-900 border-stone-200 hover:bg-stone-100'
                        }`}
                      >
                        <span className="text-[16px] font-bold truncate">{item}</span>
                        {selected && <Check className="w-5 h-5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleAddCustomHelpful} className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={customHelpfulFoodInput}
                    onChange={(e) => setCustomHelpfulFoodInput(e.target.value)}
                    placeholder="직접 입력 (예: 따뜻한 둥글레차)"
                    className="flex-1 min-h-[52px] px-4 py-3 text-[16px] border-2 border-stone-200 rounded-2xl bg-white focus:outline-none focus:border-teal-700"
                  />
                  <button
                    type="submit"
                    className="min-h-[52px] px-5 py-3 text-[16px] font-bold bg-stone-200 text-stone-900 rounded-2xl hover:bg-stone-300 transition-all cursor-pointer whitespace-nowrap"
                  >
                    + 추가
                  </button>
                </form>
              </div>

              {/* 7. 메모 */}
              <div className="space-y-2">
                <label className="block text-[18px] font-bold text-stone-900">
                  {editHasBowel ? '7. 메모' : '5. 메모'}
                </label>
                <textarea
                  rows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="예: 아침 산책 20분 후 편안하게 배변함"
                  className="w-full p-4 text-[17px] border-2 border-stone-200 rounded-2xl focus:outline-none focus:border-teal-700"
                />
              </div>

              {/* Save & Delete Buttons */}
              <div className="pt-2 space-y-3 pb-8">
                <button
                  type="button"
                  disabled={isAnalyzingAI}
                  onClick={() => handleSaveLog({ closeModal: true })}
                  className="w-full min-h-[58px] py-3.5 bg-teal-800 hover:bg-teal-900 text-white text-[19px] font-bold rounded-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-60"
                >
                  <Check className="w-6 h-6 text-teal-200" />
                  <span>{isAnalyzingAI ? '저장 중...' : '기록 저장하기'}</span>
                </button>

                {selectedLog && (
                  <div>
                    {!showDeleteConfirm ? (
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full min-h-[50px] py-2 text-[16px] font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl hover:bg-rose-100 active:scale-[0.98] transition-all cursor-pointer inline-flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>이 날짜 기록 삭제하기</span>
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-2.5 text-center">
                        <p className="text-[16px] font-bold text-rose-900">
                          정말 이 날짜의 기록을 삭제하시겠습니까?
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={handleDeleteLog}
                            className="min-h-[50px] py-2 bg-rose-700 text-white text-[16px] font-bold rounded-xl hover:bg-rose-800 transition-all cursor-pointer"
                          >
                            예, 삭제합니다
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(false)}
                            className="min-h-[50px] py-2 bg-white text-stone-800 border-2 border-stone-300 text-[16px] font-bold rounded-xl hover:bg-stone-100 transition-all cursor-pointer"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            FIXED 3-TAB BOTTOM NAVIGATION (Senior Height: 80px)
            [ 배변 달력 ]  [ AI분석 ]  [ 맞춤 추천 ]
           ========================================== */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-30 bg-white/98 backdrop-blur-md border-t-2 border-stone-200 grid grid-cols-3 h-20 px-3 py-2 gap-2 shadow-lg">
          <button
            type="button"
            onClick={() => {
              setIsAdminOpen(false);
              setActiveTab('calendar');
            }}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl cursor-pointer transition-all active:scale-[0.97] ${
              !isAdminOpen && activeTab === 'calendar'
                ? 'bg-teal-50 text-teal-950 font-black border-2 border-teal-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 font-bold'
            }`}
          >
            <CalendarIcon className="w-7 h-7 text-teal-700" />
            <span className="text-[16px] whitespace-nowrap">배변 달력</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAdminOpen(false);
              setActiveTab('ai');
            }}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl cursor-pointer transition-all active:scale-[0.97] ${
              !isAdminOpen && activeTab === 'ai'
                ? 'bg-teal-50 text-teal-950 font-black border-2 border-teal-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 font-bold'
            }`}
          >
            <Sparkles className="w-7 h-7 text-teal-700" />
            <span className="text-[16px] whitespace-nowrap">AI분석</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsAdminOpen(false);
              setActiveTab('recommend');
            }}
            className={`flex flex-col items-center justify-center gap-1 rounded-2xl cursor-pointer transition-all active:scale-[0.97] ${
              !isAdminOpen && activeTab === 'recommend'
                ? 'bg-teal-50 text-teal-950 font-black border-2 border-teal-300 shadow-xs'
                : 'text-stone-600 hover:text-stone-900 font-bold'
            }`}
          >
            <ShoppingBag className="w-7 h-7 text-teal-700" />
            <span className="text-[16px] whitespace-nowrap">맞춤 추천</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
