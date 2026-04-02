# 블록체인 Remix 배포 + Node.js 테스트

현재 환경:
- Rocky Linux VM (192.168.56.101)
- Hyperledger Besu 23.7.3 설치 및 실행중
- IBFT 2.0 프라이빗 네트워크 (chainId: 1337)
- MetaMask 연결 완료
- Windows 로컬 PC에서 개발

프로젝트 내용:
- 곡(음악) 거래 플랫폼
- 곡 등록, 판매등록, 구매, 거래이력 조회 기능
- 스마트컨트랙트: MusicTrade.sol (Solidity)

[Windows 로컬 PC]
├── 백엔드 (Node.js)          → http://localhost:4000
│   ├── index.js              (Express 서버)
│   ├── routes/music.js       (API 라우터)
│   ├── contract/MusicTrade.json (ABI)
│   └── .env                  (설정값)
│
└── MetaMask (Chrome 확장)    → 지갑 주소 보관
    └── Besu Private 네트워크 연결됨

[Rocky Linux VM]
└── Hyperledger Besu 노드     → http://192.168.56.101:8545
    └── MusicTrade 컨트랙트   → 0x48c5...7ea5

** 백엔드 → Besu 노드
.env의 BESU_RPC_URL=http://192.168.56.101:8545 로 직접 연결
PRIVATE_KEY로 트랜잭션 서명 후 전송

** MetaMask → Besu 노드
Besu Private 네트워크 (192.168.56.101:8545) 연결됨
컨트랙트 배포할 때 사용했음

** 백엔드 ↔ MetaMask
직접 연결 아님!
백엔드는 PRIVATE_KEY로 직접 서명
MetaMask는 사용자 지갑 (프론트엔드용)

1. MetaMask 설치 (Chrome 확장 프로그램 사용)
2. Custom 네트워크 연결
3. MetaMask 계좌에 ETH 충전
-- ETH 충전을 Besu 정책상 막아놓아서 genesis.json을 수정하여 처음 시작 시 100 ETH를 갖고 시작하게 설정함

4. 코드 컴파일
-- 컴파일러 0.8.0

5. Remix IDE 에서 MetaMask 연결
-- Environment 에서 Browser Extension - MetaMask

6. 배포
Deploy 탭에 컴파일한 파일명 떠있는지 확인 후 Deploy 버튼

7. 연결된 MetaMask 에 계약 배포 팝업
-- 컨펌

8. 배포 성공하면 Deployed Contracts 주소 복사 (백엔드에서 이 주소를 이용해서 호출함)

컨트랙트 주소:
0x48c5d5A23CbDbdaD0b1f1d436FbffD5b5d6b7ea5

Besu RPC URL:
http://192.168.56.101:8545

Chain ID:
1337

9. 로컬 프로젝트 생성
프로젝트 구조 =>
blockchain-backend/
├── .env           ← 환경변수 (Besu 주소, 컨트랙트 주소)
├── index.js       ← 메인 서버 파일
├── contract/
│   └── MusicTrade.json  ← 컨트랙트 ABI
└── routes/
    └── music.js   ← API 라우터

10. 프로젝트 루트에서 Node.js 초기화
npm init -y

11. 패키지 설치
npm install ethers express cors dotenv

12. env 파일 생성
13. ABI 파일 가져오기

14. 백엔드 서버 실행
프로젝트 루트에서 node index.js

정상 실행시 → 서버 실행중: http://localhost:4000

# 함수
** 구매자 주소 (예시)
0x68eDC6C6D70A4a3D3B683fe5206d4854E913b3fF

** 판매 등록 확인
Method : GET
URL    : http://localhost:4000/api/music/ownership/1

** 곡 구매 (소유권 이전)
Method : POST
URL    : http://localhost:4000/api/music/buy
Body   : raw → JSON

{
  "songId": 1,
  "buyerAddress": "0x8cdb34d15dbbff23923b4dee6240fc5c29a9a826"
}

** 거래 이력 조회
Method : GET
URL    : http://localhost:4000/api/music/history/1

** 소유권 변경 확인
Method : GET
URL    : http://localhost:4000/api/music/ownership/1
→ owner가 구매자 주소로 바뀌었는지 확인







DB 저장
- 곡 제목
- 작곡가
- 가수
- 앨범 정보
- 가격
- 곡 설명
- 썸네일 이미지

블록체인 저장
- 거래 내역 (누가 누구에게 언제 얼마에 팔았는지)
- 소유권 이전 기록
- 최초 등록자 (원작자 증명)
- 거래 시 곡 ID (DB의 곡을 참조)


스마트 컨트랙트 주요 함수
registerSong(songId)곡 최초 등록 (소유권 등록)
listSong(songId, price)판매 등록
delistSong(songId)판매 취소
buySong(songId, buyer)구매 (소유권 이전)
getOwner(songId)현재 소유자 조회
getSongOwnership(songId)소유권 상세 조회
getTradeHistory(songId, index)거래 이력 조회
getTotalTradeCount()전체 거래 횟수 조회

// 곡 소유권 정보
    struct SongOwnership {
        uint256 songId;        // DB의 곡 ID
        address owner;         // 현재 소유자 주소
        address registeredBy;  // 최초 등록자 (원작자)
        uint256 registeredAt;  // 최초 등록 시간
        bool isForSale;        // 판매 여부
        uint256 price;         // 판매 가격 (원 단위)
    }

    // 거래 내역
    struct TradeHistory {
        uint256 songId;        // 거래된 곡 ID
        address seller;        // 판매자 주소
        address buyer;         // 구매자 주소
        uint256 price;         // 거래 금액
        uint256 tradedAt;      // 거래 시간
    }