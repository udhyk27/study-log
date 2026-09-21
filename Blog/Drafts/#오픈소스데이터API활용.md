# Java로 공공데이터 API 활용하기

## 1. 들어가며
- 오픈데이터를 실제 서비스에서 어떻게 활용할 수 있는지 간단히 실습
- Java + Spring Boot로 외부 API 호출부터 DB 저장까지 구현

## 2. 사용 기술
- Java 17
- Spring Boot
- RestClient
- MySQL
- JPA
- 공공데이터 API

## 3. 사용할 데이터
- 어떤 오픈데이터를 선택했는지
- API에서 제공하는 데이터 구조
- 실제 응답 JSON

## 4. API 호출 구현
- API 인증키 설정
- Java에서 HTTP 요청
- JSON 응답 DTO 변환

## 5. 데이터 가공
- 필요한 필드만 추출
- 날짜/문자열 등의 데이터 변환
- 잘못된 데이터 처리

## 6. DB 저장
- Entity 설계
- JPA Repository
- 수집 데이터를 DB에 저장

## 7. 간단한 조회 API
GET /api/data
GET /api/data?date=20260921

## 8. 실제 실행 결과
- API 응답
- DB 저장 결과
- 조회 결과

## 9. 마무리
- 외부 API 연동 과정에서 알게 된 점
- 실제 서비스에서는 어떤 방식으로 확장할 수 있는지

# 공공데이터 API를 매일 수집하는 과정에서 중복 데이터가 발생하지 않도록 처리하기