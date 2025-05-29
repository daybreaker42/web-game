// ========================
// DEMO: 샘플 데이터
// ========================
const DEMO_CREDITS_DATA = {
  mode: "score",
  difficulty: "hard",
  stage: 4,
  score: 5400,
  date: "2025-05-23T15:10:44",
  saved_pokemon: [2, 4, 50, 100],
};
const modeKor = { story: "스토리 모드", score: "스코어 모드" };
const difficultyKor = { easy: "쉬움", normal: "보통", hard: "어려움" };

// ========================
// STAFF 정보 배열
// ========================
const STAFFS = [
  { name: "한성준", role: "???", pokemon: 1 },
  {
    name: "김연하",
    role: "메인 로직 / 시나리오 / UI / 그래픽 및 사운드",
    pokemon: 2,
  },
  { name: "오찬영", role: "???", pokemon: 3 },
  { name: "한지훈", role: "???", pokemon: 4 },
];

// ========================
// 크레딧 데이터 구조
// ========================
const CREDITS_TEXT = [
  { type: "title", content: "~ The Lost Pokemons ~<br>Staff Roll" },
  { type: "info", label: "모드", valueKey: "mode", translate: modeKor },
  {
    type: "info",
    label: "난이도",
    valueKey: "difficulty",
    translate: difficultyKor,
  },
  { type: "info", label: "스테이지", valueKey: "stage" },
  { type: "info", label: "점수", valueKey: "score" },
  {
    type: "info",
    label: "플레이 날짜",
    valueKey: "date",
    formatter: (d) => d.replace("T", " "),
  },
  {
    type: "section",
    content: "<strong>구출한 포켓몬</strong>",
    id: "pokemon-list",
  },
  { type: "staff-list", staff: STAFFS },
  {
    type: "thanks",
    content: `
      <strong>Special Thanks</strong><br>
      Professor Soyoung Park<br>
      All our playtesters and friends<br>
      PokeAPI<br>
      The Pokémon fan community
    `,
  },
  {
    type: "copyright",
    content: `
      <div style="margin-bottom:6px;">
        본 게임은 포켓몬스터의 2차 창작물(팬게임)입니다.<br>
        포켓몬 및 관련 이미지, 사운드는 Nintendo / Creatures Inc. / GAME FREAK inc.의 저작물입니다.<br>
        Pokémon © 1995–2025 Nintendo/Creatures Inc./GAME FREAK inc.
      </div>
      <div style="font-size:0.97em;">
        This fan game is based on the Pokémon series.<br>
        Pokémon and all related images and sounds are the property of Nintendo, Creatures Inc., and GAME FREAK inc.
      </div>
    `,
  },
];

// ========================
// 크레딧 표시 진입 함수
// ========================

function showCredits(creditData) {
  creditData = creditData || DEMO_CREDITS_DATA; // 기본값 설정
  console.log("Showing credits with data:", creditData);
  hideAllFade(qsa(".screen"));
  showWithFade(elById("credits-screen"));
  createCreditsContent(creditData);
  startCreditsScroll();
  setupCreditsBtn();
  playBgm(BGM.CREDITS);
}

// ========================
// 크레딧 화면 내용 생성
// ========================
function createCreditsContent(data) {
  const scroll = elById("credits-scroll");
  let html = "";

  CREDITS_TEXT.forEach((entry) => {
    if (entry.type === "title") {
      html += `<div class="credit-title">${entry.content}</div>`;
    } else if (entry.type === "info") {
      let value = data[entry.valueKey];
      if (entry.translate) value = entry.translate[value] || value;
      if (entry.formatter) value = entry.formatter(value);
      html += `<div class="credit-section"><strong>${entry.label}</strong> ${value}</div>`;
    } else if (entry.type === "section" && entry.id === "pokemon-list") {
      html += `<div class="credit-section">${entry.content}</div>`;
      html += `<div id="pokemon-list"></div>`;
    } else if (entry.type === "staff-list") {
      html += `<div class="credit-section" style="margin-top:60px;"><strong>STAFF</strong>`;
      entry.staff.forEach((member) => {
        html += `
            <div class="staff-member" style="display:flex;align-items:center;gap:14px;margin:10px 0;">
              <img src="../assets/images/game/pokemon/${member.pokemon}.png"
                   alt="${member.pokemon}" style="width:34px;height:34px;border-radius:8px;border:1px solid #eee;box-shadow:0 2px 4px #0002;">
              <div>
                <strong>${member.name}</strong>
                <span style="color:#777;font-size:0.97em;">(${member.role})</span>
              </div>
            </div>
          `;
      });
      html += `</div>`;
    } else if (entry.type === "thanks") {
      html += `<div class="credit-section" style="margin-top:38px;">${entry.content}</div>`;
    } else if (entry.type === "copyright") {
      html += `<div class="credit-section" style="margin-top:36px; font-size:0.95em; color:#bbb;">${entry.content}</div>`;
    }
  });
  html += `<div style="height:100px;"></div>`;
  scroll.innerHTML = html;

  // 구출한 포켓몬 이미지 리스트
  const list = elById("pokemon-list");
  if (list && Array.isArray(data.saved_pokemon)) {
    data.saved_pokemon.forEach((id) => {
      const img = document.createElement("img");
      img.className = "pokemon-img";
      img.src = `../assets/images/game/pokemon/${id}.png`;
      img.alt = `포켓몬 ${id}`;
      img.style.margin = "0 6px";
      img.style.width = "42px";
      img.style.height = "42px";
      img.style.borderRadius = "8px";
      img.style.border = "1px solid #eee";
      img.style.background = "#f7f7fa";
      list.appendChild(img);
    });
  }
}

// ========================
// 크레딧 스크롤 애니메이션
// ========================
let creditsSpeed = 1.1,
  creditsFast = 3.8,
  creditsIntv = null,
  creditsFastOn = false;

function startCreditsScroll() {
  const scroll = elById("credits-scroll");
  let pos = window.innerHeight;
  scroll.style.transform = `translateY(${pos}px)`;

  if (creditsIntv) clearInterval(creditsIntv);
  creditsIntv = setInterval(() => {
    pos -= creditsFastOn ? creditsFast : creditsSpeed;
    scroll.style.transform = `translateY(${pos}px)`;
    if (pos + scroll.offsetHeight < 80) {
      clearInterval(creditsIntv);
      setTimeout(() => {
        handleReturnToTitleScreen();
      }, 900);
    }
  }, 16);
}

// ========================
// 버튼/누름 이벤트 (PC, 모바일 대응)
// ========================
function setupCreditsBtn() {
  const btn = elById("btn-skip-credits");
  const modal = elById("confirm-skip-modal");
  const yes = elById("skip-confirm-yes");
  const no = elById("skip-confirm-no");

  // 1. 스킵 버튼 클릭 시 모달 띄우기
  if (btn && modal) {
    btn.onclick = () => {
      modal.showModal();
    };
  }

  // 2. "네" 클릭 시 크레딧 화면 숨기고 타이틀(혹은 메인)로 이동
  if (yes) {
    yes.onclick = () => {
      modal.close();
      handleReturnToTitleScreen();
    };
  }

  // 3. "아니오" 클릭 시 모달 닫기
  if (no && modal) {
    no.onclick = () => {
      modal.close();
    };
  }

  // ====== (아래는 누르고 있을 때 fast 스크롤 코드 유지) ======
  const enableFast = () => {
    creditsFastOn = true;
  };
  const disableFast = () => {
    creditsFastOn = false;
  };

  document.addEventListener("mousedown", enableFast);
  document.addEventListener("mouseup", disableFast);
  document.addEventListener("mouseleave", disableFast);
  window.addEventListener("blur", disableFast);

  document.addEventListener("touchstart", enableFast, { passive: true });
  document.addEventListener("touchend", disableFast);
  document.addEventListener("touchcancel", disableFast);
}
