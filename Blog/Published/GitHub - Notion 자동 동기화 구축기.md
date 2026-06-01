---
notion_page_id: 36181856-910c-8161-badd-e0f787d6d675
---

## GitHub Push → Notion 자동 동기화 구축

저는 GitHub 저장소에 개인 학습 및 메모용 문서를 Markdown 형식으로 정리하고 있습니다.

GitHub에서 문서를 관리하는 것은 편리했지만, Markdown은 다양한 서식을 문법으로 표현하기 때문에 원본 파일만 봐서는 가독성이 떨어졌습니다. 문서를 제대로 읽기 위해서는 별도의 Markdown 뷰어, 노트 앱 또는 Notion에서 열어보아야 했습니다.

반면 Notion은 Markdown 문서를 보기 좋은 형태로 렌더링해주고 검색이나 분류도 편리해, 문서를 조회하는 용도로는 더 적합하다고 생각했습니다.

그래서 GitHub에 Markdown 파일을 push하면 Notion 페이지가 자동으로 생성되거나 업데이트되도록 동기화 구조를 구축해보았습니다.

## 시스템 구조

```text
git push
→ GitHub Actions 실행
→ 변경된 md 파일 탐색
→ Node.js 스크립트 실행
→ Notion API 호출
→ 페이지 생성 또는 업데이트
```

GitHub를 원본 저장소로 사용하고, Notion은 조회 및 분류 용도로 사용하는 구조입니다.

## 사용 기술

* GitHub Actions
* Node.js
* @tryfabric/martian
* gray-matter
* dotenv

## 문서 매핑 방식

파일 구조를 기준으로 Notion 속성을 자동 생성하도록 구성했습니다.

| GitHub       | Notion   |
| ------------ | -------- |
| 파일명          | 페이지 제목   |
| 최상위 폴더       | Category |
| 2단계 폴더       | Tag      |
| 최초 Commit 시간 | Created  |
| 최종 Commit 시간 | Updated  |
| GitHub 링크    | 원문 URL   |

Created와 Updated는 파일 수정 시간이 아니라 git commit 시간(`git log --follow`)을 기준으로 합니다.

Tag는 경로가 3단계 이상일 때만 2단계 폴더명으로 채워집니다. 예를 들어 다음과 같은 파일이 있을 경우

```text
Infra/Docker/docker-compose.md
```

Notion에는 다음과 같이 저장됩니다.

```text
Category → Infra
Tag → Docker
```

반면 `Infra/docker.md`처럼 2단계 경로인 경우 Category만 채워지고 Tag는 비어 있습니다. 별도의 분류 작업 없이 폴더 구조만으로 문서를 관리할 수 있도록 구성했습니다.

## GitHub Actions 동작 방식

처음에는 GitHub Actions가 실제로 어디에서 실행되는지 이해하는 것이 가장 어려웠습니다.

GitHub Actions는 push 이벤트를 감지하면 workflow 파일을 읽고 정의된 작업을 순서대로 수행합니다.

```text
push 감지
→ workflow 실행
→ repository checkout
→ Node.js 설치
→ npm ci (의존성 설치)
→ sync 스크립트 실행
→ commit & push
```

실행 환경은 GitHub에서 제공하므로 로컬 PC가 꺼져 있어도 동작합니다. 반대로 로컬에만 존재하고 push하지 않은 코드는 실행할 수 없으며, 저장소에 올라온 코드만 실행됩니다.

## 동기화 방식

동기화는 frontmatter의 `notion_page_id`를 기준으로 수행합니다.

```text
md 파일 읽기
↓
notion_page_id 확인
├── 없음
│   → 페이지 생성
│   → page_id 저장
└── 있음
    → 페이지 업데이트
```

페이지 생성 후에는 frontmatter에 page_id를 기록합니다.

```yaml
---
notion_page_id: xxxxxxxx
---
```

이 방식을 사용하면 파일명 변경이나 폴더 이동이 발생해도 동일한 Notion 페이지를 유지할 수 있습니다.

## Markdown → Notion 변환

Notion 웹에서는 Markdown을 붙여 넣으면 자동으로 변환되지만, 이는 클라이언트 기능이지 API 기능이 아닙니다. API를 사용할 경우 모든 내용을 Notion Block 형식으로 직접 변환해야 합니다.

예를 들어 제목 하나도 다음과 같은 구조로 전달해야 합니다.

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

직접 구현하기에는 작업량이 많아 `@tryfabric/martian` 라이브러리를 사용했습니다. 일반적인 Markdown 문서는 대부분 정상적으로 변환됩니다.

지원 항목은 제목, 리스트, 코드 블록, 링크, 테이블, 이미지, 인용, 구분선 등입니다. 반대로 콜아웃, 토글, mermaid, 수식, 복잡한 중첩 테이블은 미지원이거나 제한이 있습니다.

### API 제약 두 가지

API는 한 번에 최대 100블록까지만 전송할 수 있어, 긴 문서는 100개씩 잘라 여러 번 append해야 합니다.

또한 페이지 본문을 통째로 교체하는 엔드포인트가 없습니다. 업데이트 시에는 기존 자식 블록을 조회해 하나씩 archive한 뒤 새 블록을 append하는 방식이라, 업데이트가 잦으면 API 호출량이 누적됩니다.

### data_source 구조 변경

최근 Notion API는 DB 조회 시 properties를 `data_sources` 하위에 두는 구조로 바뀌었습니다. 그래서 DB ID 외에 별도의 data source ID도 확보해야 합니다.

```js
// 옛 방식
notion.databases.retrieve({ database_id })   // → db.properties

// 현재
notion.dataSources.retrieve({ data_source_id })  // → dataSource.properties
```

페이지 생성 시에도 `parent: { type: 'data_source_id', data_source_id }` 형식을 사용해야 합니다. 이를 모르면 `db.properties`가 없어 `Cannot convert undefined or null to object` 에러가 발생합니다.

## Commit Back 처리

신규 문서 생성 시 Notion 페이지 ID를 Markdown 파일에 기록해야 합니다.

문제는 GitHub Actions가 클라우드 환경에서 실행되기 때문에 수정된 파일이 로컬에 자동 반영되지 않는다는 점이었습니다. 따라서 Actions가 직접 commit 및 push를 수행하도록 구성했습니다.

```text
사용자 push
→ Actions 실행
→ Notion 페이지 생성
→ notion_page_id 추가
→ Actions commit & push
```

자동 생성되는 commit 메시지는 다음과 같습니다.

```text
chore: sync notion ids [skip ci]
```

여기서 `[skip ci]`를 추가하지 않으면 Actions가 자신의 commit을 다시 감지하여 무한 반복 실행되는 문제가 발생합니다. `[skip ci]`는 commit을 히스토리에서 빼는 것이 아니라, 해당 commit이 Actions를 다시 트리거하지 않게 하는 마커입니다. 사용자 본인의 commit과 Actions의 commit back은 별개로 히스토리에 남으며, 다음 작업 전 `git pull`로 받아오면 됩니다.

## 변경 케이스별 처리

생성과 수정뿐 아니라 실제 운영에서 발생하는 변경 패턴을 모두 다뤄야 했습니다. `git diff --name-status`의 status 값으로 케이스를 구분합니다.

| 상황      | git diff | 처리 방식                     |
| ------- | -------- | ------------------------- |
| 새 파일    | A        | 페이지 생성 + frontmatter 기록   |
| 내용 수정   | M        | 같은 페이지 본문·속성 갱신           |
| 파일 삭제   | D        | Notion 페이지 archive        |
| 파일명 변경  | R        | 같은 페이지의 제목·URL 갱신         |
| 디렉토리 이동 | R        | 같은 페이지 + Category/Tag 재계산 |

삭제(D)의 경우 파일이 워킹 트리에 없어 frontmatter를 읽을 수 없으므로, `git show`로 직전 커밋에서 내용을 가져와 page_id를 추출합니다. Notion API에는 hard delete가 없어 `archived: true`로 휴지통으로 이동시키는 방식만 가능합니다.

Tag와 Category를 비울 때 주의할 점이 있습니다. 값을 null로 두면 속성 자체를 전송하지 않아 Notion이 "변경 없음"으로 해석해 기존 값이 그대로 남습니다. 비우려면 `{ multi_select: [] }`, `{ select: null }`처럼 빈 값을 명시적으로 전송해야 합니다.

또한 속성을 항상 파일 경로 기준으로 덮어쓰므로, Notion에서 수동으로 Category나 Tag를 변경해도 다음 sync에서 되돌아갑니다. 파일 구조를 단일 진실 원천(Source of Truth)으로 유지하기 위한 의도된 동작입니다.

## 구현 중 발생한 문제

### localhost URL 변환 오류

문서 내에 `http://localhost:8545` 같은 URL이 포함되어 있었습니다. martian이 이를 링크로 변환했지만 Notion API는 localhost URL을 허용하지 않았습니다. 백틱으로 감싸 인라인 코드 형태로 수정해 해결했습니다.

### md 목차(anchor link) 오류

기존 문서에 `[프로젝트 개요](#프로젝트-개요)` 같은 목차가 포함되어 있었습니다. martian은 이를 일반 링크로 변환하는데, Notion API가 `#프로젝트-개요`를 URL로 검증하는 과정에서 오류를 발생시켰습니다. Markdown 목차는 제거하고 Notion의 Table of Contents 블록을 사용하도록 변경했습니다.

### Actions 무한 실행

Actions가 생성한 commit 역시 workflow 실행 대상이라, push가 또 다른 실행을 부르는 무한 루프가 발생했습니다. commit 메시지에 `[skip ci]`를 추가해 해결했습니다.

### frontmatter 미반영 문제

Notion 페이지는 정상 생성되지만 `notion_page_id`가 저장되지 않아 수정할 때마다 새로운 페이지가 생성되는 문제가 있었습니다. 원인은 Actions에서 commit back 처리가 누락된 것이었으며, 자동 commit 로직을 추가해 해결했습니다. 이때 `permissions: contents: write` 설정이 없으면 push가 실패하므로 함께 확인해야 합니다.

### Actions에서만 발생하는 의존성 오류

로컬에서는 `node_modules`가 있어 동작하지만, Actions는 매번 깨끗한 환경에서 `npm ci`로 설치하므로 `package-lock.json`이 repo에 commit되어 있지 않으면 실패합니다. lock 파일을 commit해 해결했습니다.

## 결과

현재 Markdown 파일을 GitHub에 push하면 약 30초~1분 내에 Notion 데이터베이스에 자동 반영됩니다.

```text
GitHub → 원본 관리
Notion → 검색 및 조회
```

이 구조로 운영하면서 GitHub 기준으로 문서를 관리하는 동시에, Notion의 검색 및 필터 기능도 함께 활용할 수 있게 되었습니다.
