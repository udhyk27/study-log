---
notion_page_id: 36181856-910c-81a3-80ec-cf2a6d42dfc5
---

## 토이 플젝
1. 웹사이트 모니터링 시스템
→ URL 상태, 응답속도, 페이지 변경사항을 주기적으로 감지하는 서비스

2. 웹 크롤링 수집 시스템
→ 웹페이지 및 RSS 데이터를 수집·저장·조회하는 서비스

3. URL 단축 서비스
→ 긴 URL을 짧은 URL로 변환하고 접속 통계를 제공하는 서비스

4. API 모니터링 시스템
→ 외부 API의 상태와 응답시간을 지속적으로 추적하는 서비스

5. 링크 검사 시스템
→ 웹사이트 내 깨진 링크를 탐지하고 리포트를 제공하는 서비스

6. GitHub 저장소 모니터링 시스템
→ GitHub 저장소의 Star, Fork, Issue 변화를 추적하는 서비스

7. 로그 분석 시스템
→ 서버 로그를 분석하여 에러 및 통계 정보를 제공하는 서비스

8. 공공데이터 수집 시스템
→ Open API 데이터를 수집·저장·조회하는 서비스

9. 환율 추적 시스템
→ 환율 정보를 수집하여 변동 내역을 기록하는 서비스

10. 파일 중복 검사 시스템
→ 파일 해시 기반으로 중복 파일을 탐지하는 서비스

11. 이미지 메타데이터 분석 시스템
→ 이미지의 EXIF 정보를 추출하고 조회하는 서비스

12. 문서 자동 생성 시스템
→ 템플릿 기반으로 README 및 문서를 생성하는 서비스

# Java 백엔드 포트폴리오 프로젝트 계획

*** git pages 포폴 나오는 부분에 한 줄 설명, 핵심 구현, 기술 등 추가
*** 프로젝트명
*** 한 줄 설명

*** 기술 스택
*** 핵심 구현
*** GitHub
*** 포트폴리오 URL

## 전체 방향

실무형 백엔드 개발 역량을 보여주는 포트폴리오 구성.

각 프로젝트의 **핵심 기술만 명확히 어필**하고, 기능 욕심을 줄여 현실적인 기간 내 완성 가능한 규모로 구성.

**포트폴리오 구성**
- 서브 1: Price Tracker → 상품 가격 변동 및 URL 상태를 주기적으로 수집·모니터링하고 알림 및 AI 요약을 제공하는 자동화 시스템
- 서브 2: AI Prompt Gateway → 외부 API 연동 / 병렬 처리 / Fallback
- 메인 1: TicketFlow → 동시성 + Redis + Queue + 운영 로그 + 금액 정합성
- 메인 2: JProxy → 네트워크 프로그래밍 / 차별화
---

# 공통 기술 스택

**백엔드**: Java 17 + Spring Boot
**DB**: MySQL + JPA
- **캐시/락**: Redis
- **배포**: Docker + GitHub Actions + AWS EC2
- **테스트**: JUnit, k6

---

# 메인 1: TicketFlow (한정상품 구매 시스템)

**역할**: 동시성 + 락 비교 + Redis + Queue 비동기 + 운영 로그

판매자가 한정 수량 상품을 등록하면 사용자가 선착순으로 구매하는 시스템. 동시 구매 충돌 해결, 락 전략 비교, 비동기 로그 처리, 운영 모니터링을 한 프로젝트에 통합.

## 핵심 구현 기능

### 회원 / 인증
- 회원가입
- JWT 기반 로그인

### 상품 관리
- 상품 등록 (판매자)
- 한정 상품 조회 (목록 / 상세)
- 현재 재고 상태 표시

### 선착순 구매
- 구매 요청 처리
- 재고 차감
- 1인 1개 제한
- 주문 상태 관리 (PENDING_PAYMENT / PAID / EXPIRED)

### 결제 대기 TTL
- Redis TTL 기반 임시 재고 선점
- 제한 시간 내 결제 없으면 자동 재고 복구

### 운영 로그 시스템
- 주문 요청 로그 수집
- Redis Queue 저장
- Worker가 Batch Insert
- 장애 / 실패 주문 조회
- TPS / 실패율 통계 API + 간단 테이블 (차트는 X)

## 운영 로그 아키텍처

```
주문 요청 → Redis Queue → Worker → MySQL (Batch Insert) → 통계 API
```

## 자바/Spring 핵심 기술

### 동시성 처리
- synchronized
- ExecutorService 기반 동시 요청 테스트

### 락 처리 (핵심 어필)
- DB 비관락
- DB 낙관락
- Redis 분산 락
- 4가지 방식 TPS / 실패율 비교

### 트랜잭션
- 주문 생성 + 재고 차감 원자성 보장
- 실패 시 Rollback

### Redis 활용
- 재고 카운팅
- 결제 대기 TTL
- 운영 로그 Queue

### 비동기 처리
- @Async
- Queue 기반 로그 처리
- Worker Batch Insert

### 예외 처리
- 커스텀 예외
- 전역 예외 처리

## 테스트

- **JUnit**: 서비스 로직 검증
- **동시성 테스트**: ExecutorService로 동시 구매 시뮬레이션
- **성능 테스트**: k6 (TPS, 응답시간, 실패율)
- **비동기 처리 비교**: 동기 vs 비동기 TPS 비교

## 배포

- Docker
- GitHub Actions (자동 빌드 / 테스트 / 배포)
- AWS EC2

## 핵심 어필 포인트

- 동시 구매 충돌 상황 재현 및 해결
- synchronized / 비관락 / 낙관락 / Redis Lock 4종 비교 → 그래프
- TTL 기반 결제 대기 및 재고 복구
- 트랜잭션 기반 재고 정합성 보장
- Queue 기반 비동기 로그 처리 (동기 대비 성능 개선 수치)
- 운영 로그로 장애 / 실패 추적

## 예상 기간

4~5주

---

# 메인 2: JProxy (로컬 프록시 도구)

**역할**: 네트워크 프로그래밍 / 차별화

다른 지원자와 겹치지 않는 영역(저수준 네트워크)을 보여주는 차별화 프로젝트.

## 한 줄 설명

내 PC에서 동작하며 HTTP/HTTPS 트래픽을 가로채 분석, 저장하는 로컬 프록시 도구.

## 기술 스택

- Java 17, Spring Boot 3.x, Gradle
- **프록시 코어**: LittleProxy
- MySQL + JPA, Redis
- Spring Security + JWT
- Docker
- JUnit, Testcontainers
- AWS EC2 다중 서버
- Kubernetes 연동 (K8s API 조회)

## 핵심 구현 기능

### 인증
- JWT 기반 로그인 (관리자 계정)

### 프록시 캡처
- HTTP 요청 캡처
- HTTPS 캡처 (MITM 방식)
- CA 인증서 자동 생성

### 요청/응답 저장
- 캡처 데이터 비동기 저장 (BlockingQueue 기반)
- @Async 워커로 배치 저장
- MySQL에 영속화

### 조회 / 검색
- 요청 목록 조회
- 호스트 / 메서드 / 상태코드 필터
- 키워드 검색

### 간단 대시보드
- 요청 목록 테이블
- 선택한 요청의 헤더 / 바디 상세 보기

## 자바/Spring 핵심 기술

### 네트워크 프로그래밍 (핵심 어필)
- LittleProxy 기반 프록시 코어
- HTTPS MITM 구현
- CA 인증서 동적 생성

### 비동기 처리
- BlockingQueue 기반 캡처 파이프라인
- @Async 배치 저장
- 프록시 스레드와 저장 스레드 분리

### Redis 활용 (간단히)
- 최근 요청 캐시
- JWT Refresh Token 저장

### 인증/인가
- Spring Security + JWT

## 테스트

- JUnit
- Testcontainers (MySQL, Redis 실제 컨테이너)

## 배포 / 시연

- Docker 이미지로 배포
- 본인 PC에서 실행해서 테스트
- 시연 영상 (GIF) README에 첨부

## 핵심 어필 포인트

- 네트워크 프로그래밍 (TLS MITM, 인증서 처리) → 차별화
- 캡처 → Queue → 비동기 저장 파이프라인 설계
- 메인 1과 다른 기술 영역으로 시야의 폭 어필

## 예상 기간

3~4주

---

# 서브 2: AI Prompt Gateway

**역할**: 외부 API 연동 / 병렬 처리 / 장애 대응 (Fallback)

## 한 줄 설명

GPT, Claude, Gemini를 하나의 API에서 관리하고 모델 선택, 병렬 비교, 장애 대응(Fallback)을 제공하는 AI Gateway.

사용자 질문
      ↓
GPT / Gemini / Claude 병렬 호출
      ↓
응답 수집
      ↓
Judge AI 평가
(품질/정확도/일관성)
      ↓
최종 추천 답변 생성

## 핵심 구현 기능

### 모델 선택
- GPT / Claude / Gemini 직접 선택

### 병렬 응답 비교
- 여러 모델 동시 호출
- 응답 시간 / 내용 비교

### 자동 Fallback
- 모델 실패 시 자동 다른 모델 호출
- 예: GPT 실패 → Claude → Gemini

### Prompt 로그
- 질문 / 응답 저장
- 응답 시간 기록

### Redis
- 응답 캐시
- Rate Limit

## 자바/Spring 핵심 기술

### 외부 API 연동
- WebClient 기반 비동기 호출
- 모델별 API 스펙 추상화

### 병렬 처리
- CompletableFuture
- 여러 모델 동시 호출 후 결과 취합

### 디자인 패턴
- Strategy Pattern (모델별 호출 전략)
- Chain of Responsibility (Fallback 체인)

### 장애 대응
- Retry (일시적 실패 재시도)
- Timeout (응답 지연 차단)
- Fallback (대체 모델 호출)

### Redis 활용
- 동일 프롬프트 응답 캐시
- 사용자별 Rate Limit

## 테스트

- JUnit
- 외부 API Mocking (WireMock 또는 MockWebServer)
- Fallback 시나리오 테스트

## 배포

- Docker
- AWS EC2

## 핵심 어필 포인트

- AI API Gateway 설계 (모델 추상화)
- CompletableFuture 기반 병렬 요청 처리
- Retry / Timeout / Fallback 장애 대응 구조
- 모델 비교 기능 (응답 시간, 내용 차이)
- 외부 API 연동 경험

## 예상 기간

2~3주

---

# 서브 3: Price Tracker (가격 추적 시스템)

**역할**: 스케줄러 / 크롤링 / 알림 자동화

## 한 줄 설명

상품, ETF, GPU 등의 가격을 주기적으로 수집하고 목표 가격 도달 시 알림을 보내는 시스템.

## 핵심 구현 기능

### 추적 등록
- URL 등록
- 목표 가격 설정

### 가격 수집
- 주기적 크롤링
- 가격 변화 감지

### 목표가 알림
- 목표 가격 도달 시 Slack / Email 알림

### 가격 이력
- 가격 변동 조회
- 최저가 / 최고가 확인

### Redis
- 최근 가격 캐시
- 중복 알림 방지

## 자바/Spring 핵심 기술

### 스케줄링
- @Scheduled로 주기적 가격 수집

### 외부 데이터 수집
- Jsoup (HTML 파싱)
- WebClient (API 호출)

### Retry
- 크롤링 실패 시 재시도
- 영구 실패는 에러 로그

### 비동기 알림
- @Async로 Slack / Email 발송
- 알림 실패 격리

### Redis 활용
- 최근 가격 캐시 (DB 부하 감소)
- 중복 알림 방지 (이미 알림 보낸 목표가 기록)

## 테스트

- JUnit
- 스케줄러 동작 검증
- Mocking 기반 크롤링 테스트

## 배포

- Docker
- AWS EC2

## 핵심 어필 포인트

- Scheduler 기반 자동화
- 외부 데이터 수집 (크롤링)
- 비동기 알림 시스템
- Retry / 장애 격리

## 예상 기간

1~2주

---

# 공통 운영 / 배포

## Docker
- 실행 환경 통일

## GitHub Actions
- 자동 빌드 / 테스트 / 배포

## AWS EC2
- 배포 환경 (TicketFlow, Mini Payment Ledger, AI Prompt Gateway, Price Tracker)
- JProxy는 로컬 실행

---

# 시간 배분 (총 약 4개월)

| 순서 | 프로젝트 | 기간 | 비고 |
|------|---------|------|------|
| 1 | Price Tracker (서브 3) | 1~2주 | 스케줄러 / 크롤링 / 알림 |
| 2 | AI Prompt Gateway (서브 2) | 2~3주 | 외부 API / 병렬 / Fallback |
| 3 | TicketFlow (메인 1) | 4~5주 | 동시성 + Queue + 운영 로그 통합 |
| 4 | JProxy (메인 2) | 3~4주 | 차별화 |
| 5 | 문서화 / 배포 정리 | 1주 | README, 성능 그래프, 데모 |

---

# 어필 방향

- 문제 재현 → 해결 → 성능 비교
- TPS / 응답시간 / 실패율 수치화
- 핵심 기술을 깊게 (기능 욕심 X)

---

# 프로젝트별 한 줄 어필

- **Price Tracker**: 스케줄러 기반 자동화 / 크롤링 / 알림
- **AI Prompt Gateway**: 외부 API 병렬 처리 / Fallback 장애 대응
- **TicketFlow**: 동시성 + 비동기 + 운영 로그 통합 구현
- **JProxy**: 네트워크 프로그래밍으로 차별화

---

# 우선순위 진행 순서

1. **Price Tracker** (서브 3, 1~2주)
2. **AI Prompt Gateway** (서브 2, 2~3주)
3. **TicketFlow 완성** (메인 1, 배포까지)
   - 1~2주차: 회원, 상품, 선착순 구매, 락 비교
   - 3주차: Redis TTL, 운영 로그 Queue + Worker
   - 4~5주차: 통계 API, 성능 테스트, 배포
4. **JProxy 진행** (메인 2, 차별화 포인트 확보)
5. 문서화 / README / 성능 리포트 정리

---
================================================================================================================
# URL 상태 체크 모니터 - Beacon **

## 목표

등록된 URL을 주기적으로 호출해서 상태를 확인하는 모니터링 프로그램

## 핵심 기능

- URL 등록
- URL 목록 조회
- URL 수정 / 삭제
- 주기적 상태 체크
- HTTP 상태코드 저장
- 응답시간 저장
- 정상 / 장애 여부 판단
- 최근 체크 이력 조회

## 기술 스택

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- MySQL 또는 H2
- Scheduler

## 기본 구조

사용자가 URL 등록
→ DB 저장
→ Scheduler가 1분마다 URL 목록 조회
→ 각 URL에 HTTP 요청
→ 상태코드와 응답시간 측정
→ 체크 결과 DB 저장
→ 화면 또는 API로 결과 조회

## 테이블 예시

### monitored_url

- id
- name
- url
- check_interval
- enabled
- created_at

### url_check_result

- id
- monitored_url_id
- status_code
- response_time_ms
- is_success
- error_message
- checked_at

## API 예시

POST /api/urls
- URL 등록

GET /api/urls
- URL 목록 조회

GET /api/urls/{id}
- URL 상세 조회

PATCH /api/urls/{id}
- URL 수정

DELETE /api/urls/{id}
- URL 삭제

GET /api/urls/{id}/results
- 체크 이력 조회

## 장애 판단 기준

- 200 ~ 399: 정상
- 400 ~ 599: 장애
- timeout: 장애
- connection error: 장애

## 포폴 어필 포인트

- Spring Scheduler를 이용한 주기 작업 처리
- 외부 HTTP 요청 처리
- 응답시간 측정
- 장애 상태 판단 로직
- 모니터링 데이터 이력화
- 추후 알림 기능 확장 가능

## 확장 기능

- Slack 알림
- 이메일 알림
- 장애 발생 시 연속 실패 횟수 기록
- 평균 응답시간 통계
- 일별 가동률 계산
- 대시보드 화면
- Docker 배포
================================================================================================================
# 작업 일지

(진행하면서 추가)
