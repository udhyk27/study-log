---
notion_page_id: 36181856-910c-81a3-80ec-cf2a6d42dfc5
---

# 대화형 AI를 학습 및 기술 검토 용도로 활용하였으며, AI 코딩 에이전트는 사용하지 않았습니다. → 포폴 상단에 기재
# README 내용 → 아키텍처, ERD, API명세, 시퀀스 다이어그램, 성능 비교 그래프, 락 비교 표, 트러블슈팅, 기술 선택 이유

## 토이 플젝
1. 웹사이트 모니터링 시스템 - Scout
→ URL 상태, 응답속도, 페이지 변경사항을 주기적으로 감지하는 서비스
→ 웹페이지 및 RSS 데이터를 수집·저장·조회하는 서비스

2. GitHub 저장소 모니터링 시스템
→ GitHub 저장소의 Star, Fork, Issue 변화를 추적하는 서비스

3. 로그 분석 시스템
→ 서버 로그를 분석하여 에러 및 통계 정보를 제공하는 서비스

4. 환율 추적 시스템
→ 환율 정보를 수집하여 변동 내역을 기록하는 서비스
→ 주식 차트 추적 등

5. 공공데이터 수집 시스템
→ Open API 데이터를 수집·저장·조회하는 서비스

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
- 메인 1: WorkOffice (기업 업무관리 시스템)
- 메인 2: TicketNow → 동시성 + Redis + Queue + 운영 로그 + 금액 정합성

- 서브 1: PriceMonitor → 상품 가격 변동 및 URL 상태를 주기적으로 수집·모니터링하고 알림 및 AI 요약을 제공하는 자동화 시스템
- 서브 2: AI Gateway → 외부 API 연동 / 병렬 처리 / Fallback
- 서브 3: TrafficMonitor → 네트워크 프로그래밍 / 차별화


# 공통 기술 스택

**백엔드**: Java 17 + Spring Boot
**DB**: MySQL + JPA
- **캐시/락**: Redis
- **배포**: Docker + GitHub Actions + AWS EC2
- **테스트**: JUnit, k6
- **API문서**:Swagger

------------------------------------------------------------------------------------------------
# 메인 1: WorkOffice (기업 그룹웨어)

**목표**: SI 실무형 웹 시스템 / 업무 프로세스 / 권한 관리

기업 내부 업무와 조직 정보를 관리하는 그룹웨어 시스템.

## 기술
Java 17, Spring Boot, JPA, Spring Security, QueryDSL, MySQL, Vue.js, Redis, Docker, AWS, JUnit

## 주요 기능
- 사용자 / 부서 / 직급 관리
- 조직도 / 사용자 프로필
- 사용자 근무 상태 관리 (재직 / 휴가 / 출장 / 부재)
- 조직도에서 사용자 현재 상태 표시
- 부서원 생일 캘린더
- 개인 / 부서 / 회사 일정 관리
- 일정 참석자 / 알림
- 업무 등록 / 담당자 / 상태 / 우선순위 / 마감일
- 업무 진행 이력
- 전자결재 문서 / 결재선 / 승인 / 반려 / 이력
- 공지사항 / 자유게시판
- 첨부파일 / 검색 / 페이징
- 관리자 사용자 / 부서 / 권한 관리
- 공통 코드 / 시스템 로그

## 차별화 기능

### 업무 자동화
- 마감 D-3 / D-1 자동 알림
- 장기 미처리 업무 알림
- 반복 업무 자동 생성
- 업무 상태 변경에 따른 후속 처리
- Scheduler + Redis + 비동기 알림

### 전자결재 Workflow
- 결재선 순차 처리
- 현재 결재자만 승인 / 반려 가능
- 반려 시 작성자에게 반환
- 결재 이력 관리
- 결재 상태 관리

```text
DRAFT → PENDING → APPROVED → COMPLETED
                 ↘ REJECTED
```
------------------------------------------------------------------------------------------------

# 메인 2: TicketNow (한정상품 구매 시스템)

**목표**: 동시성 + Lock 비교 + Redis + Queue + 성능 테스트

한정 수량 상품 선착순 구매 시스템

## 기술
Java 17, Spring Boot, JPA, MySQL, Redis, Docker, JUnit, k6

## 주요 기능
- 회원가입 / JWT 로그인
- 상품 등록 / 조회 / 재고 관리
- 선착순 구매 / 1인 1개 제한
- 주문 상태 관리
- 결제 대기 TTL + 미결제 재고 복구
- 주문 로그 → Redis Queue → Worker → MySQL Batch 저장

## 핵심 학습
- synchronized
- 비관적 Lock / 낙관적 Lock / Redis Lock 비교
- 트랜잭션 / 재고 정합성
- Redis TTL
- Queue + 비동기 처리
- ExecutorService 동시성 테스트
- k6 부하 테스트
- DB Index / 실행계획 비교

## 배포
Docker + GitHub Actions + AWS EC2

## 예상 기간
4~5주

------------------------------------------------------------------------------------------------
# 서브 1: AI Gateway

**목표**: 외부 API 연동 / 병렬 처리 / 장애 대응

GPT, Claude, Gemini를 하나의 API에서 관리하고 모델 선택, 병렬 비교, Fallback을 제공하는 AI Gateway.

## 기술
Java 17, Spring Boot, WebClient, CompletableFuture, Redis, JUnit, WireMock, Docker, AWS EC2

## 주요 기능
- GPT / Claude / Gemini 모델 선택
- 여러 AI 모델 병렬 호출
- 모델별 응답 시간 / 내용 비교
- Judge AI를 통한 응답 평가
- 모델 장애 시 자동 Fallback
- Prompt / 응답 / 응답 시간 로그
- Redis 응답 캐시
- 사용자별 Rate Limit

## 핵심 학습
- WebClient 기반 비동기 API 호출
- CompletableFuture 병렬 처리
- Strategy Pattern
- Chain of Responsibility
- Retry / Timeout / Fallback
- Redis Cache / Rate Limit
- 외부 API Mocking
- 장애 상황 테스트

## 테스트
- JUnit
- WireMock / MockWebServer
- API 장애 / Timeout / Fallback 테스트
- 병렬 처리 성능 비교

## 배포
Docker + AWS EC2

## 핵심 포인트
- 여러 AI API를 추상화한 Gateway 구조
- CompletableFuture 기반 병렬 요청 처리
- Retry / Timeout / Fallback 장애 대응
- Redis 기반 캐싱 / Rate Limit
- 외부 API 연동 및 장애 처리 경험
------------------------------------------------------------------------------------------------
# 서브 2: TrafficMonitor (로컬 프록시 도구)

**목표**: Java 네트워크 프로그래밍 / 비동기 처리 / 차별화

HTTP/HTTPS 트래픽을 캡처하고 비동기 방식으로 저장·조회하는 로컬 프록시 시스템.

## 기술
Java 17, Spring Boot, LittleProxy, MySQL, JPA, Redis, Spring Security, JWT, JUnit, Testcontainers, Docker

## 주요 기능
- HTTP / HTTPS 요청·응답 캡처
- URL / Method / Status Code / Header 분석
- 요청 목록 조회
- Host / Method / Status Code 필터
- 요청·응답 상세 조회
- BlockingQueue 기반 요청 처리
- 프록시 스레드와 DB 저장 작업 분리
- 비동기 DB 저장
- 관리자 JWT 인증

## 핵심 학습
- LittleProxy 기반 Java 네트워크 프로그래밍
- HTTP / HTTPS 트래픽 처리
- BlockingQueue 기반 비동기 처리
- Proxy와 DB 저장 작업 분리
- @Async 비동기 처리
- JUnit + Testcontainers
- Spring Security + JWT

## 테스트
- JUnit
- Testcontainers 기반 MySQL 테스트
- 동시 요청 처리 테스트
- 비동기 저장 테스트

## 배포 / 시연
- Docker 기반 실행
- 로컬 PC 프록시 설정
- HTTP / HTTPS 요청 캡처
- README 시연 영상 / GIF

## 핵심 포인트
- LittleProxy를 활용한 Java 네트워크 프로그래밍
- HTTP / HTTPS 트래픽 처리
- BlockingQueue + 비동기 저장 파이프라인
- 일반적인 CRUD 프로젝트와 차별화
------------------------------------------------------------------------------------------------
# 서브 3: PriceMonitor (가격 추적 시스템)

**목표**: Scheduler / 크롤링 / 알림 자동화

상품, ETF, GPU 등의 가격을 주기적으로 수집하고 목표 가격 도달 시 알림을 보내는 시스템.

## 기술
Java 17, Spring Boot, JPA, MySQL, Jsoup, WebClient, Redis, JUnit, Docker, AWS EC2

## 주요 기능
- 상품 URL 등록
- 목표 가격 설정
- 주기적 가격 수집
- 가격 변화 감지
- 목표 가격 도달 알림
- Slack / Email 알림
- 가격 변동 이력 조회
- 최저가 / 최고가 조회
- 최근 가격 캐시
- 중복 알림 방지

## 핵심 학습
- @Scheduled 기반 주기적 작업
- Jsoup HTML 파싱
- WebClient API 호출
- 외부 데이터 수집
- Retry / 장애 처리
- @Async 비동기 알림
- Redis 캐싱
- Redis 기반 중복 알림 방지

## 테스트
- JUnit
- Scheduler 동작 테스트
- 크롤링 Mocking 테스트
- 알림 실패 / Retry 테스트

## 배포
Docker + AWS EC2

## 핵심 포인트
- Scheduler 기반 자동화
- 외부 데이터 수집 및 크롤링
- 비동기 알림 시스템
- Retry / 장애 격리
- Redis 기반 캐싱 / 중복 처리
------------------------------------------------------------------------------------------------
# 공통 운영 / 배포

## Docker
- 개발 / 테스트 / 배포 환경 통일

## GitHub Actions
- 자동 빌드 / 테스트 / 배포

## AWS EC2
- WorkOffice
- TicketNow
- AI Gateway
- PriceMonitor

## Local
- TrafficMonitor
- 로컬 프록시 기반 실행


# 프로젝트 진행 순서

| 순서 | 프로젝트 | 핵심 내용 |
|---|---|---|
| 1 | WorkOffice (메인 1) | Spring Boot / JPA / Security / 그룹웨어 |
| 2 | AI Gateway (서브 1) | 외부 API / 병렬 처리 / Fallback |
| 3 | PriceMonitor (서브 3) | Scheduler / 크롤링 / 알림 |
| 4 | TicketNow (메인 2) | 동시성 / Lock / Redis / Queue |
| 5 | TrafficMonitor (서브 2) | 네트워크 / Proxy / 비동기 처리 |
| 6 | 문서화 / 정리 | README / 성능 테스트 / 데모 |


# 어필 방향

- 문제 상황 → 재현 → 해결 → 성능 비교
- TPS / 응답시간 / 실패율 수치화
- 기능보다 핵심 기술을 깊게 구현
- 프로젝트마다 서로 다른 기술 경험 확보


# 프로젝트별 한 줄 어필

- **WorkOffice**: SI 실무형 그룹웨어 / JPA / Security / 업무 프로세스
- **AI Gateway**: 외부 API 병렬 처리 / Retry / Timeout / Fallback
- **PriceMonitor**: Scheduler 기반 자동화 / 크롤링 / 비동기 알림
- **TicketNow**: 동시성 / Lock 비교 / Redis / Queue / 성능 테스트
- **TrafficMonitor**: Java 네트워크 프로그래밍 / Proxy / 비동기 처리


# 전체 흐름

WorkOffice
    ↓
AI Gateway
    ↓
PriceMonitor
    ↓
TicketNow
    ↓
TrafficMonitor
    ↓
문서화 / 성능 테스트 / README 정리
