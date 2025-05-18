# 웹프 게임
# 은행 업무 관리 프로그램

## members
- 한성준
- 강윤서
- 권구현
- 이어진
- 홍연일
- 정의찬
- 부은강

## environment
- 언어: 
    - `python 3.13`
- 실행 가능 환경
    - `windows 11`
    - `macOS`

## git branch
### branch / 팀 정보
- main
- teamA
    - 홍연일, 이어진, 부은강
- teamB
    - 권구현, 정의찬
- teamC
    - 한성준, 강윤서
- demo
    - ai 생성 내용

### git에 파일 올리는 방법
0. git clone
```bash
# 먼저 해당 프로젝트 폴더를 넣고 싶은 폴더로 간다.
# ex) /home/user/dev/pybank_2025 이렇게 위치하려면 /home/user/dev로 이동해서 clone을 받아야 함. (main branch)
git clone https://github.com/daybreaker42/pybank_2025.git
```

1. 각자의 branch로 바꾸고 main merge
```bash
# ex) 한성준의 경우 - branch teamC로 변경
git checkout teamC

git pull origin main
```

2. (파일 수정 후) 업로드 전 변경사항들을 commit한다.
```bash
git add .
# git commit -m "UPDATE: 계좌 입금 기능 완성; ADD: 계좌 출금 기능 추가; FIX: 계좌 송금시 보내는 사람 계좌에서 돈이 안빠지던 버그 수정 완"
git commit -m "{커밋메세지}"
```

3. **branch가 main이 아닌지 확인한 뒤** 각자의 branch에 push한다.
```bash
git push -u origin teamC
```

4. github에 가서 pull request를 만든다.
5. 이상이 없다면 main branch에 merge한다.

## 설명
- html, css, js (jquery)를 이용해 만든 벽돌 깨기 게임입니다.
- js canvas를 이용하여 만들었습니다.
- 게임 화면은 홈 화면, 게임 화면, 설정 화면, 스코어보드 화면 4개로 구성됩니다.

### 홈 화면
- 게임 시작, 설정, 게임 종료 버튼이 있습니다.
- 게임 접속 시 맨 먼저 보이는 페이지입니다.

### 설정 화면
- 배경 음악, 소리 음량 조절 등을 설정 가능합니다.

### 스코어보드 화면
- 