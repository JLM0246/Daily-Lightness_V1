import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.post('/api/ai/feedback', async (req, res) => {
  try {
    const {
      date,
      amount,
      hasBowelMovement,
      foods = [],
      previousDayFoods = [],
      note = '',
      elapsedDays = 0,
    } = req.body;

    const ai = getAiClient();

    const amountLabel =
      !hasBowelMovement || amount === 'none'
        ? '미배변 (식단 및 컨디션만 기록)'
        : amount === 'small'
        ? '소 (💩 약간/적음)'
        : amount === 'medium'
        ? '중 (💩💩 보통/원활)'
        : '대 (💩💩💩 쾌변/충분함)';

    const prompt = `
당신은 50~70대 시니어 분들의 장 건강을 가족처럼 다정하게 챙겨드리는 건강 도우미입니다.
시니어 사용자가 한눈에 3초 안에 이해할 수 있도록 복잡한 분석 보고서 형식 대신 아주 짧고 직관적인 한국어 문장으로만 답변해 주세요.

[핵심 3가지 원칙]
1. 내 배변 상태가 어떤지 (아주 짧은 문장 2개: 주기 상태와 한 줄 권고)
2. 오늘 무엇을 먹으면 좋은지 (최대 3개 음식: 키위, 고구마, 오트밀 등)
3. 오늘 무엇을 하면 좋은지 (딱 1가지 실천 행동: 예: 물 챙겨 마시기, 채소 추가하기, 산책하기)

[기록 정보]
- 기록 날짜: ${date}
- 오늘 배변 상태: ${amountLabel}
- 현재 미배변 경과 일수: ${elapsedDays}일째
- 당일 섭취한 음식: ${foods.length > 0 ? foods.join(', ') : '입력된 음식 없음'}
- 전날 섭취한 음식: ${previousDayFoods.length > 0 ? previousDayFoods.join(', ') : '전날 기록 없음'}
- 건강 메모: ${note || '없음'}

다음 JSON 스키마에 맞춰 응답을 작성해 주세요:
1. bowelStatusHeadline: 최근 배변 주기 상태를 나타내는 가장 짧은 문장 (예: "2~3일 간격이에요." 또는 "비교적 일정해요." 또는 "기록을 쌓는 중이에요.")
2. bowelStatusTip: 사용자가 취해야 할 태도 1문장 (예: "조금 더 자주 확인해 주세요." 또는 "지금처럼 관리해보세요.")
3. recommendedFoods: 오늘 추천할 음식 최대 3개 목록 (name, emoji, reason(아주 짧은 한 줄 설명. 예: "식이섬유를 챙길 수 있어요."))
4. todayActionTip: 오늘 실천할 딱 1가지 행동 문장 (예: "오늘은 물을 조금 더 챙겨 마셔보세요. 💧" 또는 "오늘 식사에 채소를 조금 추가해보세요. 🥬" 또는 "오늘은 가볍게 산책해보세요. 🚶")
5. summary: 위 내용을 종합한 친절한 한 줄 문장
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: '종합 한 줄 요약',
            },
            bowelStatusHeadline: {
              type: Type.STRING,
              description: '배변 상태 핵심 문장 (예: 2~3일 간격이에요.)',
            },
            bowelStatusTip: {
              type: Type.STRING,
              description: '상태 권고 한 줄 (예: 조금 더 자주 확인해 주세요.)',
            },
            recommendedFoods: {
              type: Type.ARRAY,
              description: '최대 3개 추천 음식',
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  emoji: { type: Type.STRING },
                  reason: { type: Type.STRING, description: '짧은 한 줄 설명' },
                  tag: { type: Type.STRING },
                },
                required: ['id', 'name', 'emoji', 'reason', 'tag'],
              },
            },
            todayActionTip: {
              type: Type.STRING,
              description: '오늘 실천할 딱 1가지 행동 문장',
            },
          },
          required: [
            'summary',
            'bowelStatusHeadline',
            'bowelStatusTip',
            'recommendedFoods',
            'todayActionTip',
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error('AI 응답이 비어 있습니다.');
    }

    const parsed = JSON.parse(text.trim());
    res.json(parsed);
  } catch (error: any) {
    console.error('AI Feedback Error:', error);
    res.status(500).json({
      error: error?.message || 'AI 식단 분석 중 오류가 발생했습니다.',
    });
  }
});

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
