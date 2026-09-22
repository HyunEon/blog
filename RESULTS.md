# 구현 결과

## 구현 범위

- Nuxt 4 + TypeScript + Tailwind CSS 4 + 공식 shadcn-vue 컴포넌트.
- Cloudflare Workers 배포 설정, D1 스키마/마이그레이션, 로컬 D1 개발 환경.
- 공개 홈, 글 상세, 카테고리별 목록과 페이지네이션.
- `/admin` 아래 글 생성·조회·수정·삭제, 초안/공개 전환, 카테고리 CRUD.
- `/admin` 및 `/api/admin/*`의 서버 측 Access JWT 검증, 관리자 캐시 차단, 쓰기 요청의 출처·JSON·입력 검증.
- 공개 API 60초 캐시, 목록 20개 제한, prepared statements와 조회 인덱스.

## 디자인 컨벤션

좌우는 비어 있고 중앙에 제목, 카테고리 바, 본문, 푸터를 배치했습니다. 공식 shadcn-vue CLI로 Button, Input, Textarea, Label, Select, Separator, AlertDialog, Tabs를 추가했습니다. UI 소스는 `app/components/ui`에 있습니다.

사용자의 명시적인 Milkdown 교체 요청에 따라 본문 편집기만 shadcn-vue 기본 컴포넌트 제한의 예외로 처리했습니다. 본문은 Milkdown Crepe의 기본 Frame 테마를 사용하며, 나머지 입력·선택·탭·버튼은 shadcn-vue를 유지합니다. Milkdown 자체 소스는 수정하지 않았으며, 별도 사용자 승인을 받은 모바일 여백만 조정했습니다. 원문은 D1에 저장하고 markdown-it(html: false)과 Tailwind Typography로 미리보기 및 공개 본문을 렌더링합니다. 추가 편집기 커스터마이징이나 이미지 업로드를 추가할 경우, 기본 컴포넌트만으로 충족할 수 있는지 먼저 검토하고 불가피한 커스터마이징을 이 파일에 기록해야 합니다.

요청한 `yetone/kill-ai-slop` 스킬은 `/tmp/blog-skills/kill-ai-slop`에 받아 읽고 적용했습니다. 전역 영구 설치는 하지 않았습니다. 빈 프로젝트 초기 검사에서 검출은 0개였습니다. 구현 후 앱 코드 검사에서 카테고리 관리 제목 크기와 폼 간격 두 항목이 후보로 나왔으며, 관리 화면의 제목 계층과 반복 입력 필드의 동일 간격이라는 목적이 있어 유지했습니다. 데스크톱 및 390px 모바일 스크린샷을 직접 확인했습니다.

## 검증

- `pnpm test`: 성공. ESLint, Nuxt TypeScript 검사, Playwright 7개 테스트 통과. 마지막 표 레이아웃·입력 안내 변경 후 브라우저 CRUD 테스트도 별도로 다시 통과했습니다.
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
- 배포 버전: `b63b6cb4-0c0e-4648-b516-45e28a664881` (Markdown 편집기 반영 버전)
- 원격 D1: `personal-blog` (`e57a098e-bee4-40f3-8d94-09e88a883502`, APAC)
- 원격 마이그레이션 `0001_initial.sql` 적용 완료.
- 실제 HTTPS 홈, `/api/posts`, `/api/categories` 모두 200 확인.
- 관리자 페이지, 관리자 API GET, 포스트/카테고리 POST·PUT·DELETE의 비인증 요청 모두 401 확인.
- 공개 API `max-age=60`, 관리자 응답 `private, no-store` 확인.
- 로컬 콘텐츠를 원격으로 복사하지 않았으며 원격 DB에는 아직 글이 없습니다.

### Cloudflare Access 설정

Team domain `hyuneon.cloudflareaccess.com`과 사용자가 제공한 AUD를 Worker에 반영했습니다. JWKS 공개 키 엔드포인트 200 응답과 Access 로그인 리디렉션의 AUD 일치를 확인했습니다.

최종 배포 후 공개 홈·JavaScript 자산·공개 글 API는 200, `/admin/posts/new` 및 관리 API는 동일 AUD의 Access 로그인으로 302, 정확한 `/admin` 경로는 서버 인증 차단 401을 반환했습니다. `/admin/*`와 별개로 `/admin`도 Access 보호 대상에 추가해야 합니다. 동일 Access 앱에 다음 네 경로를 모두 유지해야 합니다.

- `blog.hyuneon.org/admin`
- `blog.hyuneon.org/admin/*`
- `blog.hyuneon.org/api/admin`
- `blog.hyuneon.org/api/admin/*`

현재 OAuth 권한으로 도메인 단위 Access 앱 조회/수정은 불가능합니다. 실제 로그인 후 원격 CRUD 검증은 사용자 계정 인증이 필요합니다.

### Markdown 및 요약

- 본문 Textarea를 Milkdown Crepe로 교체했습니다. shadcn-vue Tabs의 작성/미리보기 구조는 유지합니다.
- Nuxt 클라이언트 전용 컴포넌트로 로드하며, DOM 준비 후 초기화하고 페이지 이탈 시 편집기를 파기합니다. 초기화 실패 시 저장을 막고 오류를 안내합니다.
- 저장 시 Milkdown에서 Markdown을 동기적으로 읽어 마지막 입력 누락을 방지합니다. 미리보기 전환 시에도 편집기를 유지합니다.
- AI·수식·이미지 업로드는 비활성화했습니다. 파일 붙여넣기/드롭으로 임시 blob URL이 저장되지 않도록 업로드 처리를 차단했습니다.
- 미리보기와 공개 페이지가 동일 렌더러를 사용합니다. 제목, 강조, 목록, 링크, 코드 블록, 표를 지원합니다.
- raw HTML 비활성화, 위험한 링크 프로토콜 차단. 원문 왕복 저장과 빈 본문 제출 검사를 추가했습니다.
- 요약은 선택 입력으로 유지하고 용도를 입력란에 안내합니다. 목록 소개문, 상세 페이지 도입문, 검색엔진 description에 사용하며 목록 API에서 본문 전체를 가져오지 않게 합니다. 요약 자동 생성은 하지 않습니다.
- Markdown 변경에는 DB 마이그레이션이 필요 없습니다. 기존 본문도 Markdown으로 해석되므로 `#`, `*` 등의 문법이 서식으로 표시될 수 있습니다.

요청의 첫 `/edit` 표기보다 상세 라우팅 표를 기준으로 `/admin`과 `/api/admin/*`를 보호하도록 구현했습니다.

공개된 글을 수정·삭제·비공개 전환해도 이전 공개 내용이 최대 60초 캐시에 남을 수 있습니다. 영구 삭제된 글은 복구 기능이 없습니다.

### Milkdown 모바일 조정 — 사용자 승인

Milkdown 기본 테마의 `.milkdown .ProseMirror`는 `padding: 60px 120px`를 사용합니다. 390px 화면에서 편집 내용이 가로로 넘치는 것을 Playwright로 확인했습니다. 사용자에게 확인한 뒤 모바일 여백 조정을 승인받았습니다.

모바일(640px 이하)에서 이 편집기의 여백만 `24px 32px`로 줄이고 폼에 `min-width: 0`을 적용했습니다. 색상·폰트·툴바는 Milkdown 기본값을 유지합니다.
