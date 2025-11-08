// src/utils/buildSajuPrompt.jsx
// 출생 사주 4주 + 확장 메타(용신/육친/신살/격국/오행분포 등)를 받아
// OpenAI messages 배열을 생성합니다. 캐시키는 별도(호출부)에서 주입.

export function makeSajuAnalysisMessages({ ensured, finalMeta, todayStr, briefMax = 8 }) {
  // UI/SEO 텍스트가 아니라 모델에 주는 압축 브리핑
  const brief =
    [
      '요약 요구사항:',
      `- 섹션 ${briefMax}개: ①총평 ②성향 ③재물 ④직업/학업 ⑤관계/가족 ⑥건강/리듬 ⑦시기론(대운·세운 관점) ⑧주의`,
      '- 전문 용어는 과장 금지, 불필요한 공포 조장 금지.',
      '- 반드시 제공 JSON의 간지/십성/합충형해파/오행분포/용신 추천만 근거로 서술.',
      '- JSON에 없는 간지·점수·절대 단언 생성 금지, 외부 지식/추정 금지.',
      '- 각 항목은 300~600자, 반복/상투어 피하고 구체 사례 위주.',
    ].join(' ');

  const payloadForAI = JSON.stringify(
    {
      birth: {
        calendar: ensured.calendar,
        y: ensured.year,
        m: ensured.month,
        d: ensured.day,
        hh: ensured.hour ?? 0,
        mm: ensured.minute ?? 0,
        gender: ensured.gender || 'unknown',
        solarDate: ensured.solarDate || null,
        leapMonth: ensured.leapMonth || (ensured.isLeap ? 'leap' : 'common'),
      },
      pillars: ensured.sajuResult, // {year, month, day, hour: {stem, branch, element, ...}}
      meta: finalMeta, // 용신, 육친(십성), 신살, 격국, 오행 분포 등
      todayKST: todayStr, // 조회일(표시/나이용, 계산엔 사용 안 함)
      mbti: (ensured.mbti || '').toUpperCase(),
    },
    null,
    2
  );

  const systemPrompt =
    '당신은 신중한 한국어 명리 해설가입니다. ' +
    '오직 제공된 JSON의 4주, 오행분포, 십성(육친), 격국/용신, 신살, 합충형해파만을 근거로 서술하세요. ' +
    '추정/가정 금지, 새로운 간지/점수 생성 금지, 과도한 점괘식 표현 금지. ' +
    '조언은 구체적이되 과장 금지.';

  const userPrompt = [
    '분석 JSON:',
    '```json',
    payloadForAI,
    '```',
    '',
    '요구사항:',
    brief,
    '',
    '출력 형식:',
    '- 소제목은 굵게(예: **총평**).',
    '- 항목 사이에 빈 줄 1개.',
  ].join('\n');

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}
