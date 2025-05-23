# 웹프 게임

## members
- 한성준
- 김연하
- 오찬영
- 한지훈

## environment
- 언어: 
    - `HTML5`, `JavaScript`, `CSS3`
- 실행 가능 환경
    - `windows 11`
    - `macOS`

## git branch
### branch / 팀 정보
- main

### git에 파일 올리는 방법
0. git clone
```bash
# 먼저 해당 프로젝트 폴더를 넣고 싶은 폴더로 간다.
# ex) /home/user/dev/web-game 이렇게 위치하려면 /home/user/dev로 이동해서 clone을 받아야 함. (main branch)
git clone https://github.com/daybreaker42/web-game.git
```

1. main pull
```bash
git pull origin main
```

2. (파일 수정 후) 업로드 전 변경사항들을 commit한다.
```bash
git add .
git commit -m "{커밋메세지}"
```

3. main branch에 push한다.
```bash
git push -u origin main
```

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
- 단게별 사용자들의 기록을 볼 수 있습니다.


