// Clinical case definitions are plain data so more cases can be added without
// touching the flow engine (src/case/CaseFlow.jsx). Scene keys refer to the
// pose / camera / overlay presets the engine knows about.
export const CASE_01 = {
  id: 'case01',
  title: '좌측 요통과 하지 저림',
  patient: { age: 42, sex: '남성', job: '사무직' },
  chiefComplaint: '3주 전 이사 중 무거운 상자를 들다가 시작된 좌측 허리 통증. 1주 전부터 왼쪽 종아리 바깥쪽과 발등이 저림.',
  history: [
    '앉았다 일어설 때, 허리를 앞으로 굽힐 때 통증이 심해짐',
    '서 있으면 몸이 왼쪽으로 기우는 느낌이 든다고 함',
    '기침·재채기 시 허리로 통증이 퍼짐',
    '과거력 특이사항 없음, 진통제로 부분 호전',
  ],
  goals: ['정적 자세에서 체간 정렬과 요추 만곡을 관찰한다', '능동 고관절 굴곡 시 요추·골반의 보상 여부를 확인한다', '저림 부위를 피부분절로 해석한다'],
  steps: [
    {
      id: 'intro',
      type: 'info',
      title: '환자 정보',
      scene: { pose: 'standing', camera: 'threeQuarter' },
    },
    {
      id: 'posture',
      type: 'posture',
      title: '정적 자세 관찰',
      instruction:
        '환자를 뒤에서 관찰합니다(환자의 왼쪽이 화면 왼쪽). 추선과 어깨선·골반선을 기준으로 체간 정렬과 요추 만곡을 판단한 뒤 소견을 선택하세요. "정상 자세와 비교" 버튼으로 기준 자세를 겹쳐 볼 수 있습니다.',
      scene: { pose: 'listLeft', comparePose: 'normalPosture', camera: 'back', guides: true },
      questions: [
        {
          id: 'alignment',
          prompt: '체간 정렬',
          options: [
            { id: 'normal', label: '정상 정렬' },
            { id: 'left', label: '좌측 체간 측방 편위(list)' },
            { id: 'right', label: '우측 체간 측방 편위' },
          ],
          answer: 'left',
        },
        {
          id: 'lordosis',
          prompt: '요추 만곡',
          options: [
            { id: 'normal', label: '정상 전만' },
            { id: 'reduced', label: '전만 감소(편평)' },
            { id: 'increased', label: '전만 증가' },
          ],
          answer: 'reduced',
        },
      ],
      feedback:
        '어깨선의 중점이 추선에서 왼쪽으로 이동해 있고 골반선은 추선 위에 남아 있으므로 좌측 측방 편위입니다. 요추 부위가 편평하고 골반이 약간 후방경사되어 전만이 감소했습니다. 통증 회피성 측방 편위(antalgic list)는 요추 추간판 병변에서 흔히 관찰됩니다.',
    },
    {
      id: 'hip',
      type: 'movement',
      title: '능동 고관절 굴곡 검사',
      instruction:
        '선 자세에서 왼쪽 무릎을 들어 올리게 합니다. "검사 시행"을 누르면 동작이 재생됩니다. 측면에서 골반과 요추가 어떻게 움직이는지 관찰하고, "정상 패턴과 비교"로 기준 동작을 확인한 뒤 소견을 선택하세요.',
      scene: { camera: 'left' },
      questions: [
        {
          id: 'pattern',
          prompt: '관찰된 움직임 패턴',
          options: [
            { id: 'isolated', label: '고관절 단독 움직임, 요추 중립 유지(정상)' },
            { id: 'posterior', label: '골반 후방경사와 요추 굴곡으로 보상' },
            { id: 'anterior', label: '골반 전방경사와 요추 신전으로 보상' },
          ],
          answer: 'posterior',
        },
      ],
      feedback:
        '대퇴는 정상과 같은 높이까지 올라가지만 골반이 뒤로 말리고(후방경사 25°) 허리가 둥글어지며(요추 굴곡 32°), 실제 고관절 굴곡은 70°에 그칩니다. 고관절 굴곡 초반부터 요추가 먼저 움직이는 것이 특징으로, 고관절 가동 제한 또는 통증 회피에 의한 요추 보상 패턴입니다.',
    },
    {
      id: 'sensory',
      type: 'sensory',
      title: '감각 검사',
      instruction:
        '환자가 저림을 호소하는 부위가 색으로 표시되어 있습니다. 종아리 바깥쪽에서 발등, 엄지·둘째·셋째 발가락으로 이어지는 이 분포에 해당하는 피부분절을 선택하세요.',
      scene: { pose: 'standing', camera: 'lowerLeg', dermatome: 'overlay' },
      questions: [
        {
          id: 'dermatome',
          prompt: '피부분절',
          options: [
            { id: 'L4', label: 'L4 — 하퇴 내측, 내측 발목' },
            { id: 'L5', label: 'L5 — 하퇴 외측, 발등, 엄지발가락' },
            { id: 'S1', label: 'S1 — 발 외측, 발바닥, 새끼발가락' },
          ],
          answer: 'L5',
        },
      ],
      feedback:
        '하퇴 외측에서 발등을 지나 엄지~셋째 발가락에 이르는 분포는 L5 피부분절입니다. L4는 하퇴 내측과 내측 발목, S1은 발 외측과 발바닥·새끼발가락을 담당합니다.',
    },
    {
      id: 'summary',
      type: 'summary',
      title: '종합',
      scene: { pose: 'standing', camera: 'threeQuarter' },
      interpretation: [
        '좌측 항통성 측방 편위와 요추 전만 감소',
        '고관절 굴곡 시 골반 후방경사·요추 굴곡 보상 패턴',
        '좌측 L5 피부분절 분포의 감각 이상',
      ],
      nextSteps:
        '세 소견은 좌측 L5 신경근 자극을 시사하는 방향으로 일관됩니다. 다음 단계로 SLR 검사, L5 근력(장무지신근·발목 배측굴곡), 반사 검사와 요추 굴곡·신전 방향 선호도 평가를 권장합니다. (교육용 시뮬레이션이며 실제 진단을 대체하지 않습니다.)',
    },
  ],
}
