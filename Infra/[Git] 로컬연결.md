디렉토리 
git init
 git add .
 git commit --amend -m "text"
 

### 로컬 디렉토리에 git clone 후 연결 ### 
 1) git clone http://10.84.255.2:3000/oneidlab/dev-newscapture.oneidlab.kr.git
 *** clone 등 하다가 꼬였을 때 삭제 :  Remove-Item -Recurse -Force .git
 2) .git이 있는 곳으로 파일 이동
 3) git branch => main이 있으면 성공. 없으면 pull 등 해보기
 4) git checkout -b 브랜치명(-b: 브랜치 생성 + 이동)
 5) git push -u origin 브랜치명
 6) git status로 확인
 7) cp .env.example .env로 db연결하기
 8) php artisan key:generate로 키생성
 *** 만약 안 되면 composer install, composer require laravel/sanctum 등 실행
 9) php artisan serve로 서버실행 
##################################


 

### (로컬) 내 브랜치 main 브랜치로 풀 리퀘스트  ###
*** push를 하여 풀리퀘스트 요청 전 자신의 로컬의 main 브랜치를 최신화 작업을 수행 후 진행해주세요

1) 내 브랜치에 커밋할 내용 추가
git add .

2) 내 브랜치 커밋
git commit -m "커밋내용"

3) main 브랜치로 이동
git checkout main 

3) main 브랜치를 원격 브랜치와 동일하게 최신화
git pull origin main

4) 내 브랜치로 이동
git checkout ydh

5) 내 브랜치에 main 브랜치 내용을 합침
git merge main

* 충돌 파일 있는지 확인

6) 원격 ydh 브랜치에 push (최초에는 push -u 하면 원격, 로컬 연결됨)
git push origin ydh

7) PR 생성 후 merge
→ GitHub에서 ydh → main으로 PR(풀 리퀘스트) 생성
→ 관리자 또는 내가 merge 승인
→ 원격 main에 병합 완료


### merge 이후 새 브랜치로 작업 ###
1) 기존 브랜치 merge된것 확인 후 main 브랜치로 이동
git checkout main

2) main 브랜치 최신화
git pull origin main

3) 로컬 브랜치 삭제 (강제 삭제는 -D) (삭제 필수 X, 기존 브랜치에서 작업 가능)
git branch -d ydh

5) (로컬) 새 브랜치 생성
git checkout -b ydh

6) 새 브랜치에서 작업 


