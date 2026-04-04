# 부산 미리한끼

부산 광안리와 인근 지역 맛집을 감각적으로 탐색할 수 있는 React + Vite 기반 웹앱입니다.

## 포함된 개선 사항

- CDN/Babel 기반 단일 HTML을 유지보수 가능한 React 프로젝트 구조로 리팩터링
- 클라이언트에 직접 노출되던 외부 AI API 호출 제거
- 모바일 하단 내비게이션, 지도 레이아웃, 상세 모달 구조 개선
- 데이터와 UI 코드 분리로 GitHub 업로드 및 협업 준비

## 시작하기

```bash
npm install
npm run dev
```

## 빌드

```bash
npm run build
```

## 구조

- `src/App.jsx`: 화면 흐름과 상태 관리
- `src/data/restaurants.js`: 맛집 데이터와 필터 옵션
- `src/styles.css`: 전체 스타일 시스템

## 메모

현재 추천 기능은 외부 LLM 호출 없이, 입력 키워드와 태그 기반 점수화 방식으로 동작합니다.
서버를 붙일 계획이라면 이 추천 로직을 API 레이어로 분리하는 것을 권장합니다.
