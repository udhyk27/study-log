---
notion_page_id: 3dd81856-910c-8117-a59b-f6143348d29f
---
Java Spring Boot 개인 프로젝트 템플릿

1. 사용 기술

Java 17, Spring Boot 3.x, Gradle, Spring MVC, JPA, Spring Security, JWT, Vue.js 3, JavaScript, TypeScript, Vite, Axios, Vue Router, Pinia, MySQL, Redis, Flyway, JUnit 5, Mockito, Testcontainers, Docker, Docker Compose, GitHub Actions, Swagger, Actuator

2. 공통 Backend 기능

common-core

response        # API 공통 응답 형식
exception       # 비즈니스 예외 및 에러 코드
validation      # 공통 입력값 검증
enum            # 공통 Enum 기능
util            # 재사용 가능한 공통 유틸리티

common-web

filter            # HTTP 요청/응답 공통 처리
interceptor       # Controller 실행 전후 공통 처리
advice            # 전역 예외 처리
pagination        # 페이징 응답 처리

common-security

jwt               # JWT 발급, 검증 및 인증 필터
authentication    # 로그인 사용자 정보 관리
authorization     # 사용자 권한 및 접근 제어

common-data

jpa               # JPA 공통 Entity 및 Auditing
redis             # Redis 연결 및 캐시 처리
lock              # Redis Distributed Lock 및 동시성 제어

common-test

fixture            # 테스트 데이터 생성
mock               # Mock 객체 및 인증 테스트 지원
integration        # Spring 통합 테스트 공통 설정
concurrency        # 동시성 테스트 실행 및 검증

3. Frontend

Vue.js

components         # 공통 UI 컴포넌트
views              # 화면 단위 컴포넌트
layouts            # 공통 화면 레이아웃
router             # 페이지 라우팅
stores             # 전역 상태 관리
api                # Axios API 호출
composables         # 재사용 가능한 Vue 로직
types              # TypeScript 타입 정의
utils              # 공통 유틸리티
assets             # CSS 및 이미지 등 정적 리소스

공통 UI:

Button / Modal / Table / Pagination
Loading / Empty / Error / Toast / Confirm

4. 프로젝트 기본 환경

Spring Boot + Vue.js
        ↓
MySQL + Redis
        ↓
Docker / Docker Compose
        ↓
GitHub Actions

개발: IntelliJ + Spring Boot 내장 Tomcat

실행: Docker Compose

CI: GitHub Actions → Test → Build → Docker Image

배포: 필요할 경우 AWS ECR / EC2 연동

5. 추가 공통 설정

Flyway       # DB 스키마 버전 관리
Actuator     # 애플리케이션 상태 및 운영 정보
Swagger      # API 문서 및 테스트
Logging      # 요청 추적 및 Trace ID

환경 설정:

application.yml          # 기본 설정
application-local.yml    # 로컬 환경
application-test.yml     # 테스트 환경
application-prod.yml     # 운영 환경

민감한 정보는 환경변수로 관리한다.

6. 목표

새로운 개인 프로젝트를 시작할 때마다 이 템플릿을 기반으로 개발한다.

[Spring Starter Template]
          ↓
      새 프로젝트
          ↓
프로젝트별 Domain / Service 구현
          ↓
공통 기능 재사용
          ↓
새로운 공통 기능 발견
          ↓
Starter에 추가
          ↓
다음 프로젝트에서 재사용

핵심 비즈니스 로직에 집중하고, 공통 설정과 반복 기능은 재사용한다.
