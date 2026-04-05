/**
 * 떠나볼까? iOS shell용 Capacitor 기본 설정.
 * App Store 제출 전에는 실제 번들 식별자에 맞춰 appId를 교체해야 한다.
 */
const config = {
  appId: "kr.soogo.tteonabolkka",
  appName: "떠나볼까?",
  webDir: "apps/ios-shell/out",
  server: {
    iosScheme: "capacitor",
  },
};

export default config;
