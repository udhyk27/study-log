### 서버 Besu 설치 ###
1. 자바 17 or 21 설치 → 여기선 17로 진행
sudo dnf install java-17-openjdk -y
java -version

2. Hyperledger Besu 설치
[홈 디렉토리에서 wget 없으면 설치]
cd ~
wget --version
sudo dnf install wget -y

[Besu 다운로드 - 자바 버전에 호환되는 버전으로]
wget https://hyperledger.jfrog.io/artifactory/besu-binaries/besu/23.7.3/besu-23.7.3.tar.gz

[압축해제]
tar -xzf besu-23.7.3.tar.gz

[환경변수 설정 - PATH에 Besu 추가 및 적용]
echo 'export PATH=$PATH:~/besu-23.7.3/bin' >> ~/.bashrc
source ~/.bashrc

[설치 확인]
besu --version

[정상 출력 예시]
besu/v23.7.3/linux-x86_64/openjdk-java-17

3. 프라이빗 네트워크 구성 (IBFT 2.0)
[작업 디렉토리 생성]
cd ~
mkdir -p besu-private/node1/data
cd besu-private

[genesis.json 생성]
cat > genesis.json << 'EOF'
{
  "config": {
    "chainId": 1337,
    "berlinBlock": 0,
    "ibft2": {
      "blockperiodseconds": 2,
      "epochlength": 30000,
      "requesttimeoutseconds": 4
    }
  },
  "nonce": "0x0",
  "timestamp": "0x58ee40ba",
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "alloc": {}
}
EOF

[노드 키 생성]
besu --data-path=node1/data public-key export-address --to=node1/data/node1Address

[생성된 주소 확인]
cat node1/data/node1Address
예시 → 0x8cdb34d15dbbff23923b4dee6240fc5c29a9a826

[validators JSON 파일 생성]
cat > ibft_extra.json << 'EOF'
["0x8cdb34d15dbbff23923b4dee6240fc5c29a9a826"]
EOF

[RLP 인코딩 실행]
besu rlp encode --type=IBFT_EXTRA_DATA --from=ibft_extra.json

[extraData 값이 나옴]
예시 → 0xf83ea00000000000000000000000000000000000000000000000000000000000000000d5948cdb34d15dbbff23923b4dee6240fc5c29a9a826808400000000c0

[genesis.json 파일 수정 → coinbase 줄 아래에 extraData 추가]
{
  "config": {
    "chainId": 1337,
    "berlinBlock": 0,
    "ibft2": {
      "blockperiodseconds": 2,
      "epochlength": 30000,
      "requesttimeoutseconds": 4
    }
  },
  "nonce": "0x0",
  "timestamp": "0x58ee40ba",
  "gasLimit": "0x1fffffffffffff",
  "difficulty": "0x1",
  "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "extraData": "0xf83ea00000000000000000000000000000000000000000000000000000000000000000d5948cdb34d15dbbff23923b4dee6240fc5c29a9a826808400000000c0",
  "alloc": {}
}

[Besu 노드(블록체인 서버) 실행]

besu \
  --data-path=node1/data \ 
  --genesis-file=genesis.json \
  --rpc-http-enabled=true \
  --rpc-http-api=ETH,NET,IBFT \
  --host-allowlist="*" \
  --rpc-http-cors-origins="all" \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-port=8545 &

besu \
  --data-path=node1/data \
  --genesis-file=genesis.json \
  --rpc-http-enabled=true \
  --rpc-http-api=ETH,NET,IBFT \
  --host-allowlist="*" \
  --rpc-http-cors-origins="all" \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-port=8545 \
  --min-gas-price=0 &

→ 백엔드에서 http://localhost:8545로 요청 보내서 블록체인에 데이터 읽기/쓰기 가능
→ 데이터 저장 경로
→ 초기 설정 파일
→ HTTP RPC 서버 활성화 (외부 API 호출)
→ 모든 호스트 접근 허용
→ 모든 CORS 허용
→ 모든 네트워크 인터페이스에서 수신
→ RPC 통신 포트번호

* 노드 kill 명령어
* pkill -f besu

[정상 실행되면 로그 계속해서 나옴]
INFO  | IbftBesuController | Starting IBFT2 block mining
INFO  | BlockProcessor     | Produced #1 / 0 tx
INFO  | BlockProcessor     | Produced #2 / 0 tx
...


[서버의 새 터미널에서 테스트]
curl -X POST \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  -H "Content-Type: application/json" \
  http://localhost:8545

정상 응답 예시 → {"jsonrpc":"2.0","id":1,"result":"0xe5"}

[로컬에서 원격 접속 테스트 - 파워쉘 (노드 실행 시 CORS 접속 허용 필요)]
$body = '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
Invoke-RestMethod -Uri "http://192.168.56.101:8545" -Method POST -ContentType "application/json" -Body $body

출력 예시 →
jsonrpc id result
------- -- ------
2.0      1 0x496

4. 스마트 컨트랙트 작성 (Solidity)

5. 컨트랙트 배포 
[테스트 환경 → Remix IDE (웹브라우저)]
-- sol 파일에 작성 후 compile, deploy
-- Deploy → Custom - External Http Provider → http://192.168.56.101:8545
-- Contract → MusicTrade → Deploy
-- 하단에 배포된 컨트랙트 주소 확인

[배포환경 → Hardhat]
프로젝트 디렉토리에 Hardhat 디렉토리 따로 생성

6. 백엔드 연동
