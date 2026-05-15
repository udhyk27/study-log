# GitHub Push → Notion 자동 동기화 구축기

## 목표

GitHub repo에 push하면 동일한 구조로 Notion에 문서가 생성·업데이트되도록 자동화.

## 전체 아키텍처

```
git push (어디서든)
  → GitHub Actions가 감지
  → Node.js 스크립트 실행
  → 변경된 .md 파일 탐색
  → Notion API로 페이지 생성/업데이트
```

핵심: GitHub Actions가 클라우드에서 실행되므로 로컬 컴퓨터가 꺼져있어도 동작.

### Actions가 코드를 실행하는 방식

처음 자동화를 만들 때 가장 헷갈렸던 부분. "내 코드가 어디서 어떻게 도는 거지?"

```
push 감지
  → .github/workflows/notion-sync.yml 읽음
  → yml에 정의된 step들을 차례로 실행:
    1. repo 전체를 Actions 가상 환경(ubuntu-latest)에 checkout
    2. Node.js 설치
    3. scripts/ 폴더에서 npm ci로 의존성 설치
    4. node sync-all.js 실행
    5. 결과(frontmatter 변경)를 commit & push
```

즉 Actions는 yml이 "어떻게 실행할지"를 정의하고, yml이 호출하는 실제 코드(`scripts/sync-all.js`)는 **repo 안에 있어야** 한다. Actions 환경은 매번 깨끗한 가상 머신에서 repo를 새로 받아 실행하므로:

- 로컬에만 있고 git에 push 안 한 코드는 Actions가 못 봄
- `node_modules`는 매번 새로 설치 (`npm ci`)
- 환경변수는 Repository Secrets에서 주입

## 기술 스택

- GitHub Actions (트리거 + 실행 환경)
- Node.js
- `@notionhq/client` — Notion 공식 SDK
- `@tryfabric/martian` — 마크다운 → Notion 블록 변환
- `gray-matter` — frontmatter 파싱
- `dotenv` — 로컬 개발용 환경변수

## 매핑 설계

| 항목 | 매핑 |
|------|------|
| 파일명 | Notion 페이지 제목 (Title) |
| 최상위 폴더명 | Category 속성 (Select) |
| 2단계 폴더명 | Tag 속성 (Multi-select) |
| 최초 commit 시간 | Created (Date) |
| 최종 commit 시간 | Updated (Date) |
| GitHub 원문 URL | GitHub URL (URL) |

### Category vs Tag 분리 이유

최상위 폴더(Backend, Infra, Blog 등)는 Category(Select)로, 2단계 폴더(Infra/AWS, Infra/Docker)는 Tag(Multi-select)로 분리.

전체 경로를 Select 하나로 처리하면 옵션이 20개 이상으로 늘어나고 `Infra/AWS` 같은 슬래시 값이 보기 안 좋다. 분리하면 Notion에서 "Docker 관련 글만" 필터링이 자연스럽다.

### 동기화 제외

- `README.md` (repo 설명용, 학습 메모 아님)
- `.github/`
- `scripts/`
- `node_modules/`

## 시작 전 알게 된 함정들

### 1. Notion 웹에 붙여넣기 ≠ Notion API

Notion 웹 UI에 md를 붙여넣으면 자동으로 변환되지만, 이건 클라이언트 기능이지 API 기능이 아니다. API는 무조건 **블록 객체 배열**로 직접 만들어 보내야 한다.

예: `# 제목` 한 줄도 API로 보내려면
```json
{
  "object": "block",
  "type": "heading_1",
  "heading_1": {
    "rich_text": [{ "type": "text", "text": { "content": "제목" } }]
  }
}
```

그래서 `martian` 같은 변환 라이브러리가 필요.

### 2. martian이 처리하는 것 / 못 하는 것

지원: 제목, 문단, 볼드/이탤릭, 리스트, 코드 블록, 링크, 이미지, 구분선, 인용, 테이블

미지원/제한: 콜아웃, 토글, mermaid, 수식, 복잡한 중첩 테이블

단순 문서 위주라면 거의 손실 없음.

### 3. API 한 번에 최대 100블록

긴 문서는 100개씩 잘라서 여러 번 `append` 호출해야 한다.

### 4. 본문 통째로 교체하는 엔드포인트가 없다

Notion API에는 페이지 본문을 한 번에 교체하는 엔드포인트가 없다. 업데이트 시:

1. 기존 자식 블록 목록 조회 (`blocks.children.list`)
2. 하나씩 archive (또는 delete)
3. 새 블록 append

페이지 수가 많거나 블록이 많은 문서를 자주 업데이트하면 API 호출량이 누적된다는 점을 염두에 둘 것.

### 5. data_source 구조 변경

최근 Notion API는 DB 조회 시 properties를 직접 주지 않고 `data_sources` 하위에 두는 구조로 바뀌었다. DB ID 외에 **data source ID**도 별도로 확보해야 한다.

```js
// 옛 방식
notion.databases.retrieve({ database_id })  // → db.properties

// 현재
notion.dataSources.retrieve({ data_source_id })  // → dataSource.properties
```

페이지 생성 시도 `parent: { type: 'data_source_id', data_source_id }` 형식.

## 작업 순서

원래 GitHub Actions부터 세팅하려고 했으나 거꾸로 가는 게 효율적.

1. Notion 준비 (Integration, DB, 토큰)
2. 로컬에서 Node.js 스크립트 완성 (단일 파일 → Notion)
3. 업데이트 처리 (frontmatter 매핑)
4. 변경 파일 자동 탐색 (git diff)
5. 속성 채우기 (Category, Tag, 시간, URL)
6. GitHub Actions로 감싸기
7. 변경 케이스 보강 (삭제, rename, 디렉토리 이동)

Actions부터 만들면 push→로그→수정→push 사이클이 너무 느림.

## 1단계: Notion 준비

### Integration 생성

https://www.notion.so/profile/integrations 에서 **Internal Integration** 생성. 토큰(`ntn_...`) 발급받아 안전한 곳에 보관.

### DB 생성

루트 페이지 생성 후 본문에 `/database` → "표 보기" 선택.

속성 구성:
- Title (기본)
- Category — Select
- Tag — Multi-select
- Created — Date
- Updated — Date
- GitHub URL — URL

### Integration 연결

DB 또는 부모 페이지의 `···` → 연결 → 본인 Integration 추가.
부모에 연결하면 자식 페이지들은 권한 상속.

### ID 확보

DB를 풀 페이지로 열어 URL 확인:
```
https://www.notion.so/{워크스페이스}/{DB_이름}-{DB_ID}?v=...
```
`?v=` 앞 32자 hex가 DB ID.

Data source ID는 `databases.retrieve` 응답의 `data_sources[0].id`에서 얻는다.

## 2단계: 로컬 스크립트 — 단일 파일 생성

### 환경 준비

```bash
cd <repo>
mkdir scripts && cd scripts
npm init -y
npm install @notionhq/client @tryfabric/martian gray-matter dotenv
```

`scripts/package.json`에 `"type": "module"` 추가.

### .env (gitignore 필수)

```
NOTION_TOKEN=ntn_...
NOTION_DB_ID=...
NOTION_DATA_SOURCE_ID=...
GITHUB_OWNER=...
GITHUB_REPO=...
GITHUB_BRANCH=main
```

`.gitignore`에 추가:
```
.env
node_modules/
```

### 단일 파일 → Notion 페이지 생성

```js
const blocks = markdownToBlocks(content);
const page = await notion.pages.create({
  parent: { type: 'data_source_id', data_source_id: DATA_SOURCE_ID },
  properties: {
    Title: { title: [{ text: { content: title } }] },
  },
  children: blocks.slice(0, 100),
});
```

## 3단계: 업데이트 처리

### 매핑 방식: frontmatter에 page_id

```
---
notion_page_id: 36181856-...
---
# 제목
```

- 장점: 파일 옮기거나 이름 바꿔도 매핑 유지
- 단점: 신규 생성 후 스크립트가 .md 파일을 수정해서 commit back 필요

### 업데이트 동작 흐름

```
md 파일 읽기
↓
frontmatter에 notion_page_id 있나?
├── 없음 → 새 페이지 생성 → frontmatter에 page_id 기록 → 파일 다시 쓰기
└── 있음 → 기존 자식 블록 모두 archive → 새 블록 append
```

## 4단계: 변경 파일 자동 탐색

`git diff --name-status HEAD~1 HEAD`로 마지막 커밋의 변경 파일을 가져온다.
`status`는 `A`(추가), `M`(수정), `D`(삭제), `R`(이름변경) 등.

### 경로 → Category, Tag 매핑

```js
function pathToCategoryTag(relPath) {
  const parts = relPath.split('/').filter(Boolean);
  if (parts.length === 1) return { category: null, tag: null };
  const category = parts[0];
  const tag = parts.length >= 3 ? parts[1] : null;
  return { category, tag };
}
```

## 5단계: 속성 채우기

git log로 시간, .env에서 GitHub 정보:

```js
function getCreatedAt(relPath) {
  const out = execSync(`git log --diff-filter=A --follow --format=%aI -- "${relPath}"`, ...);
  const lines = out.split('\n').filter(Boolean);
  return lines[lines.length - 1] || null;
}

function getUpdatedAt(relPath) {
  return execSync(`git log -1 --format=%aI -- "${relPath}"`, ...).trim() || null;
}

function getGitHubUrl(relPath) {
  return `https://github.com/${GH_OWNER}/${GH_REPO}/blob/${GH_BRANCH}/${relPath}`;
}
```

## 6단계: GitHub Actions — frontmatter commit back

### 핵심 의문: frontmatter는 누가 commit하나?

신규 파일 push → 스크립트가 Notion에 페이지 생성 → 파일 상단에 `notion_page_id` 추가. 이 변경사항이 어디에 반영되어야 다음 실행에서 "업데이트"로 인식되는가?

**Actions 환경**에서는 클라우드 실행이라 로컬에 반영 안 됨. **Actions가 자체적으로 commit & push (commit back)** 해야 한다.

### 본인 commit과 Actions commit은 별개

이미 GitHub에 올라간 commit을 수정하려면 force push가 필요한데, Actions의 force push는 위험. 그래서 **"내 commit" + "Actions의 추가 commit"** 두 개가 별도로 히스토리에 남는 구조가 표준.

```
GitHub commit 히스토리 (위가 최신)
├─ chore: sync notion ids [skip ci]   ← Actions가 추가
└─ add ec2 note                        ← 본인이 한 commit
```

### `[skip ci]` 정확한 의미

`[skip ci]`는 commit을 건너뛰는 게 아니라, **그 commit이 Actions를 다시 트리거하지 않게** 하는 마커. 없으면 Actions의 push가 또 Actions를 깨워 무한 루프.

- commit은 GitHub 히스토리에 남음 ✓
- 그 commit 때문에 Actions가 다시 실행되지는 않음 ✗

### 전체 흐름

```
[로컬]
1. 새 파일 작성 → commit "add ec2 note" → push
   ↓
[GitHub]
   commit A: "add ec2 note" 도착
   ↓
[Actions]
2. sync-all.js 실행 → Notion 페이지 생성 → frontmatter 추가
3. commit "chore: sync notion ids [skip ci]" 만들어서 push
   ↓
[GitHub]
   commit B 추가됨. (A, B 모두 히스토리에 남음)
   B는 [skip ci] 덕분에 Actions 재실행 안 시킴
   ↓
[로컬]
4. 다음 작업 전 `git pull` → commit B 받아옴 → frontmatter 로컬에도 반영
5. 그 파일을 수정해서 다시 push → Actions가 page_id 보고 업데이트
```

### Actions YAML

```yaml
name: Sync to Notion

on:
  push:
    branches: [main]
    paths:
      - '**/*.md'
      - 'scripts/**'
      - '.github/workflows/notion-sync.yml'

jobs:
  sync:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # 전체 히스토리 (rename detection + GITHUB_EVENT_BEFORE 대응)
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: scripts/package-lock.json

      - working-directory: scripts
        run: npm ci

      - working-directory: scripts
        env:
          NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
          NOTION_DB_ID: ${{ secrets.NOTION_DB_ID }}
          NOTION_DATA_SOURCE_ID: ${{ secrets.NOTION_DATA_SOURCE_ID }}
          GITHUB_EVENT_BEFORE: ${{ github.event.before }}
        run: node sync-all.js

      - name: Commit frontmatter changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add -A
          if git diff --staged --quiet; then
            echo "변경사항 없음"
          else
            git commit -m "chore: sync notion ids [skip ci]"
            git push
          fi
```

## 7단계: 변경 케이스별 처리

기본 동작(`A`, `M`)만으로는 부족. 실제 운영에서 발생하는 변경 패턴을 모두 커버해야 한다.

### 처리되는 케이스 요약

| 상황 | git diff | 처리 방식 |
|------|----------|-----------|
| 새 파일 | `A` | Notion 페이지 생성 + frontmatter 자동 기록 |
| 내용 수정 | `M` | 같은 페이지 본문 + 속성 갱신 |
| 파일 삭제 | `D` | Notion 페이지 archive |
| 파일명 변경 | `R` | 같은 페이지의 제목/URL 갱신 |
| 디렉토리 이동 | `R` | 같은 페이지 + Category/Tag 재계산 |
| 폴더 통째 이동 | `R` × N | 위 처리가 파일별로 반복 |

### 케이스별 필요했던 처리

**삭제(`D`)**

- 삭제된 파일은 워킹 트리에 없으므로 `fs.readFileSync`로 frontmatter를 못 읽음
- `git show HEAD~1:<path>` (또는 `GITHUB_EVENT_BEFORE:<path>`)로 직전 커밋에서 파일 내용을 가져와 frontmatter에서 page_id 추출
- 해당 페이지를 `notion.pages.update({ page_id, archived: true })`로 휴지통으로 이동 (Notion API에 hard delete는 없음)

**이름 변경 / 디렉토리 이동(`R`)**

- `git diff`가 `R100\told_path\tnew_path` 같은 3컬럼 형식으로 반환 → 파싱 로직 수정 필요
- frontmatter의 page_id를 따라가므로 동일 Notion 페이지를 갱신
- 새 경로 기준으로 제목/Category/Tag/GitHub URL 재계산해서 덮어쓰기

**Tag/Category 비우기**

- 이동 후 2단계 폴더가 사라지면 Tag를 비워야 함
- 처음엔 `if (tag) props.Tag = ...` 식으로 작성 → null이면 속성 자체를 안 보냄 → Notion이 "변경 없음"으로 해석 → 기존 값 그대로 남음
- 수정: 명시적으로 빈 값 전송 (`{ multi_select: [] }`, `{ select: null }`)

**Actions의 fetch-depth**

- 초기엔 `fetch-depth: 2`로 설정 → 여러 commit을 한 번에 push하면 `GITHUB_EVENT_BEFORE`가 fetch 범위 밖에 있어 `bad object` 에러
- `fetch-depth: 0`(전체 히스토리)으로 변경하여 해결. `git log --diff-filter=A --follow`로 최초 생성 시점 추적할 때도 전체 히스토리가 필요

### 부작용 인지

속성을 항상 덮어쓰는 정책이므로, **Notion에서 수동으로 Category/Tag를 바꿔도 다음 sync에서 파일 경로 기준으로 되돌아간다.** 파일 구조가 단일 진실 원천(Source of Truth)이라는 일관성 유지를 위해 의도된 동작.

## 트러블슈팅 메모

### frontmatter가 로컬에 안 들어옴 — commit back 누락

증상: push했고 Notion에는 페이지가 정상 생성되는데, 로컬 파일에 `notion_page_id`가 추가되어 있지 않다. 그 결과 그 파일을 또 수정해서 push하면 "신규 생성"으로 인식되어 Notion에 똑같은 페이지가 또 하나 만들어진다.

원인: Actions가 클라우드에서 실행되므로 거기서 frontmatter를 추가해도 자동으로 로컬에 반영되지 않는다. Actions yml에서 자체적으로 commit & push (commit back) 단계를 빠뜨린 경우 발생.

대응:
- yml에 `Commit frontmatter changes` 단계가 있는지 확인
- `permissions: contents: write` 설정 누락 시 push 실패하므로 같이 체크
- 본인 commit과 Actions commit은 별개 commit으로 히스토리에 남음 (force push 안 쓰는 표준 패턴)
- 본인은 다음 작업 전 `git pull` 한 번 받아오면 됨

### `[skip ci]` 빠뜨려서 Actions 무한 루프

증상: push 한 번에 Actions가 끝없이 돌면서 commit이 계속 쌓인다.

원인: Actions가 commit back 할 때 commit 메시지에 `[skip ci]` 마커를 안 넣으면, 그 push가 다시 Actions를 트리거 → 또 commit & push → 또 트리거... 무한 반복.

`[skip ci]`는 그 commit이 GitHub 히스토리에 안 남는다는 뜻이 **아니다.** commit은 정상적으로 남고, 단지 그 commit으로 인한 Actions 실행만 건너뛴다.

대응:
```yaml
git commit -m "chore: sync notion ids [skip ci]"
```

`[ci skip]`, `[no ci]`, `[skip actions]` 등도 같은 효과. 발견 즉시 무한 루프 멈추려면 yml에서 commit 단계를 잠시 주석 처리하고 push하면 된다.

### `API token is invalid` (401)

- `.env` 위치 확인. dotenv는 실행 위치(cwd) 기준으로 찾는다. `scripts/`에서 실행한다면 `scripts/.env`에 있어야 함.
- 토큰 앞뒤 공백/줄바꿈/따옴표 없는지 확인.
- `console.log(process.env.NOTION_TOKEN)`로 1차 진단.

### `Cannot convert undefined or null to object` on db.properties

DB가 `data_sources` 구조로 바뀌어 `db.properties`가 없음.
`notion.dataSources.retrieve({ data_source_id })`로 가져와야 함.

### `Could not find block with ID: ...` (object_not_found, 404)

frontmatter에 기록된 `notion_page_id`로 페이지를 찾았는데 Notion 쪽에서 사라진 경우 (수동 삭제 등).

대응: `try/catch`로 `err.code === 'object_not_found'` 잡아서 신규 생성 분기로 fallback.

### `Cannot find package 'dotenv'` (Actions에서만)

`package-lock.json`이 repo에 commit 안 되어 있음. `npm ci`는 lock 파일 필수.
로컬에서는 `node_modules`가 있어서 동작하지만 Actions는 매번 깨끗한 환경.
→ `scripts/package-lock.json`을 commit하면 해결.

### `fatal: bad object <SHA>`

Actions에서 `fetch-depth: 2`가 부족한 경우. 한 번에 여러 commit을 push하면 `GITHUB_EVENT_BEFORE`가 fetch 범위 밖에 있을 수 있음. `fetch-depth: 0`으로 변경.

### Windows에서 `Assertion failed: ... uv_handle_closing`

Node v24 + Windows의 알려진 종료 시점 경고. 실제 동작에는 영향 없음. 진짜 원인은 그 위의 에러 메시지를 봐야 함.

### Integration이 페이지에 접근 못 함 (첫 호출부터 object_not_found)

Integration을 만들었어도 페이지마다 명시적으로 연결해야 접근 가능.
DB(또는 부모 페이지) `···` → 연결 → 본인 Integration 추가.
부모에 연결해두면 자식은 권한 상속.

## 결과

GitHub repo에 .md 파일을 push하면 약 30초~1분 안에 Notion DB에 자동으로 페이지가 생성/업데이트된다. 파일 구조(폴더)를 그대로 Notion의 Category/Tag 속성으로 매핑하여, GitHub에서 글을 관리하고 Notion에서 필터링/검색/뷰로 활용하는 워크플로우 완성.