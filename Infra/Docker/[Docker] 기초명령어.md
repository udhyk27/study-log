정의

    도커
    애플리케이션과 그 실행에 필요한 모든 것(코드, 라이브러리, 시스템 도구 등)을 컨테이너라는 독립된 패키지로 만들어 어디서든 동일하게 실행하고 배포할 수 있게 해주는 오픈소스 가상화 플랫폼

    이미지
    애플리케이션 실행에 필요한 코드, 라이브러리 등을 포함하는 읽기 전용의 정적 상태

    컨테이너
    이미지를 기반으로 실행 중인 상태, 즉 이미지의 실행 인스턴스

 

    Dockerfile
    텍스트 파일로, 도커 이미지를 생성하기 위한 명령어들을 순서대로 정의함. 이 파일을 통해 어떤 운영체제 기반 위에 어떤 소프트웨어를 설치하고 어떻게 설정할지 등을 명시함

    Docker Hub
    도커 이미지들을 저장하고 관리하며, 사용자들이 이미지를 검색하고 다운로드하여 컨테이너를 생성할 수 있도록 하는 공개 또는 비공개 레지스트리 서비스

명령어

# 도커 버전
docker --version

# 인포메이션
docker info

# 커맨드 목록
docker help

# Image Management
# 이미지 목록
docker images

# Docker Hub or registry 에서 로컬에 캐시로 이미지 다운로드
docker pull [image-name]

# 이미지 빌드, t는 태그
docker build -t [image-name] .

# 여러 개 네이밍
docker tag [source-image] [target-image:tag]

# registry or Docker Hub 에 Push
docker push [image-name]

# image 삭제
docker rmi [image-id]

# Container Management
# 현재 돌고있는 컨테이너 목록
docker ps

# 모든 컨테이너 목록
docker ps -a

# 로컬에 있는 이미지 (없으면 다운로드) 실행
docker run [options] [image-name]
	-d # 데몬 (백그라운드) 실행
	-p [host-port]:[container-port] # host, container 포트 연결
	--name # 네이밍
	-v # 볼륨 연결
	
# 컨테이너 삭제
docker rm [container-id/name]

# 컨테이너 삭제 (무시하고 종료)
docker rm -f [container-id/name]

# stop
docker stop [container-id/name]

# start
docker start [container-id/name]

# restart
docker restart [container-id/name]

# Container Interaction
# 실행중인 컨테이너 안으로 들어감
# ex) docker exec -it [container-id] /bin/bash
docker exec [continaer-id/name] [command]

# 로그 출력
docker logs [options] [container-id/name]

# 덤프를 컨테이너에 붙임
docker attach [container-id/name]

	# 돌고있는 컨테이너 강제종료
docker kill [options] [container-id/name]
	--signal, -s:

# Debugging Commands
# 컨테이너 inspect
docker inspect [object-id/name]

# 컨테이너 상태
docker stats [container-id/name]

# 컨테이너 내의 프로세스
docker top [container-id/name]

# 데몬이 보내는 event
docker events

Volume

    Anonymous Volumes

    Named Volumes

 

    Bind Mounts

 

참고

https://www.inflearn.com/

https://sung-98.tistory.com/160