## 1 프로젝트 구조
blockchain-musictrade-study/              ← Git 저장소 루트
├── .gitignore                ← 루트에 하나만
├── README.md
├── music-trade-hardhat/     ← Hardhat 프로젝트
└── music-trade-java/        ← Spring Boot 프로젝트

## 2 ── Hardhat 프로젝트 ─────────────────────────────────────────────
music-trade-hardhat/
├── contracts/
│   └── MusicTrade.sol           ← 스마트컨트랙트
├── scripts/
│   └── deploy.js                ← Besu 배포 스크립트
├── test/
│   └── MusicTrade.test.js       ← 단위 테스트 (생성 안함)
├── artifacts/                   ← 컴파일 결과 (자동 생성)
│   └── contracts/MusicTrade.sol/
│       └── MusicTrade.json      ← ABI + bytecode
├── hardhat.config.js
├── .env                         ← 프라이빗 키 (Git 제외)
├── .gitignore
└── package.json

## 3 ── Java Spring Boot 프로젝트 ────────────────────────────────────
music-trade-java/
├── src/main/
│   ├── java/com/musictrade/
│   │   ├── MusicTradeApiApplication.java
│   │   ├── config/
│   │   │   └── Web3jConfig.java          ← Web3j 빈 설정
│   │   ├── contract/
│   │   │   └── MusicTradeContract.java   ← 컨트랙트 래퍼
│   │   ├── controller/
│   │   │   └── MusicTradeController.java ← REST API
│   │   ├── service/
│   │   │   └── MusicTradeService.java    ← 비즈니스 로직
│   │   ├── dto/
│   │   │   ├── RegisterSongRequest.java
│   │   │   ├── ListForSaleRequest.java
│   │   │   ├── BuySongRequest.java
│   │   │   ├── SongResponse.java
│   │   │   ├── TxResponse.java
│   │   │   └── TradeRecordResponse.java
│   │   └── exception/
│   │       └── GlobalExceptionHandler.java
│   └── resources/
│       ├── application.yml
│       └── MusicTrade.abi                ← 배포 후 복사 (deploy.js가 자동화)
└── pom.xml

=========================================================================================================================
=========================================================================================================================

### ── Hardhat 프로젝트 생성 ─────────────────────────────────────────────
1. 프로젝트 생성 및 git init & gitignore
mkdir blockchain-musictrade-study
git init ~~ 등등

2. Hardhat 프로젝트 생성
mkdir music-trade-hardhat
cd music-trade-hardhat

[npm 초기화]
npm init -y

[Hardhat v2 설치 - 설치되어 있으면 생략]
npm install --save-dev hardhat@2

[Hardhat 초기화]
npx hardhat
* What do you want to do? → Create a JavaScript project 

3. .env 파일 생성
DEPLOYER_PRIVATE_KEY=MetaMask_프라이빗키_64자리
BESU_RPC_URL=http://192.168.56.101:8545 (Besu URL)

4. hardhat.config.js 수정
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: "0.8.20",
  networks: {
    besu: {
      url: process.env.BESU_RPC_URL,
      chainId: 1337,
      accounts: [process.env.DEPLOYER_PRIVATE_KEY],
      gasPrice: 0,
      gas: 6000000,
    },
  },
};

5. dotenv 패키지 설치
npm install dotenv

6. 루트에서 scripts 디렉토리 생성 (배포)
[scripts/deploy.js 생성]
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("배포 계정:", deployer.address);
  console.log("계정 잔액:", ethers.formatEther(
    await ethers.provider.getBalance(deployer.address)
  ), "ETH");

  const MusicTrade = await ethers.getContractFactory("MusicTrade");
  const contract = await MusicTrade.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("MusicTrade 배포 완료:", address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


7. ** 컨트랙트 배포 (Hardhat 프로젝트 루트에서) **
npx hardhat run scripts/deploy.js --network besu

* deploy.js에서 console로 찍은 내용이 나오면서 배포완료
*** 배포된 컨트랙트 주소 복사해놓아야 함 - 13번에서 사용
*** ex) 0xBC69Cf59bbF7728d0C2984398f5A6C4E7D1DC437

8. ABI 주소 추출 (백엔드 프로젝트에서 필요)
→ hardhat 프로젝트/artifacts/contracts/~~.sol/~~.json 파일에 있음
→ "abi" 키의 값 복사 → ("[" 부터 "]" 대괄호 포함)
→ hardhat 프로젝트 루트에 새 파일 ~~.abi 만들어서 붙여넣기

### ── Java Spring Boot 프로젝트 생성 ─────────────────────────────────────────────

9. Spring Boot 프로젝트 디렉토리 생성

10. build.gradle - dependencies 에 Web3j 추가 (Besu 블록체인 연결 + 컨트랙트 호출)
implementation 'org.web3j:core:4.9.8'
implementation 'io.github.cdimascio:dotenv-java:3.0.0'

11. abi 파일 생성 ( 8번에서 ABI 주소 추출한 파일)
src/main/resources/abi/~~.abi
resources/static/~~.abi

12. Web3jConfig 파일 생성
→ Web3j 객체를 Spring Bean 으로 등록

13. application.properties 작성
* BESU_RPC_URL
* BESU_CONTRACT_ADDRESS

14. service, controller, dto 생성

15. 프론트에서 지갑 연결, 서비스 제공
→ 서버 실행해서 HTTP 요청 문제 없는지 확인








12. .env 파일 생성
BESU_RPC_URL=http://192.168.56.101:8545
BESU_CONTRACT_ADDRESS=0x403E2E454D9E7D83237c2CF4cD23bAc74143e27d

BESU_PRIVATE_KEY=0x개인키

* 개인키 앞에 0를 붙여야 함
* main 함수에서 .env 파일 로드해야함

13. application.properties 작성
server.port=8080
besu.rpc.url=${BESU_RPC_URL}
besu.contract.address=${BESU_CONTRACT_ADDRESS}

besu.wallet.private-key=${BESU_PRIVATE_KEY}

14. Web3jConfig 파일 생성
→ Web3j 객체를 Spring Bean 으로 등록

15. service/controller/dto 생성

16. 서버 실행해서 HTTP 요청 문제 없는지 확인




