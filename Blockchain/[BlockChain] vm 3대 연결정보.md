노드1 (101): 0x40ac0f4d3d0aefec90805f6cbf747305eec8a25e
노드2 (102): 0x1bc8eaf1cdbc32bca2fec2f451bf384f0cbb1550
노드3 (103): 0x70812a485807bf120a253de966ffc8befe63579e

배포 계정: 0x1f7a4A61dc265B1F073cd4cA9F6adD499035A689
MCILedger 배포 주소: 0xBC69Cf59bbF7728d0C2984398f5A6C4E7D1DC437
RoyaltyAgreementRegistry 배포 주소: 0x48c5d5A23CbDbdaD0b1f1d436FbffD5b5d6b7ea5
SettlementLedger 배포 주소: 0xc69C4575B52E0859E0e45F0678284ED7d991A95A

========== 배포 완료 ==========
MCILedger: 0xBC69Cf59bbF7728d0C2984398f5A6C4E7D1DC437
RoyaltyAgreementRegistry: 0x48c5d5A23CbDbdaD0b1f1d436FbffD5b5d6b7ea5
SettlementLedger: 0xc69C4575B52E0859E0e45F0678284ED7d991A95A
================================


# 넘겨줄 것
1. CONTRACT_ADDRESS
   0xc69C4575B52E0859E0e45F0678284ED7d991A95A

2. ABI (위 JSON)

3. RPC URL
   http://10.84.255.101:8545

4. chainId
   84100

5. 함수 명세서 (이전에 정리한 것)

### 순서
1. VM 1, 2, 3 각각에서 노드 키 생성
        ↓
2. 3개 노드 주소 수집
        ↓
3. genesis.json 작성 (extraData에 3개 주소 포함)
        ↓
4. genesis.json을 3대 VM에 동일하게 복사
        ↓
5. 각 VM에서 Besu 실행 (p2p로 서로 연결)


[VM 1번 노드 키]
0xc83adfbf956b4e3a06cf86cc8ca3d8029c69c368

[VM 2번 노드 키 - 처음 구축]
0x1bc8eaf1cdbc32bca2fec2f451bf384f0cbb1550

[VM 3번 노드 키]
0x70812a485807bf120a253de966ffc8befe63579e


toEncode.json (노드 주소 3개 목록)
        ↓
besu rlp encode 명령어로 변환
        ↓
0xf87aa00000...  (RLP 인코딩된 긴 문자열)
        ↓
genesis.json extraData에 이 값을 넣음

[genesis.json 생성]
cd ~/besu.node

cat > genesis.json << 'EOF'
{
  "config": {
    "chainId": 84100,
    "homesteadBlock": 0,
    "eip150Block": 0,
    "eip155Block": 0,
    "eip158Block": 0,
    "byzantiumBlock": 0,
    "constantinopleBlock": 0,
    "petersburgBlock": 0,
    "istanbulBlock": 0,
    "berlinBlock": 0,
    "londonBlock": 0,
    "zeroBaseFee": true,
    "qbft": {
      "blockperiodseconds": 60,
      "epochlength": 30000,
      "requesttimeoutseconds": 120
    }
  },
  "nonce": "0x0",
  "timestamp": "0x58ee40ba",
  "gasLimit": "0x47b760",
  "difficulty": "0x1",
  "mixHash": "0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365",
  "coinbase": "0x0000000000000000000000000000000000000000",
  "extraData": "0xf865a00000000000000000000000000000000000000000000000000000000000000000f83f94c83adfbf956b4e3a06cf86cc8ca3d8029c69c368941bc8eaf1cdbc32bca2fec2f451bf384f0cbb15509470812a485807bf120a253de966ffc8befe63579ec080c0",
  "alloc": {}
}
EOF

[extraData 생성]
cd ~/besu-node

cat > toEncode.json << 'EOF'
[
  "0xc83adfbf956b4e3a06cf86cc8ca3d8029c69c368",
  "0x68eDC6C6D70A4a3D3B683fe5206d4854E913b3fF",
  "0x70812a485807bf120a253de966ffc8befe63579e"
]
EOF

besu rlp encode --from=toEncode.json --type=QBFT_EXTRA_DATA

출력 예시:
0xf865a00000000000000000000000000000000000000000000000000000000000000000f83f94c83adfbf956b4e3a06cf86cc8ca3d8029c69c3689468edc6c6d70a4a3d3b683fe5206d4854e913b3ff9470812a485807bf120a253de966ffc8befe63579ec080c0


[extraData 수정할 필요할 때]
pkill -f besu
rm -rf ~/besu-node/node/data/database
rm -rf ~/besu-node/node/data/caches
rm -f ~/besu-node/node/data/DATABASE_METADATA.json
rm -f ~/besu-node/node/data/LOCK
노드 다시실행


[VM2, VM3로 genesis.json 복사]
scp ~/besu-node/genesis.json webmaster@10.84.255.103:~/besu-node/



[VM1, 2, 3에서 포트 열기 - 방화벽]
sudo firewall-cmd --permanent --add-port=30303/tcp
sudo firewall-cmd --permanent --add-port=30303/udp
sudo firewall-cmd --permanent --add-port=8545/tcp
sudo firewall-cmd --reload

확인
sudo firewall-cmd --list-all


[Besu 노드 실행 - VM1]
nohup besu \
  --data-path=node/data \
  --genesis-file=genesis.json \
  --rpc-http-enabled=true \
  --rpc-http-api=ETH,NET,QBFT,ADMIN \
  --host-allowlist="*" \
  --rpc-http-cors-origins="all" \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-port=8545 \
  --min-gas-price=0 \
  --p2p-enabled=true \
  --p2p-host=10.84.255.101 \
  --p2p-port=30303 \
  --logging=INFO \
  > besu.log 2>&1 &
  
[VM1의 encode 찾기]
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"admin_nodeInfo","params":[],"id":1}'

[VM2, VM3 에서 encode 입력하고 노드 실행]
** VM2
nohup besu \
  --data-path=node/data \
  --genesis-file=genesis.json \
  --rpc-http-enabled=true \
  --rpc-http-api=ETH,NET,QBFT,ADMIN \
  --host-allowlist="*" \
  --rpc-http-cors-origins="all" \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-port=8545 \
  --min-gas-price=0 \
  --p2p-enabled=true \
  --p2p-host=10.84.255.102 \
  --p2p-port=30303 \
  --logging=INFO \
  > besu.log 2>&1 &

** VM3
nohup besu \
  --data-path=node/data \
  --genesis-file=genesis.json \
  --rpc-http-enabled=true \
  --rpc-http-api=ETH,NET,QBFT,ADMIN \
  --host-allowlist="*" \
  --rpc-http-cors-origins="all" \
  --rpc-http-host=0.0.0.0 \
  --rpc-http-port=8545 \
  --min-gas-price=0 \
  --p2p-enabled=true \
  --p2p-host=10.84.255.103 \
  --p2p-port=30303 \
  --logging=INFO \
  > besu.log 2>&1 &

[VM1에서 연결 확인]
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"admin_peers","params":[],"id":1}'


=> result 에 연결된 노드 정보 뜨면 성공 !!

컨트랙트 주소:
0x453B1B61342918839E954A072760237264bB0855

ABI 파일 위치 확인
artifacts/contracts/MusicRoyalty.sol/MusicRoyalty.json


# 노드 확인 명령어

## 연결된 피어 확인
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"admin_peers","params":[],"id":1}'

## 블록 번호 확인
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'

## QBFT 검증자 확인
curl -s -X POST http://localhost:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"qbft_getValidatorsByBlockNumber","params":["latest"],"id":1}'
  
## 블록 조회 명령어
curl -X POST http://10.84.255.101:8545 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["0x2d4", true],"id":1}'
  
MCP관리, 컨텍스트
