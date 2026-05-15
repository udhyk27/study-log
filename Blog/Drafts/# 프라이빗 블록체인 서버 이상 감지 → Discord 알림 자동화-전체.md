# 프라이빗 블록체인 서버 이상 감지 → Discord 알림 자동화

VM 위에서 돌리는 Hyperledger Besu 프라이빗 블록체인 서버에 문제가 생겼을 때(서버 다운, 노드 종료, RPC 응답 이상 등) Discord로 자동 알림을 받는 시스템을 구축한 기록.

---

## 1. 전체 구조

```
[블록체인 VM]  ← 감시 →  [모니터링 VM]  → Webhook →  [Discord]
   (Besu)                  (cron + bash)
```

### 핵심 원칙: 모니터링은 반드시 별도 VM에서

블록체인 VM 안에서 자기 자신을 감시하면 VM 자체가 죽었을 때 알림 스크립트도 같이 죽는다. "서버 다운"이라는 가장 중요한 케이스를 못 잡음.

따라서 별도의 VM에서 외부 관점으로 감시해야 한다.

---

## 2. 감지 대상

| 항목 | 확인 방법 | 임계값 |
|------|----------|--------|
| VM 자체 다운 | ping | 1회 실패 시 |
| RPC 응답 정상 | `eth_blockNumber` JSON-RPC | 응답 없거나 비정상 |
| Peer 수 | `net_peerCount` | 2개 미만 (헤드 + 2노드 구성) |
| 블록 생성 정지 | 블록 번호 비교 | 180초 이상 정지 (QBFT 블록 시간 60초 × 3) |
| 디스크 용량 | node_exporter `/metrics` | 80% 이상 |

블록체인 관련 4가지는 **Besu RPC(8545)** 로, 시스템 메트릭은 **node_exporter(9100)** 로 분리.

---

## 3. 사전 준비: 접근 가능성 테스트

모니터링 VM에서 블록체인 VM(10.84.255.101)으로 접근 가능한지 단계적으로 확인.

### 3-1. ping 테스트

```bash
ping -c 3 10.84.255.101
```

→ 응답 정상. VM 살아있고 네트워크 도달 가능.

### 3-2. RPC 포트(8545) 열림 여부

```bash
sudo dnf install -y nmap-ncat
nc -zv 10.84.255.101 8545
```

`nc` 없을 때 대안:
```bash
timeout 3 bash -c '</dev/tcp/10.84.255.101/8545' && echo "OPEN" || echo "CLOSED"
```

### 3-3. 실제 RPC 호출

```bash
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  http://10.84.255.101:8545
```

결과:
```json
{"jsonrpc":"2.0","id":1,"result":"0x737b"}
```

`0x737b` = 29,563번째 블록. RPC 정상 동작 확인.

### 3-4. Besu RPC가 외부에서 안 열릴 때 체크포인트

- `--rpc-http-host=0.0.0.0` (또는 모니터링 VM IP) — 기본값 `127.0.0.1`이면 외부 접근 불가
- `--host-allowlist` — Besu 기본 정책이 엄격함, 모니터링 VM 호스트/IP 추가
- 방화벽 (ufw, firewalld, 클라우드 Security Group)
- **8545 포트는 절대 0.0.0.0으로 전체 공개 금지**, 모니터링 VM IP만 허용

---

## 4. Discord Webhook 발급

1. Discord 서버 선택 (없으면 신규 생성)
2. 알림 받을 채널 우클릭 → **채널 편집**
3. 좌측 **연동(Integrations)** → **웹후크** → **새 웹후크**
4. 이름 지정 (예: `Besu Monitor`) → **웹후크 URL 복사**

### 동작 테스트

```bash
curl -H "Content-Type: application/json" \
  -d '{"content":"테스트 메시지"}' \
  "복사한_WEBHOOK_URL"
```

Discord 채널에 메시지 표시되면 성공.

> **주의**: Webhook URL은 비밀번호와 동급. 코드/저장소에 하드코딩 금지, 환경변수나 권한 600 파일로 분리 보관.

---

## 5. node_exporter 설치 (블록체인 VM)

디스크 용량 등 시스템 메트릭을 외부에서 조회하기 위해 블록체인 VM에 설치.

### 환경

- Rocky Linux 9.7 (RHEL 계열)
- x86_64

### 설치 절차

```bash
# 1. 다운로드 & 압축 해제
cd /tmp
curl -LO https://github.com/prometheus/node_exporter/releases/download/v1.8.2/node_exporter-1.8.2.linux-amd64.tar.gz
tar xvf node_exporter-1.8.2.linux-amd64.tar.gz

# 2. 바이너리 이동
sudo mv node_exporter-1.8.2.linux-amd64/node_exporter /usr/local/bin/
sudo chmod +x /usr/local/bin/node_exporter

# 3. 전용 사용자 생성
sudo useradd --no-create-home --shell /sbin/nologin node_exporter
sudo chown node_exporter:node_exporter /usr/local/bin/node_exporter
```

### systemd 서비스 등록

```bash
sudo tee /etc/systemd/system/node_exporter.service > /dev/null <<'EOF'
[Unit]
Description=Node Exporter
Wants=network-online.target
After=network-online.target

[Service]
User=node_exporter
Group=node_exporter
Type=simple
ExecStart=/usr/local/bin/node_exporter
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now node_exporter
```

메트릭 노출 확인:
```bash
curl -s http://localhost:9100/metrics | head -20
```

---

## 6. 트러블슈팅

### 6-1. node_exporter `status=203/EXEC` 에러 (SELinux)

#### 증상

```
node_exporter.service: Failed to locate executable /usr/local/bin/node_exporter: Permission denied
Main process exited, code=exited, status=203/EXEC
```

서비스가 시작 즉시 종료되고 자동 재시작 무한 반복.

#### 원인

`/tmp`에서 압축을 풀고 `/usr/local/bin`으로 이동했더니 SELinux 라벨이 `user_tmp_t`로 남아있음. systemd는 이 라벨이 붙은 파일을 실행 거부.

확인:
```bash
ls -lZ /usr/local/bin/node_exporter
# unconfined_u:object_r:user_tmp_t:s0  ← 문제
```

#### 해결

`restorecon`으로 경로 기본 라벨(`bin_t`) 복원:

```bash
sudo restorecon -v /usr/local/bin/node_exporter
sudo systemctl restart node_exporter
```

#### 교훈

- Rocky Linux, RHEL, CentOS는 SELinux 기본 활성화. `/tmp`에서 작업한 파일은 라벨 이슈 주의
- 권한(chmod, chown) 정상이어도 SELinux가 막는 경우 있음
- `ls -lZ`로 SELinux 라벨까지 확인하는 습관

---

### 6-2. 모니터링 VM이 어떤 IP로 보이는지 식별 (NAT 환경)

#### 배경

방화벽에서 9100 포트를 모니터링 VM IP에만 허용하려고 보니, 모니터링 VM이 VirtualBox NAT 환경이라 자신이 보는 IP와 블록체인 VM이 보는 IP가 다름.

**모니터링 VM에서 본 자기 IP:**
```bash
$ ip route get 10.84.255.101
10.84.255.101 via 10.0.2.2 dev enp0s3 src 10.0.2.15
```

→ 자기는 `10.0.2.15`로 통신한다고 인식. 하지만 NAT 거치면서 변환됨.

#### 해결: tcpdump로 실제 출발지 IP 확인

블록체인 VM에서 패킷 캡처 대기 후 모니터링 VM에서 RPC 호출:

```bash
# 블록체인 VM
sudo tcpdump -i any -n port 8545 -c 5

# 모니터링 VM
curl -X POST ... http://10.84.255.101:8545
```

블록체인 VM 출력:
```
IP 10.84.255.210.53727 > 10.84.255.101.8545
```

→ 실제로는 **10.84.255.210**으로 들어옴. 이 IP를 방화벽에 허용해야 함.

#### 교훈

NAT 환경에서는 클라이언트가 자기 인식하는 IP와 서버가 보는 IP가 다름. 방화벽 룰 작성 전 반드시 **서버 측에서** 실제 출발지 IP 확인.

---

### 6-3. bash `bc` 명령어 `syntax error` (지수 표기법)

#### 증상

```
(standard_in) 1: syntax error
```

디스크 사용률 출력이 비어있음:
```
디스크 (/): % 사용 (남은 GB / GB)
```

#### 원인

node_exporter는 큰 숫자를 지수 표기법(`1.818230784e+10`)으로 출력. 그런데 `bc`는 이 형식을 못 읽음.

#### 해결: awk로 계산

```bash
# bc (실패)
used_pct=$(echo "scale=1; ($size - $avail) / $size * 100" | bc)

# awk (성공) - 지수 표기법 자동 처리
used_pct=$(awk -v s="$size" -v a="$avail" 'BEGIN { printf "%.1f", (s - a) / s * 100 }')
```

#### 교훈

Prometheus/node_exporter 류 메트릭은 큰 숫자가 지수 표기법으로 나옴. bash 산술 연산할 때는 `bc` 대신 `awk` 또는 Python 사용.

---

### 6-4. Discord 메시지 시간과 로그 시간 13시간 차이 (타임존)

#### 증상

Discord에는 `PM 5:07`, 메시지 본문/VM 로그에는 `04:07:22` → 13시간 차이.

#### 원인

VM 타임존이 EDT(미국 동부, UTC-4)였음. Discord 클라이언트는 사용자 로컬(KST, UTC+9)로 표시. 차이 13시간.

```bash
$ timedatectl
                Time zone: America/New_York (EDT, -0400)
```

#### 해결

```bash
sudo timedatectl set-timezone Asia/Seoul
```

블록체인 VM도 동일하게 변경. cron 시간도 자동으로 KST로 전환됨.

#### 교훈

해외 클라우드 이미지나 기본 OS 설치는 종종 UTC 또는 미국 타임존. 운영 시작 전 `timedatectl`로 확인. 멀티 VM 환경은 타임존 통일 필수.

---

## 7. 방화벽 룰 추가 (9100 포트)

블록체인 VM에서 모니터링 VM IP에만 9100 포트 허용.

```bash
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="10.84.255.210" port port="9100" protocol="tcp" accept'
sudo firewall-cmd --reload
```

### `--add-port` 대신 `rich rule`을 쓰는 이유

- `--add-port=9100/tcp` → **모든 IP**에서 접근 가능 (보안 취약)
- `rich rule` → 특정 IP에서만 접근 허용

node_exporter의 `/metrics`는 인증이 없어 시스템 정보가 그대로 노출됨. 반드시 IP 화이트리스트 필수.

---

## 8. 모니터링 스크립트

모니터링 VM에 작업 디렉토리 생성:

```
~/besu-monitor/
├── monitor.sh          # 테스트 모드 (매번 알림)
├── monitor_prod.sh     # 정식 모드 (상태 전환 시점만 알림)
├── config.env          # Webhook URL, 임계값 (권한 600)
├── monitor.log
└── state/              # 이전 블록, 이전 상태 저장
```

### 설정 파일 (`config.env`)

```bash
BESU_HOST="10.84.255.101"
BESU_RPC_PORT="8545"
NODE_EXPORTER_PORT="9100"

EXPECTED_PEERS=2
BLOCK_STALL_SECONDS=180
DISK_USAGE_THRESHOLD=80

DISCORD_WEBHOOK_URL="..."
```

권한:
```bash
chmod 600 config.env
```

### 스크립트 핵심 로직

각 체크 함수는 결과를 배열에 누적하고, 하나라도 실패하면 `OVERALL_STATUS="이상"`으로 표시.

- **RPC**: `eth_blockNumber` 호출 후 `jq`로 결과 파싱, 16진수 → 10진수 변환
- **Peer 수**: `net_peerCount` 결과를 기대값과 비교
- **블록 정지**: `state/last_block.txt`에 이전 블록 번호와 시각 저장, 다음 실행 때 비교. 임계값(`BLOCK_STALL_SECONDS`) 초과 시 이상
- **디스크**: node_exporter `/metrics`에서 `node_filesystem_size_bytes`, `node_filesystem_avail_bytes` 파싱 후 awk로 사용률 계산

### Discord 메시지

`jq`로 embed JSON 페이로드 생성 후 webhook으로 POST.

- 정상: 녹색 (`3066993`)
- 이상: 빨강 (`15158332`)

---

## 9. 정식 모드: 상태 전환 시점에만 알림

매분 체크하지만, 알림은 다음 경우에만 발송:

- **정상 → 이상**: 🚨 이상 감지 알림 (1회)
- **이상 → 정상**: ✅ 복구 알림 (1회)
- **정상 유지** 또는 **이상 지속**: 알림 없음

### 구현 핵심

`state/last_status.txt`에 이전 실행의 상태(`정상` / `이상`)를 저장. 매 실행마다 현재 상태와 비교해서 전환 시점에만 알림.

```bash
PREV_STATUS=$(cat state/last_status.txt)

if [[ "$PREV_STATUS" == "정상" && "$OVERALL_STATUS" == "이상" ]]; then
    # 이상 발생 알림
elif [[ "$PREV_STATUS" == "이상" && "$OVERALL_STATUS" == "정상" ]]; then
    # 복구 알림
fi

echo "$OVERALL_STATUS" > state/last_status.txt
```

### cron 등록

```bash
crontab -e
```

```
* * * * * /home/ydh/besu-monitor/monitor_prod.sh >> /home/ydh/besu-monitor/monitor.log 2>&1
```

매분 실행. 평상시엔 조용하고 문제 생길 때만 알림.

---

## 10. 장애 시나리오 테스트

구축 직후 실제로 알림이 잘 오는지 4가지 시나리오로 검증.

### 시나리오 1: Besu 프로세스 중단

**테스트:**
```bash
# 블록체인 VM
ps aux | grep besu | grep -v grep   # PID 확인
kill <PID>
```

**예상 결과:** RPC, Peer, 블록 생성 모두 실패. VM과 디스크는 정상.

**실제 알림:**
```
🚨 Besu 이상 감지
✅ VM 응답: ping OK
❌ RPC 응답: 응답 없음
❌ Peer 수: 조회 실패
❌ 블록 생성: 현재 블록 조회 실패로 판단 불가
✅ 디스크 (/): 23.6% 사용 (남은 12.9GB / 16.9GB)
```

→ 의도대로 동작. node_exporter는 별도 프로세스라 영향 없음 확인.

복구: Besu 재시작 → 다음 분에 ✅ 정상 복구 알림 도착.

---

### 시나리오 2: 블록체인 VM 자체 종료

**테스트:**
```bash
# 블록체인 VM
sudo shutdown -h now
```

또는 VirtualBox에서 강제 종료 (예기치 않은 다운 시뮬레이션).

**예상 결과:** ping부터 실패. 다른 항목은 체크 안 함.

**실제 알림:**
```
🚨 Besu 이상 감지
❌ VM 응답: ping 실패 (서버 다운 의심)
```

→ 가장 중요한 시나리오. 모니터링 VM을 분리한 이유가 이 케이스를 잡기 위함이었고, 정상 감지됨.

복구: VM 재시작 + Besu 재실행 → 복구 알림 도착.

---

### 시나리오 3: Peer 노드 1개 끊김

**배경:** 헤드 노드 + 2개 = 총 3노드 구성. 1개 끄면 헤드 입장에서 Peer 수가 2 → 1.

**테스트:** Peer 노드 중 1개의 Besu 프로세스 종료.

**예상 결과:** Peer 수 감소 알림. QBFT는 3노드 중 2개 살아있으면 정족수(2/3) 유지되므로 블록 생성은 계속됨.

**실제 알림:**
```
🚨 Besu 이상 감지
✅ VM 응답: ping OK
✅ RPC 응답: 정상 (블록 #29627)
❌ Peer 수: 1/2 (부족)
✅ 블록 생성: 29626 → 29627 (60초간 +1)
✅ 디스크 (/): 23.7% 사용
```

→ 예상대로 Peer만 실패, 블록 생성은 계속 진행. QBFT 정족수 이론 검증됨.

---

### 시나리오 4: 디스크 용량 임계값 초과

**테스트:** 실제 디스크를 채우지 않고, 임계값을 임시로 낮춰서 알림 트리거.

```bash
sed -i 's/DISK_USAGE_THRESHOLD=80/DISK_USAGE_THRESHOLD=20/' config.env
```

**예상 결과:** 현재 사용률 23.7%가 임계값 20%를 초과하므로 디스크 이상 알림.

**실제 알림:**
```
🚨 Besu 이상 감지
✅ VM 응답: ping OK
✅ RPC 응답: 정상
✅ Peer 수: 2/2
✅ 블록 생성: 정상
❌ 디스크 (/): 23.7% 사용 (남은 12.9GB / 16.9GB)
```

→ 임계값 로직 정상 동작 확인.

**원복:**
```bash
sed -i 's/DISK_USAGE_THRESHOLD=20/DISK_USAGE_THRESHOLD=80/' config.env
```

---

### 시나리오 테스트 결론

4가지 모두 통과. 각 항목이 독립적으로 동작하며 어느 한 항목이 실패해도 나머지는 계속 체크됨. 알림에 어떤 항목이 문제인지 명확히 표시되어 디버깅 시간 단축.

---

## 11. 보완 가능한 부분

운영하면서 추가로 챙기면 좋은 항목.

- **모니터링 VM 자체 다운 대응**: Healthchecks.io 같은 외부 dead man's switch를 추가로 걸어두면 모니터링 VM 자체가 죽었을 때도 알 수 있음
- **로그 로테이션**: `monitor.log`가 무한히 커지지 않도록 `logrotate` 설정
- **알림 채널 분리**: 정보(daily 상태) / 경고(peer 부족) / 위험(VM 다운) 채널 분리
- **메트릭 시각화**: node_exporter는 이미 Prometheus 표준 포맷이므로, Prometheus + Grafana로 확장 가능