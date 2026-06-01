---
notion_page_id: 36181856-910c-8161-badd-e0f787d6d675
---
# GitHub Push → Notion 자동 동기화 구축

study-log 저장소에 Markdown 문서를 정리하고 있었습니다.

GitHub에서 관리하는 것은 편했지만, 문서가 많아질수록 검색이나 분류는 Notion이 더 적합하다고 생각했습니다.

그래서 GitHub에 md 파일을 push하면 Notion에도 자동으로 생성·업데이트되는 구조를 구성해보았습니다.

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
* Notion API
* @tryfabric/martian
* gray-matter
* dotenv

## 문서 매핑 방식

파일 구조를 기준으로 Notion 속성을 자동 생성하도록 구성하였습니다.

| GitHub       | Notion   |
| ------------ | -------- |
| 파일명          | 페이지 제목   |
| 최상위 폴더       | Category |
| 하위 폴더        | Tag      |
| 최초 Commit 시간 | Created  |
| 최종 수정 시간     | Updated  |
| GitHub 링크    | 원문 URL   |

예를 들어 다음과 같은 파일이 있을 경우

```text
Infra/Docker/docker-compose.md
```

Notion에는 다음과 같이 저장됩니다.

```text
Category → Infra
Tag → Docker
```

별도의 분류 작업 없이 폴더 구조만으로 문서를 관리할 수 있도록 구성하였습니다.

## GitHub Actions 동작 방식

처음에는 GitHub Actions가 실제로 어디에서 실행되는지 이해하는 것이 가장 어려웠습니다.

GitHub Actions는 push 이벤트를 감지하면 workflow 파일을 읽고 정의된 작업을 순서대로 수행합니다.

```text
push 감지
→ workflow 실행
→ repository checkout
→ Node.js 설치
→ npm install
→ sync 스크립트 실행
→ commit & push
```

실행 환경은 GitHub에서 제공하므로 로컬 PC가 꺼져 있어도 동작합니다.

반대로 로컬에만 존재하는 코드는 실행할 수 없으며, 저장소에 push된 코드만 실행 가능합니다.

## 동기화 방식

동기화는 frontmatter의 notion_page_id를 기준으로 수행합니다.

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

Notion 웹에서는 Markdown을 붙여 넣으면 자동으로 변환되지만, API는 그렇지 않습니다.

API를 사용할 경우 모든 내용을 Notion Block 형식으로 변환해야 합니다.

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

직접 구현하기에는 작업량이 많아 `@tryfabric/martian` 라이브러리를 사용하였습니다.

일반적인 Markdown 문서는 대부분 정상적으로 변환됩니다.

지원 항목은 다음과 같습니다.

* 제목
* 리스트
* 코드 블록
* 링크
* 테이블
* 이미지

## Commit Back 처리

신규 문서 생성 시 Notion 페이지 ID를 Markdown 파일에 기록해야 합니다.

문제는 GitHub Actions가 클라우드 환경에서 실행되기 때문에 수정된 파일이 로컬에 자동 반영되지 않는다는 점이었습니다.

따라서 Actions가 직접 commit 및 push를 수행하도록 구성하였습니다.

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

여기서 `[skip ci]`를 추가하지 않으면 Actions가 자신의 commit을 다시 감지하여 반복 실행되는 문제가 발생합니다.

## 구현 중 발생한 문제

### localhost URL 변환 오류

문서 내에 다음과 같은 URL이 포함되어 있었습니다.

```text
http://localhost:8545
```

martian이 이를 링크로 변환했지만 Notion API는 localhost URL을 허용하지 않았습니다.

따라서 다음과 같이 인라인 코드 형태로 수정하였습니다.

```md
`http://localhost:8545`
```

---

### md 목차(anchor link) 오류

기존 문서에는 다음과 같은 목차가 포함되어 있었습니다.

```md
[프로젝트 개요](#프로젝트-개요)
```

martian은 이를 일반 링크로 변환하고, Notion API는 `#프로젝트-개요`를 URL로 검증하는 과정에서 오류를 발생시켰습니다.

결과적으로 Markdown 목차는 제거하고 Notion의 Table of Contents 블록을 사용하도록 변경하였습니다.

---

### Actions 무한 실행

초기에는 다음과 같은 문제가 발생하였습니다.

```text
Actions push
→ Actions 실행
→ Actions push
→ Actions 실행
```

원인은 Actions가 생성한 commit 역시 workflow 실행 대상이기 때문이었습니다.

commit 메시지에 `[skip ci]`를 추가하여 해결하였습니다.

---

### frontmatter 미반영 문제

Notion 페이지는 정상 생성되지만 `notion_page_id`가 저장되지 않아 수정 시마다 새로운 페이지가 생성되는 문제가 있었습니다.

원인은 Actions에서 commit back 처리가 누락된 것이었으며, 자동 commit 로직을 추가하여 해결하였습니다.

## 결과

현재는 Markdown 파일을 GitHub에 push하면 약 30초~1분 내에 Notion 데이터베이스에도 자동으로 반영됩니다.

```text
GitHub → 원본 관리
Notion → 검색 및 조회
```

구조로 운영하고 있으며, GitHub 기준으로 문서를 관리하면서 Notion의 검색 및 필터 기능도 함께 활용할 수 있게 되었습니다.
