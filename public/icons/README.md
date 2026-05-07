# Brand Icons

소셜 로그인 버튼 아이콘. **다른 곳에 재사용하지 마세요.**

| 파일 | 출처 | 라이선스 / 사용 조건 |
|------|------|---------------------|
| `google-g.svg` | [Google Identity branding zip](https://developers.google.com/static/identity/images/signin-assets.zip) (`signin-assets/Android/svg/light/android_light_sq_SI.svg`에서 G 로고 path 추출) | [Google Branding Guidelines](https://developers.google.com/identity/branding-guidelines) — 비율 유지 필수, 단색 변환·리컬러 금지 |
| `kakao-symbol.svg` | **임시 근사 SVG** (chat bubble) | 정식 게시 전 반드시 [Kakao Developers Tool → 리소스 다운로드](https://developers.kakao.com/tool/resource/login) (button.zip)에서 추출한 공식 심볼로 교체 |

## Kakao 심볼 교체 절차

1. Kakao Developers 콘솔 로그인 → Tool → 리소스 다운로드 → 카카오 로그인 버튼
2. `kakao_login_*.zip` 다운로드 → PSD 또는 PNG에서 말풍선 심볼 추출
3. SVG로 변환(또는 PNG 그대로 사용 가능)하여 본 파일 덮어쓰기
4. `social-auth-buttons.tsx`에서 색상은 `currentColor`로 두고 부모에서 색 지정

> 가이드 핵심: 배경 `#FEE500` 고정 / 텍스트 `#000000` 85% / `border-radius: 12px` / 말풍선 심볼 + "카카오 로그인" 텍스트 변경 금지.
