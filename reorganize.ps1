# study-log 디렉토리 재정리 스크립트
# 실행 방법:
#   1) 이 파일을 C:\study-log\ 안으로 복사
#   2) PowerShell에서:
#        cd C:\study-log
#        powershell -ExecutionPolicy Bypass -File .\reorganize.ps1

$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding          = [System.Text.Encoding]::UTF8

if (-not (Test-Path '.git')) {
    Write-Host '오류: study-log 루트(.git이 있는 폴더)에서 실행하세요.' -ForegroundColor Red
    exit 1
}

function GMv {
    param([string]$Src, [string]$Dst)
    Write-Host "  $Src  ->  $Dst"
    git mv -- "$Src" "$Dst"
    if ($LASTEXITCODE -ne 0) { throw "git mv 실패: $Src -> $Dst" }
}

# ============================================================
# 1) 사전 정리
# ============================================================
Write-Host '=== 1. 사전 정리 ===' -ForegroundColor Cyan
if (Test-Path '_test_dir')      { Remove-Item '_test_dir' -Recurse -Force }
if (Test-Path '.git/index.lock'){ Remove-Item '.git/index.lock' -Force -ErrorAction SilentlyContinue }

# ============================================================
# 2) 새 폴더 생성
# ============================================================
Write-Host "`n=== 2. 새 폴더 생성 ===" -ForegroundColor Cyan
$dirs = @(
    'Backend/Laravel', 'Backend/PHP', 'Frontend',
    'Infra/AWS', 'Infra/Database', 'Infra/Docker', 'Infra/Git',
    'Infra/Linux', 'Infra/Network', 'Infra/Oracle', 'Infra/Workflow',
    'Blockchain', 'Language/Japanese',
    'Log/Drafts', 'Log/Published'
)
foreach ($d in $dirs) {
    New-Item -ItemType Directory -Force -Path $d | Out-Null
}

# ============================================================
# 3) Code/ -> Backend, Frontend
# ============================================================
Write-Host "`n=== 3. Code/ -> Backend, Frontend ===" -ForegroundColor Cyan
GMv 'Code/[Laravel] BladeTemplate.md'         'Backend/Laravel/'
GMv 'Code/[Laravel] Database.md'              'Backend/Laravel/'
GMv 'Code/[Laravel] FormRequest.md'           'Backend/Laravel/'
GMv 'Code/[Laravel] Migration.md'             'Backend/Laravel/'
GMv 'Code/[php] function.md'                  'Backend/PHP/'
GMv 'Code/기본 RESTful 메서드와 컨벤션.png'      'Backend/'
GMv 'Code/[JavaScript] addEventListener.md'   'Frontend/'
GMv 'Code/[JavaScript] fetch.md'              'Frontend/'
if (Test-Path 'Code') { Remove-Item 'Code' -Force }

# ============================================================
# 4) Infra 세분화
# ============================================================
Write-Host "`n=== 4. Infra 세분화 ===" -ForegroundColor Cyan
GMv 'Infra/[AWS] basic.md'                       'Infra/AWS/'
GMv 'Infra/[Docker] 기초명령어.md'                 'Infra/Docker/'
GMv 'Infra/[Git] command.md'                     'Infra/Git/'
GMv 'Infra/[Git] 로컬연결.md'                      'Infra/Git/'
GMv 'Infra/[Linux] 기본 구조와 스트림.md'           'Infra/Linux/'
GMv 'Infra/[Linux] 마스터 2급 2차 요약.md'          'Infra/Linux/'
GMv 'Infra/[Network] basic.md'                   'Infra/Network/'
GMv 'Infra/[Oracle] 테이블 정보 및 명세서 조회.md'   'Infra/Oracle/'
GMv 'Infra/[workflow] node.md'                   'Infra/Workflow/'
GMv 'Infra/데이터 형식 검사.md'                     'Infra/Database/'

# ============================================================
# 5) Blockchain 분리
# ============================================================
Write-Host "`n=== 5. Blockchain 분리 ===" -ForegroundColor Cyan
GMv 'Infra/[BlockChain] 블록체인.md'                          'Blockchain/'
GMv 'Infra/[BlockChain] 블록체인_Besu-서버설치.md'              'Blockchain/'
GMv 'Infra/[BlockChain] 블록체인_테스트-Hardhat배포+Java.md'    'Blockchain/'
GMv 'Infra/[BlockChain] 블록체인_테스트-Remix배포+NodeJS.md'    'Blockchain/'
GMv 'Infra/패브릭vs이더리움.md'                                'Blockchain/'

# ============================================================
# 6) studyspace -> Projects + 오타 수정
# ============================================================
Write-Host "`n=== 6. studyspace -> Projects + 오타 수정 ===" -ForegroundColor Cyan
GMv 'studyspace' 'Projects'
GMv 'Projects/linux-mastery-project'                      'Projects/linux-mastery'
GMv 'Projects/linux-mastery/READMEmd'                     'Projects/linux-mastery/README.md'
GMv 'Projects/linux-mastery/Level-1_CLI/exercies'         'Projects/linux-mastery/Level-1_CLI/exercises'
GMv 'Projects/linux-mastery/Level-2_Server/exercies'      'Projects/linux-mastery/Level-2_Server/exercises'
GMv 'Projects/linux-mastery/Level-3_Automation/exercies'  'Projects/linux-mastery/Level-3_Automation/exercises'
GMv 'Infra/프로젝트_구조도.png' 'Projects/'

# ============================================================
# 7) 한글 폴더명 -> 영문
# ============================================================
Write-Host "`n=== 7. 한글 폴더명 -> 영문 ===" -ForegroundColor Cyan
GMv '기술질문' 'Interview'
GMv '알고리즘' 'Algorithm'
GMv '양식'    'Templates'

# ============================================================
# 8) にほん -> Language/Japanese
# ============================================================
Write-Host "`n=== 8. にほん -> Language/Japanese ===" -ForegroundColor Cyan
GMv 'にほん/N3べんきよう.md'              'Language/Japanese/'
GMv 'にほん/にほんご.md'                  'Language/Japanese/'
GMv 'にほん/漢字.md'                      'Language/Japanese/'
GMv 'にほん/상태 표현과 행동 표현 정리.md'  'Language/Japanese/'
GMv 'にほん/워홀이유서.md'                 'Language/Japanese/'
if (Test-Path 'にほん') { Remove-Item 'にほん' -Force }

# ============================================================
# 9) Log 분리 (Drafts / Published)
# ============================================================
Write-Host "`n=== 9. Log 분리 (Drafts / Published) ===" -ForegroundColor Cyan
$drafts = @(
    '# 네트워크 기초.md',
    '# 배포자동화.md',
    '# 암호화 & 복호화 알고리즘.md'
)
foreach ($f in $drafts) { GMv "Log/$f" 'Log/Drafts/' }

$published = @(
    'Cloud.md',
    'Java-Stream.md',
    'Java-에러와예외정리.md',
    'Java-예외처리방법.md',
    'Java.md',
    'Lambda-Expression.md',
    'Socket.md',
    '[Flutter] 스마트워치 오디오 데이터 가공 및 서버 전송 파이프라인.md',
    '[Flutter] 애니메이션 SVG 적용과 앱 구조 개선하기.md',
    'http 통신 흐름.md',
    'java-services.md',
    'programming-limit.md',
    'try-with-resources사용법.md',
    '가비지 컬렉터 동작원리.md',
    '블록체인.md',
    '상속과 의존성.md',
    '소켓과 스트림.md',
    '소프트웨어 설계와 구조.md',
    '오픈클로.md',
    '자바 기본동작원리.md',
    '재귀함수.md',
    '접근제어자와 싱글톤 디자인 패턴.md',
    '클로드 자동화.md'
)
foreach ($f in $published) { GMv "Log/$f" 'Log/Published/' }

# ============================================================
# 10) README.md 갱신 (UTF-8 BOM)
# ============================================================
Write-Host "`n=== 10. README.md 갱신 ===" -ForegroundColor Cyan
$readme = @'
# study-log

공부한 내용을 주제별로 정리하는 저장소

## 폴더 구조

```text
study-log/
├── Backend/        # 백엔드 (Laravel, PHP 등)
├── Frontend/       # 프론트엔드 (JavaScript 등)
├── Infra/          # 인프라
│   ├── AWS/
│   ├── Database/
│   ├── Docker/
│   ├── Git/
│   ├── Linux/
│   ├── Network/
│   ├── Oracle/
│   └── Workflow/
├── Blockchain/     # 블록체인 학습
├── Language/       # 외국어 학습
│   └── Japanese/
├── Interview/      # 기술 면접 대비
├── Algorithm/      # 알고리즘 문제 풀이
├── Templates/      # 템플릿 및 문서 양식
├── Projects/       # 작업/프로젝트 (linux-mastery 등)
└── Log/            # 블로그 글
    ├── Drafts/     # 작성 중 (# 로 시작)
    └── Published/  # 작성 완료
```
'@
$utf8Bom = New-Object System.Text.UTF8Encoding($true)
[System.IO.File]::WriteAllText((Join-Path (Get-Location) 'README.md'), $readme, $utf8Bom)

# ============================================================
# 완료
# ============================================================
Write-Host "`n=== 완료 ===" -ForegroundColor Green
Write-Host '아래는 git status 결과입니다:' -ForegroundColor Yellow
git status

Write-Host "`n검토 후 다음 명령으로 커밋하세요:" -ForegroundColor Yellow
Write-Host '  git add -A'
Write-Host '  git commit -m "chore: 디렉토리 구조 재정리"'
