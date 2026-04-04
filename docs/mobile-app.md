# 모바일 앱 전환 가이드

이 프로젝트는 현재 설치형 웹앱(PWA)이며, `Capacitor` 설정까지 추가되어 있어 Android/iOS 래퍼 앱으로 확장할 수 있습니다.

## 준비 사항

- Node.js 18 이상
- npm
- Android Studio
- Xcode (iOS 빌드 시, macOS 필요)

## 설치

```bash
npm install
```

## 웹 빌드 + Capacitor 동기화

```bash
npm run mobile:build
```

## Android 프로젝트 생성 및 열기

최초 1회:

```bash
npx cap add android
```

이후 Android Studio 열기:

```bash
npm run mobile:android
```

## iOS 프로젝트 생성 및 열기

최초 1회:

```bash
npx cap add ios
```

이후 Xcode 열기:

```bash
npm run mobile:ios
```

## 권장 다음 단계

- 스플래시 화면과 앱 아이콘을 네이티브 리소스로 교체
- 지도 링크를 외부 브라우저 대신 앱 내 WebView 또는 네이티브 지도 연동으로 전환
- 찜 목록을 로컬 스토리지에서 네이티브 저장소 플러그인으로 이전
- 푸시 알림이나 위치 기반 추천이 필요하면 Capacitor 플러그인 추가
