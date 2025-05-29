class Brick {
  constructor(
    x,
    y,
    width,
    height,
    pokeIndex = null,
    pokeType = null,
    isTarget = false,
    imagePath = null,
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.status = 1;
    this.isTarget = isTarget;
    this.pokeIndex = pokeIndex;
    this.pokeType = pokeType;

    this.image = new Image();
    this.imageLoaded = false;

    if (imagePath) {
      this.image.src = imagePath;
      this.image.onload = () => (this.imageLoaded = true);
      this.image.onerror = () => {
        console.warn(`이미지 로딩 실패: ${this.image.src}`);
        this.image = null;
      };
    }
  }

  draw(ctx) {
    try {


    if (this.status !== 1) return;

    // 이미지
    if (this.image && this.imageLoaded) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    } else {
      ctx.fillStyle = "#ccc";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // 테두리
    // ctx.strokeStyle = this.isTarget ? "#FFD700" : "#ffffff";
    // ctx.lineWidth = 3;
    // ctx.strokeRect(this.x, this.y, this.width, this.height);
    ctx.globalAlpha = 0.8;
    const frameImg = new Image();
      const isLegend = this.pokeType === 5; // 전설의 포켓몬인지 여부
      frameImg.src = isLegend ?
      '../assets/images/game/object/block_legend.png' :
      '../assets/images/game/object/block_normal.png';
    ctx.drawImage(frameImg, this.x, this.y, this.width, this.height);

    // 느낌표 표시
    ctx.globalAlpha = 1.0;
    if (this.isTarget) {
      const exMark = new Image();
      exMark.src = "../assets/images/icons/exmark.png";
      ctx.drawImage(exMark, this.x + this.width - 35, this.y + 5, 30, 30);
    }
    } catch (e) {
      console.error("브릭 그리기 중 오류 발생:", e);
    }
  }

  isBrickHit(ball) {
    let closestX = Math.max(this.x, Math.min(ball.x, this.x + this.width));
    let closestY = Math.max(this.y, Math.min(ball.y, this.y + this.height));
    let dx = ball.x - closestX;
    let dy = ball.y - closestY;
    return dx * dx + dy * dy <= ball.radius * ball.radius;
  }
}
