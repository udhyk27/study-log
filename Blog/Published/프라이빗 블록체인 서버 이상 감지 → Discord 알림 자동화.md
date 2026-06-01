---
notion_page_id: 36181856-910c-8198-b6b9-d83f43a2d880
---
# 프라이빗 블록체인 서버 이상 감지 및 Discord 알림 구축

이전에 Hyperledger Besu 기반 프라이빗 블록체인을 구축하면서 여러 노드를 VM 환경에서 운영하고 있었습니다.

테스트를 진행하다 보니 Besu 프로세스가 종료되거나 RPC 응답이 멈추는 경우가 종종 발생했습니다.

특히 VM 자체가 종료되는 경우에는 서버에 직접 접속하기 전까지 상태를 확인하기 어려웠습니다.

그래서 블록체인 서버 상태를 외부에서 감시하고, 이상 발생 시 Discord로 알림을 받을 수 있는 모니터링 시스템을 구축해보았습니다.

## 시스템 구조

```text
[Blockchain VM]
        ↓
[node_exporter]

        ↓

[Monitoring VM]
        ↓
monitor.sh
        ↓
Discord Webhook
```

모니터링은 반드시 별도 VM에서 수행하도록 구성하였습니다.

처음에는 블록체인 VM 내부에서 자기 자신을 체크하려고 했지만, VM 자체가 종료되면 모니터링도 함께 중단된다는 문제가 있었습니다.

결과적으로 외부 VM에서 감시하는 방식으로 변경하였습니다.

## 감시 항목

현재 다음 항목들을 확인하도록 구성하였습니다.

| 항목       | 확인 방식              | 기준            |
| -------- | ------------------ | ------------- |
| VM 상태    | ping               | 응답 실패         |
| RPC 상태   | eth_blockNumber    | 응답 없음         |
| Peer 수   | net_peerCount      | 2개 미만         |
| 블록 생성    | 블록 번호 비교           | 180초 이상 변화 없음 |
| 루트 디스크   | node_exporter      | 80% 이상        |
| Besu 데이터 | textfile collector | 디스크의 50% 이상   |

Besu 상태는 JSON-RPC를 통해 확인하고, 시스템 메트릭은 node_exporter를 통해 수집하도록 분리하였습니다.

블록 생성 정지 기준은 QBFT 블록 생성 시간이 약 60초였기 때문에 3번 이상 생성되지 않는 상황인 180초로 설정하였습니다.

## 사전 확인

모니터링 스크립트를 작성하기 전에 네트워크 및 RPC 접근 여부를 먼저 확인하였습니다.

### ping 확인

```bash
ping -c 3 10.84.255.101
```

정상 응답이 오면 VM 자체는 살아있는 상태입니다.

### RPC 포트 확인

```bash
nc -zv 10.84.255.101 8545
```

포트가 열려 있어야 RPC 호출이 가능합니다.

### JSON-RPC 확인

```bash
curl -X POST \
-H "Content-Type: application/json" \
--data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
http://10.84.255.101:8545
```

응답이 정상적으로 오면 RPC 통신도 정상인 상태입니다.

이 과정에서 Besu가 외부 접근을 허용하도록 설정도 함께 확인하였습니다.

```text
--rpc-http-host=0.0.0.0
--host-allowlist
```

기본 설정 그대로라면 외부 VM에서 접근이 차단될 수 있습니다.

## Discord Webhook 연동

알림은 Discord Webhook을 사용하였습니다.

문제가 발생하면 Webhook URL로 POST 요청을 보내는 방식입니다.

```bash
curl -H "Content-Type: application/json" \
-d '{"content":"테스트 메시지"}' \
"WEBHOOK_URL"
```

Webhook URL은 설정 파일로 분리하였으며 권한도 제한하였습니다.

```bash
chmod 600 config.env
```

URL 자체가 비밀번호와 비슷한 역할을 하기 때문에 별도 관리하도록 구성하였습니다.

## 방화벽 설정

처음에는 node_exporter 포트를 단순 개방하려고 했습니다.

하지만 `/metrics`에는 시스템 정보가 그대로 노출되기 때문에 전체 공개는 적절하지 않다고 판단했습니다.

그래서 모니터링 VM만 접근할 수 있도록 화이트리스트 방식으로 구성하였습니다.

```bash
sudo firewall-cmd --permanent \
--add-rich-rule='rule family="ipv4"
source address="10.84.255.210"
port port="9100"
protocol="tcp"
accept'
```

일반적인 방식으로 포트를 개방하면 모든 IP에서 접근 가능합니다.

```bash
--add-port=9100/tcp
```

따라서 특정 IP만 허용하는 rich-rule을 사용하였습니다.

## node_exporter 적용

시스템 메트릭 수집을 위해 node_exporter를 설치하였습니다.

루트 디스크 사용량은 기본 메트릭을 사용하였고, Besu 데이터 디렉토리 크기는 textfile collector를 이용해 별도 메트릭으로 노출하였습니다.

구성 흐름은 다음과 같습니다.

```text
cron
→ besu_data_size.sh 실행
→ .prom 파일 생성
→ node_exporter 수집
```

이를 통해 Besu 데이터 디렉토리 크기도 Prometheus 형식으로 확인할 수 있었습니다.

## 구현 중 발생한 문제

### VirtualBox NAT 환경 IP 문제

처음에는 방화벽에서 모니터링 VM의 IP를 허용했지만 접근이 계속 실패하였습니다.

모니터링 VM에서 확인한 주소는 다음과 같았습니다.

```bash
ip route get 10.84.255.101
```

```text
10.0.2.15
```

하지만 서버에서 tcpdump로 확인해보니 실제 출발지 IP는 다른 주소였습니다.

```bash
sudo tcpdump -i any -n port 8545
```

```text
10.84.255.210
```

VirtualBox NAT 환경에서 주소 변환이 발생하고 있었던 것입니다.

실제 출발지 IP 기준으로 방화벽을 수정하여 해결하였습니다.

### node_exporter 실행 실패

Rocky Linux에서 node_exporter가 실행되지 않는 문제도 발생하였습니다.

```text
status=203/EXEC
Permission denied
```

파일 권한은 정상적이었지만 SELinux 라벨이 잘못 적용되어 있었습니다.

```bash
restorecon -v /usr/local/bin/node_exporter
```

라벨 복구 후 정상 실행되었습니다.

Rocky Linux 계열에서는 권한뿐 아니라 SELinux 라벨도 함께 확인해야 한다는 점을 다시 확인할 수 있었습니다.

## 상태 변경 기반 알림

스크립트는 cron을 이용해 매분 실행하도록 구성하였습니다.

하지만 매분마다 알림을 보내면 실제 장애를 확인하기 어려웠습니다.

그래서 상태가 변경되는 경우에만 알림을 전송하도록 구성하였습니다.

```text
정상 → 이상
→ 장애 알림

이상 → 정상
→ 복구 알림

정상 유지
→ 알림 없음
```

이전 상태를 파일로 저장하고 현재 상태와 비교하는 방식입니다.

덕분에 실제 장애 상황에서만 Discord 알림을 받을 수 있도록 구성할 수 있었습니다.

## 장애 테스트

구축 후 실제 장애 상황도 테스트하였습니다.

### Besu 프로세스 종료

```bash
kill <PID>
```

RPC 응답 실패, Peer 조회 실패, 블록 생성 중단 상태가 정상적으로 감지되었으며 Discord 알림도 확인할 수 있었습니다.

Besu 재시작 후에는 복구 알림도 정상적으로 전송되었습니다.

### VM 종료

```bash
shutdown -h now
```

외부 VM에서 감시하고 있었기 때문에 VM 다운 상태를 즉시 감지할 수 있었습니다.

모니터링 서버를 분리한 이유도 이 상황 때문이었습니다.

### Peer 감소

Validator 노드 하나를 종료하여 Peer 수 감소 상황도 테스트하였습니다.

QBFT 특성상 블록 생성은 계속 진행되었지만 Peer 부족 상태는 별도로 감지되었습니다.

단순 서버 상태뿐 아니라 블록체인 네트워크 상태도 함께 확인할 수 있었습니다.

### 디스크 임계값 초과

실제 디스크를 채우는 대신 임계값을 낮춰 테스트하였습니다.

```text
80% → 20%
```

현재 사용량이 기준을 초과하도록 만든 뒤 경고 알림이 정상 동작하는지 확인하였습니다.

## 결과

현재는 블록체인 서버에 문제가 발생하면 약 1분 이내에 Discord 알림을 받을 수 있습니다.

```text
VM 상태
RPC 상태
Peer 상태
블록 생성 여부
디스크 상태
```

를 함께 확인하도록 구성하였으며, 장애 발생 시 어느 부분에 문제가 있는지 빠르게 파악할 수 있게 되었습니다.

단순히 서버 생존 여부만 확인하는 수준을 넘어 블록체인 네트워크 상태까지 함께 모니터링할 수 있는 환경을 구축할 수 있었습니다.
