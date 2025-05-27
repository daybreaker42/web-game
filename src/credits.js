// credits.js

SAMPLE_CREDITS_DATA = {
  mode: "score",
  difficulty: "hard",
  stage: 4,
  score: 5400,
  date: "2025-05-23T15:10:44",
  saved_pokemon: [2, 4, 50, 100],
};

function showDemoCredits(creditData) {
  console.log("showDemoCredits");
  window.showCredits(creditData || SAMPLE_CREDITS_DATA);
}

// 실제론 게임 로직에서 엔딩 직전 이 데이터를 동적으로 전달!
window.showCredits = function (creditData) {
  // 해당 섹션 show, 나머지 hide 처리 (게임에 맞게...)
  document
    .querySelectorAll(".screen")
    .forEach((e) => e.classList.add("hidden"));
  document.getElementById("credits-screen").classList.remove("hidden");
  createCreditsContent(creditData);
  startCreditsScroll();
  setupCreditsBtn();
};

const modeKor = { story: "스토리 모드", score: "스코어 모드" };
const difficultyKor = { easy: "쉬움", normal: "보통", hard: "어려움" };

function createCreditsContent(data) {
  const scroll = document.getElementById("credits-scroll");
  scroll.innerHTML = `
      <div class="credit-title">~ The Lost Pokémons ~<br>Staff Roll</div>
      <div class="credit-section">
        <strong>모드</strong> ${modeKor[data.mode] || data.mode}<br>
        <strong>난이도</strong> ${difficultyKor[data.difficulty] || data.difficulty}
      </div>
      <div class="credit-section">
        <strong>스테이지</strong> ${data.stage}
      </div>
      <div class="credit-section">
        <strong>점수</strong> ${data.score}
      </div>
      <div class="credit-section">
        <strong>플레이 날짜</strong> ${data.date.replace("T", " ")}
      </div>
      <div class="credit-section"><strong>구출한 포켓몬</strong></div>
      <div id="pokemon-list"></div>
      <div class="credit-section" style="margin-top:60px;">
        Thank you for playing!<br>기획/개발: 한성준 김연하 오찬영 한지훈
      </div>
      <div style="height:100px;"></div>
    `;
  // 포켓몬 이미지
  const list = document.getElementById("pokemon-list");
  data.saved_pokemon.forEach((id) => {
    const img = document.createElement("img");
    img.className = "pokemon-img";
    img.src = `/assets/images/game/pokemon/${id}.png`;
    img.alt = `포켓몬 ${id}`;
    list.appendChild(img);
  });
}

let creditsSpeed = 1.1,
  creditsFast = 3.8,
  creditsIntv = null,
  creditsFastOn = false;
function startCreditsScroll() {
  const scroll = document.getElementById("credits-scroll");
  let pos = window.innerHeight;
  scroll.style.transform = `translateY(${pos}px)`;

  if (creditsIntv) clearInterval(creditsIntv);
  creditsIntv = setInterval(() => {
    pos -= creditsFastOn ? creditsFast : creditsSpeed;
    scroll.style.transform = `translateY(${pos}px)`;
    if (pos + scroll.offsetHeight < 80) {
      clearInterval(creditsIntv);
      setTimeout(() => {
        // 크레딧 종료 후 메인화면 복귀 등 처리 (게임에 맞게!)
        document.getElementById("credits-screen").classList.add("hidden");
        // document.getElementById('main-menu').classList.remove('hidden');
      }, 900);
    }
  }, 16);
}

function setupCreditsBtn() {
  const btn = document.getElementById("btn-skip-credits");
  btn.onclick = () => {
    creditsFastOn = true;
    btn.textContent = "FAST!";
    setTimeout(() => {
      btn.textContent = "스킵";
      creditsFastOn = false;
    }, 1300);
  };
  document.getElementById("credits-root").onclick = () => {
    creditsFastOn = true;
    setTimeout(() => (creditsFastOn = false), 800);
  };
}
