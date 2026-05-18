---
notion_page_id: 36181856-910c-8161-badd-e0f787d6d675
---
# GitHub Push → Notion 자동 동기화 구축

study-log repo에 md 파일을 정리하고 있었는데, 파일로만 보면 가독성이 떨어져 Notion에서도 함께 관리하고 싶었습니다.

목표는 단순했습니다.

GitHub repo에 md 파일을 push하면, 동일한 구조로 Notion에도 문서가 자동 생성·업데이트되도록 만드는 것.

## 전체 구조

```text
git push
→ GitHub Actions 실행
→ 변경된 .md 파일 탐색
→ Node.js 스크립트 실행
→ Notion API 호출
→ 페이지 생성 / 업데이트
```

핵심은 GitHub Actions가 클라우드 환경에서 실행되기 때문에 로컬 PC가 꺼져 있어도 동작한다는 점입니다.

## 사용 기술

- GitHub Actions
- Node.js
- Notion API
- `@tryfabric/martian`
  → Markdown → Notion 블록 변환

- `gray-matter`
  → frontmatter 처리

- `dotenv`
  → 환경변수 관리

## 문서 매핑 방식

파일 구조를 기준으로 Notion 속성을 자동 매핑하도록 구성했습니다.

| GitHub | Notion |
|---|---|
| 파일명 | 페이지 제목 |
| 최상위 폴더 | Category |
| 하위 폴더 | Tag |
| 최초 commit 시간 | Created |
| 최종 수정 시간 | Updated |
| GitHub 링크 | 원문 URL |

예를 들어:

```text
Infra/Docker/docker-compose.md
```

라면:

```text
Category → Infra
Tag → Docker
```

형태로 자동 분류됩니다.

## GitHub Actions 동작 방식

처음에는 “내 코드가 어디서 실행되는 거지?”가 가장 헷갈렸습니다.

실제로는 push를 감지하면 GitHub Actions가 yml 파일을 읽고, 그 안에 정의된 step들을 순서대로 실행합니다.

```text
push 감지
→ workflow 실행
→ repo checkout
→ Node.js 설치
→ npm install
→ sync 스크립트 실행
→ 변경사항 commit & push
```

즉, Actions는 실행 환경만 제공하고 실제 동작 코드는 repo 안에 있어야 합니다.

따라서:

- 로컬에만 있고 push 안 한 코드는 실행 불가
- `node_modules`는 매번 새로 설치
- 환경변수는 GitHub Secrets 사용

## 구현 흐름

동기화는 다음 순서로 진행됩니다.

```text
md 파일 읽기
↓
frontmatter에 notion_page_id 확인
├── 없음
│   → 새 페이지 생성
│   → page_id 기록
└── 있음
    → 기존 페이지 업데이트
```

핵심은 **파일과 Notion 페이지를 page_id로 연결**한 점입니다.

```md
---
notion_page_id: xxxxxxxx
---
```

이렇게 하면 파일명을 바꾸거나 폴더를 이동해도 같은 페이지를 유지할 수 있습니다.

## Markdown → Notion 변환

여기서 한 가지 함정이 있었습니다.

Notion 웹에서는 md를 붙여넣으면 자동 변환되지만, API는 그렇지 않습니다.

API는 아래처럼 블록 구조를 직접 만들어 보내야 합니다.

```json
{
  "type": "heading_1",
  "heading_1": {
    "rich_text": [
      {
        "text": {
          "content": "제목"
        }
      }
    ]
  }
}
```

직접 처리하기엔 너무 번거로워 `martian` 라이브러리를 사용했습니다.

대부분의 일반적인 md 문서는 문제없이 변환됩니다.

지원:
- 제목
- 리스트
- 코드 블록
- 링크
- 테이블
- 이미지

## GitHub Actions Commit Back

신규 파일을 push하면 스크립트가 `notion_page_id`를 md 파일에 자동 추가합니다.

문제는 Actions가 클라우드에서 실행되기 때문에 로컬 파일에는 자동 반영되지 않는다는 점입니다.

그래서 Actions가 직접 commit & push를 수행하도록 구성했습니다.

```text
내가 push
→ Actions 실행
→ Notion 페이지 생성
→ notion_page_id 추가
→ Actions가 자동 commit
```

예:

```text
add docker note
↓
chore: sync notion ids [skip ci]
```

commit이 하나 더 생기는 구조입니다.

여기서 `[skip ci]`가 중요했습니다.

없으면 Actions가 자기 commit을 다시 감지해 무한 실행됩니다.

## 구현하면서 겪었던 문제

### 1. localhost URL 변환 오류

```text
http://localhost:8545
```

martian이 자동 링크로 변환하는데, Notion API는 localhost URL을 허용하지 않았습니다.

해결:

```md
`http://localhost:8545`
```

인라인 코드로 변경.

---

### 2. md 목차(anchor link) 오류

```md
[프로젝트 개요](#프로젝트-개요)
```

페이지 내부 이동 링크(`#`)를 Notion이 invalid URL로 처리했습니다.

1. martian이 [텍스트](URL) 패턴을 보고 "아, 이건 마크다운 링크구나"라고 인식 (]( 같은 문법 구조로 판단)
2. 그래서 Notion 링크 블록으로 변환하면서 URL 부분만 추출 → #프로젝트-개요
3. Notion API가 그 URL을 검증 → "#으로 시작하는 fragment는 유효한 URL 아니야" → invalid URL 에러

결국 md 목차는 제거하고 Notion의 Table of Contents 블록을 사용했습니다.

---

### 3. Actions 무한 루프

원인:

```text
Actions push
→ 다시 Actions 실행
→ 또 push
→ 반복
```

해결:

```text
[skip ci]
```

commit message에 추가.

---

### 4. frontmatter가 로컬에 안 들어옴

Notion 페이지는 생성되는데 page_id가 로컬 파일에 없어서 수정할 때마다 새 페이지가 생기는 문제였습니다.

원인은 commit back 누락.

Actions에서 자동 commit하도록 수정해 해결했습니다.

## 결과

현재는 md 파일을 GitHub에 push하면 약 30초~1분 내에 Notion DB에도 자동으로 페이지가 생성·업데이트됩니다.

정리하면:

```text
GitHub → 원본 관리
Notion → 검색 / 필터 / 보기
```

형태의 워크플로우를 만들었습니다.

덕분에 study-log는 GitHub 기준으로 관리하면서, Notion에서는 훨씬 보기 좋은 형태로 학습 내용을 정리할 수 있게 되었습니다.
