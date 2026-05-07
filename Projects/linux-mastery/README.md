linux-mastery-project/
├─ README.md
├─ Level-1_CLI/
│   ├─ exercises/        # 명령어 연습 스크립트 / 예제
│   ├─ notes.md          # 배운 내용 기록
├─ Level-2_Server/
│   ├─ exercises/
│   ├─ notes.md
│   └─ scripts/          # 로그 백업, 자동화 스크립트
├─ Level-3_Automation/
│   ├─ backup-scripts/
│   ├─ monitoring-scripts/
│   └─ notes.md
├─ Level-4_Docker/
│   ├─ docker-compose/
│   ├─ services/         # 예: nginx, gitea 설정 파일
│   └─ notes.md
└─ .gitignore

# Linux Mastery Project — 10 Weeks Timeline

### VM Ware로 진행

## Week 1-2 | Level 1 — CLI 감각 익히기
**목표:** 매일 리눅스 명령어와 기본 환경에 익숙해지기

- 사용자 계정 생성 / 권한 설정
- 디렉토리 구조 설계 (`mkdir`, `mv`, `rm`, `ls`, `cd`)
- alias, `.bashrc` / `.zshrc` 커스터마이징
- 텍스트 처리: `grep`, `awk`, `sed`, `cut`, `sort`, `uniq`

> 미션 예시:
> - 로그 파일에서 특정 단어 갯수 세기
> - 디렉토리 구조를 직접 설계하고 관리해보기

---

## Week 3 | Level 1-2 — Dotfiles 관리
**목표:** 홈 디렉토리, 쉘, Git 환경 구조 이해

- `.bashrc`, `.vimrc`, `.gitconfig` 정리
- GitHub에 Dotfiles 저장
- 심볼릭 링크(`ln -s`) 연습
- 환경변수 이해 및 적용

> Tip: 나중에 Mac/Linux 모두에서 동일한 환경 구축 가능

---

## Week 4 | Level 2 — 미니 서버 구축
**목표:** 리눅스를 서버처럼 쓰기

- Ubuntu Server 설치 (VM / VirtualBox / WSL2)
- SSH 접속
- 사용자/권한 분리
- 방화벽(`ufw`) 설정
- 서비스 데몬(`systemctl`) 이해
- Nginx 설치 후 간단한 HTTP 서비스 띄우기

---

## Week 5 | Level 2 — 로그 수집 & 분석
**목표:** 시스템 로그 구조 이해

- `/var/log` 구조 파악
- `journalctl` 사용
- 크론(cron)으로 로그 백업
- 쉘 스크립트로 에러 통계
- 로그 로테이션(`logrotate`) 실습

---

## Week 6 | Level 3 — 자동화 프로젝트
**목표:** 스크립트 + cron으로 서버 관리 자동화

- 디렉토리 백업 자동화 (압축 + 날짜별 저장)
- 오래된 백업 자동 삭제
- 에러 발생 시 알림(메일, 로그)
- 간단한 모니터링 스크립트 작성

> Tip: 실제로 쓸 수 있는 스크립트를 만들어 포트폴리오에 추가

---

## Week 7 | Level 3 — 프로세스 모니터링
**목표:** 서버 상태를 실시간으로 확인

- `ps`, `top`, `htop` 사용
- CPU / 메모리 / Disk 사용량 기록
- 임계치 초과 시 알림 스크립트
- CLI 기반 간단한 Dashboard 만들기

---

## Week 8 | Level 4 — Self-hosted 서비스
**목표:** 실제 서비스 운영 체험

- Gitea / Minio / Jellyfin / Vaultwarden 중 하나 설치
- 디렉토리 권한 관리
- 서비스 시작 / 중지 / 상태 확인
- 외부 접속 테스트
- 로그 확인 및 문제 해결

---

## Week 9-10 | Level 4 — Docker 연계
**목표:** 컨테이너를 직접 다루며 서버 운영

- Docker / Docker Compose 설치
- 간단한 컨테이너 띄우기 (ex: nginx, postgres)
- Volume / Network 이해
- Compose 파일로 멀티 컨테이너 환경 구성
- 컨테이너 장애 시 재시작 실습

> Tip: 이전 서버/스크립트 경험과 연결 →  
> “리눅스 + Docker” 완전 정복
