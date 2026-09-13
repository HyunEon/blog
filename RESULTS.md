# 구현 결과

## 구현 범위

- Nuxt 4 + TypeScript + Tailwind CSS 4 + 공식 shadcn-vue 컴포넌트.
- Cloudflare Workers 배포 설정, D1 스키마/마이그레이션, 로컬 D1 개발 환경.
- 공개 홈, 글 상세, 카테고리별 목록과 페이지네이션.
- `/admin` 아래 글 생성·조회·수정·삭제, 초안/공개 전환, 카테고리 CRUD.
- `/admin` 및 `/api/admin/*`의 서버 측 Access JWT 검증, 관리자 캐시 차단, 쓰기 요청의 출처·JSON·입력 검증.
- 공개 API 60초 캐시, 목록 20개 제한, prepared statements와 조회 인덱스.

## 디자인 컨벤션

좌우는 비어 있고 중앙에 제목, 카테고리 바, 본문, 푸터를 배치했습니다. 공식 shadcn-vue CLI로 Button, Input, Textarea, Label, Select, Separator, AlertDialog를 추가했습니다. UI 소스는 `app/components/ui`에 있습니다.

별도 커스텀 UI가 필요한 항목은 없습니다. 본문 편집은 기본 Textarea를 사용하며 일반 텍스트로 저장합니다. 리치 텍스트 편집기나 이미지 업로드를 추가할 경우, 기본 컴포넌트만으로 충족할 수 있는지 먼저 검토하고 불가피한 커스터마이징을 이 파일에 기록해야 합니다.

요청한 `yetone/kill-ai-slop` 스킬은 `/tmp/blog-skills/kill-ai-slop`에 받아 읽고 적용했습니다. 전역 영구 설치는 하지 않았습니다. 빈 프로젝트 초기 검사에서 검출은 0개였습니다. 구현 후 앱 코드 검사에서 카테고리 관리 제목 크기와 폼 간격 두 항목이 후보로 나왔으며, 관리 화면의 제목 계층과 반복 입력 필드의 동일 간격이라는 목적이 있어 유지했습니다. 데스크톱 및 390px 모바일 스크린샷을 직접 확인했습니다.

## 검증

- `pnpm test`: 성공. ESLint, Nuxt TypeScript 검사, Playwright 6개 테스트 통과.
- 테스트는 mock DB가 아닌 Wrangler 로컬 D1을 사용하며 `.wrangler/test`에 개발 데이터와 분리합니다.
- 검증 범위: 포스트/카테고리 POST·PUT·DELETE, 관리자 페이지와 GET API 비인증 차단, 잘못된 토큰, 중복 slug, 잘못된 입력, 외래키, CSRF, 초안 비공개, HTML 이스케이프, 브라우저 작성·수정·삭제와 삭제 취소, 모바일 가로 넘침, 카테고리 탐색, 페이지네이션, 60초 캐시 만료.
- Access JWT 검증기에 실제 테스트용 RSA 서명을 사용해 정상 토큰과 잘못된 서명·발급자·audience·만료를 검증했습니다.
- `pnpm build`: 성공. Cloudflare Workers용 번들 생성 완료.
- `pnpm test:worker`: 성공. 실제 로컬 workerd에서 SSR, JavaScript 정적 자산, D1 읽기, 관리자 경로 및 POST/PUT/DELETE 인증 차단을 확인했습니다.
- 운영 번들에서 개발용 토큰 문자열과 Wrangler 개발 프록시가 제거된 것을 검사했고, 개발 토큰을 환경변수·헤더·쿠키로 넣어도 운영 관리자 접근이 401로 차단되는 것을 확인했습니다.

이 WSL에는 Chromium 라이브러리와 한글 폰트가 없었습니다. 시스템 설치는 sudo 비밀번호 요구로 실패해, 승인된 다운로드로 `/tmp/blog-browser-libs`에 Ubuntu 패키지를 풀어 검증했습니다. 이 환경에서 사용한 명령은 아래와 같습니다.

```bash
FONTCONFIG_FILE=/tmp/blog-browser-libs/fonts.conf \
LD_LIBRARY_PATH=/tmp/blog-browser-libs/root/usr/lib/x86_64-linux-gnu \
pnpm test
```

일반적인 WSL에서는 `pnpm exec playwright install --with-deps chromium`을 먼저 실행하면 됩니다. 위 `/tmp` 파일은 프로젝트 의존성에 포함되지 않습니다.

## 실제 배포 (2026-09-13)

- 공개 주소: https://blog.hyuneon.org
- Worker: `personal-blog`
- 배포 버전: `e14d4b1f-daa9-40f8-828e-159211af6a7b`
- 원격 D1: `personal-blog` (`e57a098e-bee4-40f3-8d94-09e88a883502`, APAC)
- 원격 마이그레이션 `0001_initial.sql` 적용 완료.
- 실제 HTTPS 홈, `/api/posts`, `/api/categories` 모두 200 확인.
- 관리자 페이지, 관리자 API GET, 포스트/카테고리 POST·PUT·DELETE의 비인증 요청 모두 401 확인.
- 공개 API `max-age=60`, 관리자 응답 `private, no-store` 확인.
- 로컬 콘텐츠를 원격으로 복사하지 않았으며 원격 DB에는 아직 글이 없습니다.

### 남은 작업: Cloudflare Access 로그인 연결

현재 OAuth 로그인으로 Access 조직 조회 및 애플리케이션 생성 시 Cloudflare API가 403을 반환했습니다. Access 애플리케이션은 생성되지 않았습니다. `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD`는 비어 있으며 관리자는 누구도 접속할 수 없는 상태입니다. 이는 애플리케이션 서버의 인증 차단이고, 아직 Cloudflare Access 로그인 화면으로 연결되지는 않습니다.

Cloudflare Zero Trust 대시보드에서 다음 설정으로 Self-hosted 애플리케이션을 생성해야 합니다.

- 이름: `Personal Blog Admin`
- 보호 경로: `blog.hyuneon.org/admin`, `blog.hyuneon.org/admin/*`, `blog.hyuneon.org/api/admin`, `blog.hyuneon.org/api/admin/*`
- 하나의 애플리케이션에 위 경로를 모두 등록해 동일 AUD 사용.
- Allow 정책의 Include Emails: 관리자 본인의 이메일. 현재 배포 계정은 `gusdjs21@gmail.com`.
- 로그인 방식: 이메일 One-time PIN 또는 이미 설정한 로그인 제공자.
- 공개 루트 `blog.hyuneon.org` 전체를 보호 대상으로 등록하지 않음.

이후 Team domain과 앱의 Application Audience(AUD)를 `wrangler.jsonc`에 입력하고 `pnpm deploy`로 재배포합니다. 실제 로그인 후 원격 CRUD 검증이 남아 있습니다.

요청의 첫 `/edit` 표기보다 상세 라우팅 표를 기준으로 `/admin`과 `/api/admin/*`를 보호하도록 구현했습니다.

공개된 글을 수정·삭제·비공개 전환해도 이전 공개 내용이 최대 60초 캐시에 남을 수 있습니다. 영구 삭제된 글은 복구 기능이 없습니다.
