AWS란 무엇인가

AWS(Amazon Web Services)는 아마존이 제공하는 클라우드 컴퓨팅 서비스 플랫폼이다.
서버, 데이터베이스, 스토리지, 네트워크 등을 인터넷을 통해 필요할 때 바로 사용할 수 있게 해준다.

한 문장으로 정리하면,

AWS = 서버와 인프라를 빌려 쓰는 클라우드 서비스

AWS를 사용하는 이유

서버 구매 및 설치 불필요

사용한 만큼만 비용 지불

빠른 확장과 축소 가능

글로벌 인프라 제공

높은 안정성과 가용성

온프레미스와 AWS 비교
기존 방식(온프레미스)

서버 직접 구매

설치, 네트워크, 보안 직접 관리

트래픽 증가 시 대응 어려움

AWS 방식

서버를 클릭 몇 번으로 생성

자동 확장 가능

장애 대응 및 인프라 관리 부담 감소

AWS 핵심 개념
리전과 가용 영역

리전(Region): AWS 데이터센터가 위치한 물리적 지역

가용 영역(AZ): 하나의 리전 안에 있는 독립적인 데이터센터 묶음

➡️ 장애에 강한 시스템 구축 가능

AWS 핵심 서비스 정리
EC2 (Elastic Compute Cloud)

가상 서버 서비스이다.
리눅스 또는 윈도우 서버를 생성해 직접 운영할 수 있다.

웹 서버

API 서버

배치 서버

S3 (Simple Storage Service)

객체 스토리지 서비스이다.
이미지, 영상, 백업 파일 등을 저장하는 데 사용된다.

무제한에 가까운 용량

높은 내구성

정적 파일 호스팅 가능

RDS (Relational Database Service)

관계형 데이터베이스 관리 서비스이다.

MySQL

PostgreSQL

MariaDB

Oracle

백업, 복제, 장애 조치를 AWS가 관리한다.

IAM (Identity and Access Management)

AWS 리소스에 대한 권한 관리 서비스이다.

사용자 생성

역할(Role) 관리

최소 권한 원칙 적용

VPC (Virtual Private Cloud)

AWS 안에서 사용하는 가상 네트워크이다.

서브넷

라우팅 테이블

보안 그룹

➡️ AWS 인프라의 기본 골격

Python 개발자 관점에서의 AWS

Python은 AWS와 궁합이 매우 좋다.

대표적인 사용 예

Flask, FastAPI 서버를 EC2에 배포

Lambda로 서버리스 함수 구현

boto3 SDK로 AWS 리소스 제어

import boto3

s3 = boto3.client('s3')
s3.upload_file('test.txt', 'my-bucket', 'test.txt')


➡️ 자동화, 배치, 서버리스에 강점

Java 개발자 관점에서의 AWS

Java는 엔터프라이즈 환경에서 AWS와 많이 사용된다.

대표적인 사용 예

Spring Boot API 서버를 EC2에 배포

RDS와 연동한 백엔드 시스템

대규모 트래픽 처리

AmazonS3 s3 = AmazonS3ClientBuilder.defaultClient();
s3.putObject("my-bucket", "test.txt", new File("test.txt"));


➡️ 안정성과 확장성이 중요한 시스템에 적합

AWS 기본 아키텍처 예시

일반적인 웹 서비스 구조는 다음과 같다.

사용자 요청

로드 밸런서(ALB)

EC2 또는 컨테이너 서버

RDS 데이터베이스

S3 정적 파일 저장

➡️ 트래픽 증가 시 서버 자동 확장 가능

AWS에서 자주 나오는 용어

Auto Scaling: 트래픽에 따라 서버 수 자동 조절

Load Balancer: 트래픽 분산

Security Group: 인스턴스 방화벽

CloudWatch: 로그 및 모니터링

Lambda: 서버 없는 함수 실행 환경

실무에서 AWS를 쓰는 방식

실무에서는 다음 조합이 가장 흔하다.

EC2 + RDS + S3

ALB + Auto Scaling

IAM Role 기반 권한 관리

CI/CD와 연동한 자동 배포

최근에는 다음도 많이 사용된다.

ECS, EKS (컨테이너)

Lambda (서버리스)

AWS를 처음 배울 때 추천 순서

EC2로 서버 하나 띄워보기

S3에 파일 업로드

RDS 연동

IAM 권한 이해

간단한 아키텍처 구성

핵심 요약

AWS는 클라우드 인프라 서비스 플랫폼

서버, DB, 스토리지를 필요할 때 바로 사용

Python은 자동화와 서버리스에 강점

Java는 안정적인 대규모 백엔드에 적합

실무에서는 여러 서비스를 조합해 사용