# TASKON - Gemini API + Vercel

## 구성
- `index.html`: TASKON 웹 앱
- `api/ai.js`: Vercel 서버리스 함수. Gemini API를 호출하며 API 키는 서버 환경변수로만 관리합니다.

## GitHub 업로드
압축을 푼 폴더 안의 파일과 `api` 폴더를 저장소 최상위(root)에 업로드합니다. ZIP 파일 자체를 저장소에 올리지 마세요.

## Vercel 배포
1. Vercel에서 GitHub 저장소를 Import합니다.
2. Framework Preset은 `Other`, Root Directory는 `./`로 둡니다.
3. Deploy 전에 Settings → Environment Variables에 아래 값을 추가합니다.
   - `GEMINI_API_KEY`: Google AI Studio에서 발급한 Gemini API 키 (필수)
   - `GEMINI_MODEL`: `gemini-2.5-flash` (선택, 기본값)
4. Deploy합니다. 이미 배포했다면 환경변수 저장 후 Deployments에서 Redeploy합니다.

## API 키 발급
https://aistudio.google.com/apikey

## 참고
- Gemini API 무료 등급은 모델 및 사용량 한도가 있으며, 한도 초과 시 잠시 요청이 제한될 수 있습니다.
- 무료 등급에서는 제출한 콘텐츠가 Google 제품 및 서비스 개선에 사용될 수 있습니다. 실제 개인정보나 민감한 자료를 업로드하지 않도록 안내하세요.
- TASKON의 데모 로그인 및 과제 데이터는 브라우저 localStorage 기반입니다. 실제 계정 인증이나 기기 간 동기화 기능은 아닙니다.
- 공개 서비스로 널리 배포하기 전에는 사용자 인증, 요청 횟수 제한, 데이터 보호 기능을 추가하세요.
