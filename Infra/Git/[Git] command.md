COMMAND
====

# add, commit, push, pull 관련

### LOCAL 깃 저장소 생성 (.git 폴더 생성)
git init

### 현재 상태 확인
git status

### 모든 커밋 조회
git log

### git init 취소 (.git 폴더 삭제, 로컬 저장소 지정 해제)
rm -rf .git

### git pull 되돌리기
git reset --hard ORIG_HEAD

### git add 취소
git reset HEAD [파일명] git reset

### git commit 취소
git reset --hard @^

### Working Directory -> Staging Area 로 올리기
git add [디렉토리] 
git add .

### Staging Area -> repository(.git)로 올리기
git commit -m "commit message"

/* add와 commit을 한번에 하고 싶다면 아래 명령어 사용 git commit -am "commit message" 



# 연결 관련 명령어 

### 원격 저장소 연결
git remote add origin [원격 저장소 주소]

### 현재 연결된 원격 저장소 확인
git remote -v

### git remote 취소 (원격 저장소 연결 해제)
git remote rm origin

### 현재 연결된 원격 저장소 삭제
git remote remove [origin]

### 연결중이던 원격 저장소 이름이 변경되었을 때 재설정
git remote set-url origin [원격 저장소 주소]

/* remote로 제어



# Branch 관련 명령어

### 모든 브랜치 확인
git branch -v(-a)
/* -a 가 더 시각적으로 보기 편함

### 브랜치 명 변경
git branch -M [브랜치 이름(main)] git branch -m [현재 브랜치명] [변경할 브랜치명]

### HEAD가 가리키는 브랜치 바꾸기 (브랜치 이동)
git checkout [브랜치명]

/* checkout 많이 사용


###### 참고
https://blog.naver.com/codeitofficial/223419594858