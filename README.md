# 개인 블로그

Nuxt 4, TypeScript, Tailwind CSS 4, shadcn-vue, Cloudflare Workers와 D1으로 구성한 개인 블로그입니다. 글과 카테고리는 웹에서 생성·조회·수정·삭제합니다. 본문은 일반 텍스트이며 줄바꿈을 유지하고 HTML을 실행하지 않습니다.

## 로컬 실행 (VS Code / WSL)

Node.js 24 LTS와 pnpm 11을 사용합니다.

```bash
pnpm install
pnpm db:migrate
BLOG_DEV_TOKEN=choose-a-local-token pnpm dev
```

`http://127.0.0.1:3000`을 열고 개발자 도구 콘솔에서 아래 쿠키를 설정한 다음 `/admin`으로 이동합니다. 토큰은 위 환경변수 값과 일치해야 합니다.

```js
document.cookie = 'blog-dev-token=choose-a-local-token; Path=/; SameSite=Lax'
location.href = '/admin'
```

개발 서버는 127.0.0.1에만 바인딩합니다. 개발용 토큰은 `import.meta.dev` 분기 안에 있어 운영 빌드에는 포함되지 않습니다. 토큰을 설정하지 않으면 로컬 관리자 접근도 차단합니다. 로컬 D1 데이터는 `.wrangler/state`에 저장합니다.

## 경로

| 영역 | 경로 |
| --- | --- |
| 공개 | `/`, `/posts/[slug]`, `/category/[slug]` |
| 관리자 | `/admin`, `/admin/posts`, `/admin/posts/new`, `/admin/posts/[id]/edit` |
| 공개 API (GET) | `/api/posts`, `/api/posts/[slug]`, `/api/categories` |
| 관리자 API | `/api/admin/posts`, `/api/admin/posts/[id]`, `/api/admin/categories`, `/api/admin/categories/[id]` |

컬렉션은 GET/POST, 개별 글은 GET/PUT/DELETE, 개별 카테고리는 PUT/DELETE를 지원합니다. 관리자 API는 읽기도 인증해야 합니다. `/edit`이라는 별도 최상위 경로는 사용하지 않습니다.

## 검증

```bash
pnpm exec playwright install --with-deps chromium
pnpm test
pnpm build
pnpm test:worker
```

`pnpm test`는 ESLint, `nuxt typecheck`, Playwright를 순서대로 실행합니다. ESLint는 TypeScript/Vue 규칙을 검사하고 TypeScript 컴파일 검증은 `nuxt typecheck`가 담당합니다. 개별 실행: `pnpm lint`, `pnpm typecheck`, `pnpm test:e2e`. `pnpm test:worker`는 운영 빌드 후 로컬 workerd에서 SSR, 정적 자산, D1, 관리자 인증 차단과 개발 토큰 비활성화를 확인합니다(포트 3101 사용).

Playwright는 별도 로컬 D1 `.wrangler/test`를 사용합니다. 개발 서버 포트 3100이 비어 있어야 합니다. 테스트는 원격 Cloudflare 계정에 접근하지 않습니다. 로컬 개발 토큰으로 CRUD를 검증하며 JWT 검증기는 별도로 서명·발급자·audience·만료를 테스트합니다. 실제 Access 로그인/정책은 배포 환경에서 확인해야 합니다.

## Cloudflare 설정과 배포

현재 공개 사이트는 **https://blog.hyuneon.org** 에 배포되어 있으며 원격 D1 생성·마이그레이션도 완료했습니다. 현재 계정에서 DB를 다시 만들 필요는 없습니다. **Access 애플리케이션 생성 권한이 없어 관리자 로그인 연결은 미완료**입니다. 관리자 접근은 서버에서 401로 차단됩니다. 아래 4–5번 설정 후 `pnpm deploy`로 반영하세요. 구체적인 현재 상태는 `RESULTS.md`에 기록했습니다.

아래 전체 절차는 새 계정에 처음 배포하는 경우의 안내입니다.

1. `pnpm exec wrangler login` 후 `pnpm exec wrangler d1 create personal-blog`을 실행합니다.
2. 발급된 DB ID를 `wrangler.jsonc`의 `database_id`에 입력합니다.
3. Worker에 사용할 실제 도메인을 `wrangler.jsonc`의 `routes`에 추가합니다. 예: `"routes": [{ "pattern": "blog.example.com", "custom_domain": true }]`.
4. Cloudflare Zero Trust에서 Self-hosted Access 애플리케이션 하나에 동일 도메인의 `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*`를 모두 등록합니다. 본인 이메일만 Allow하는 정책을 설정합니다. 관리자 페이지와 API가 같은 애플리케이션의 AUD를 사용하도록 합니다. 공개 경로는 등록하지 않습니다.
5. `wrangler.jsonc`의 `ACCESS_TEAM_DOMAIN`을 `your-team.cloudflareaccess.com`, `ACCESS_AUD`를 해당 애플리케이션 AUD로 설정합니다. 도메인에는 `https://`나 경로를 넣지 않습니다.
6. `pnpm exec wrangler d1 migrations apply DB --remote` 후 `pnpm deploy`를 실행합니다.
7. 로그아웃한 브라우저에서 관리자 경로와 API가 Access로 차단되고, 본인 계정으로 로그인하면 CRUD가 동작하는지 확인합니다.

기본 설정은 `workers_dev: false`, `preview_urls: false`입니다. Worker 원본 접근에도 JWT 서명, 발급자, audience, 만료 검증이 적용됩니다. 설정이 없거나 토큰이 잘못되면 D1 조회 전에 차단합니다. 관리자 응답은 `private, no-store`이며 검색엔진 색인을 막습니다. 쓰기 API는 동일 출처와 JSON 입력을 검사합니다.

## 데이터와 유지보수

- D1 prepared statements와 외래키를 사용합니다. ORM은 추가하지 않았습니다.
- 글 목록은 한 번에 20개, 최대 페이지 9999이며 본문을 포함하지 않습니다. 카테고리는 최대 100개입니다.
- 공개 API는 Nitro 캐시를 최대 60초 사용합니다. Worker 인스턴스가 새로 시작하면 캐시도 다시 채워질 수 있습니다. 관리자 쓰기를 막는 Access와 공개 조회 캐시는 서로 다른 역할입니다.
- 수정·삭제·비공개 전환 직후에도 기존 공개 내용이 캐시에 최대 60초 남을 수 있습니다. 카테고리 바 역시 최대 60초 뒤 갱신됩니다.
- 카테고리를 삭제하면 글은 삭제되지 않고 미분류로 남습니다. 글 삭제는 영구 삭제입니다.
- UI는 공식 shadcn-vue CLI로 추가한 기본 컴포넌트를 조합합니다. 좌우 영역은 비워두고 중앙에 제목, 카테고리, 본문, 푸터를 배치합니다.
- 글 제목, 사이트 소개는 `app/app.vue`, 기본 메타 정보는 `nuxt.config.ts`에서 변경합니다.
- 리치 텍스트/Markdown, 이미지 업로드, 댓글, 검색은 현재 범위에 포함하지 않습니다.

참고: [Cloudflare Nuxt 배포](https://developers.cloudflare.com/workers/framework-guides/web-apps/more-web-frameworks/nuxt/), [Access JWT 검증](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/), [shadcn-vue Nuxt 설치](https://next.shadcn-vue.com/docs/installation/nuxt).
