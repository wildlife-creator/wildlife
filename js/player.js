class Player {
  // 体力の定数
  static MAX_HEALTH = 100;
  // 空腹度の定数
  static MAX_HUNGER = 100;
  // 空腹度の減少速度（1フレームあたり）
  // ゲーム内1時間 = 現実1分 = 60秒 = 約3600フレーム(60fps)で5減少
  static HUNGER_DECREASE_PER_FRAME = 5 / 3600;
  // 走行時の空腹度減少倍率
  static HUNGER_RUN_MULTIPLIER = 1.5;
  // 空腹ゼロ時の体力減少速度（1フレームあたり）
  // 1秒 = 60フレームで1減少
  static STARVE_DAMAGE_PER_FRAME = 1 / 60;

  constructor(x, y, gameMap, resourceManager) {
    this.x = x;
    this.y = y;
    this.size = 32;
    this.targetX = x;
    this.targetY = y;
    this.walkSpeed = 2;
    this.runSpeed = 5;
    this.speed = this.walkSpeed;
    this.running = false;
    this.gameMap = gameMap;
    this.resourceManager = resourceManager;

    // 体力
    this.maxHealth = Player.MAX_HEALTH;
    this.health = Player.MAX_HEALTH;
    // 空腹度
    this.maxHunger = Player.MAX_HUNGER;
    this.hunger = Player.MAX_HUNGER;
  }

  setTarget(x, y, running) {
    this.targetX = x - this.size / 2;
    this.targetY = y - this.size / 2;
    this.running = running;
    this.speed = running ? this.runSpeed : this.walkSpeed;
  }

  update() {
    // 空腹度を時間経過で減少させる
    this.updateHunger();

    // 空腹ゼロ時は移動できない
    if (this.hunger <= 0) {
      this.targetX = this.x;
      this.targetY = this.y;
      return;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.running = false;
      return;
    }

    const moveX = (dx / dist) * this.speed;
    const moveY = (dy / dist) * this.speed;
    const newX = this.x + moveX;
    const newY = this.y + moveY;

    // 衝突判定: X軸とY軸を個別にチェック（地形＋資源）
    const isBlockedAt = (x, y, size) => {
      if (this.gameMap && this.gameMap.isBlocked(x, y, size)) return true;
      if (this.resourceManager && this.resourceManager.isBlocked(x, y, size)) return true;
      return false;
    };

    if (isBlockedAt(newX, newY, this.size)) {
      // XY両方ブロックされたら、各軸を個別に試す
      const blockedX = isBlockedAt(newX, this.y, this.size);
      const blockedY = isBlockedAt(this.x, newY, this.size);

      if (!blockedX) {
        this.x = newX;
      } else if (!blockedY) {
        this.y = newY;
      }
      // 両方ブロックなら移動しない
      return;
    }

    this.x = newX;
    this.y = newY;
  }

  // 空腹度の更新処理
  updateHunger() {
    // 走行中は空腹度の減りが早い
    const multiplier = this.running ? Player.HUNGER_RUN_MULTIPLIER : 1;
    this.hunger -= Player.HUNGER_DECREASE_PER_FRAME * multiplier;
    this.hunger = Math.max(0, this.hunger);

    // 空腹度ゼロ時は体力が徐々に減少する
    if (this.hunger <= 0) {
      this.health -= Player.STARVE_DAMAGE_PER_FRAME;
      this.health = Math.max(0, this.health);
    }
  }

  draw(ctx) {
    const s = this.size;
    const x = this.x;
    const y = this.y;

    // 体（走行中はオレンジ、通常は緑）
    ctx.fillStyle = this.running ? '#e67e22' : '#2ecc71';
    ctx.fillRect(x + 8, y + 8, 16, 20);

    // 頭（肌色）
    ctx.fillStyle = '#f5cfa0';
    ctx.fillRect(x + 8, y + 2, 16, 12);

    // 目（黒）
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 11, y + 6, 3, 3);
    ctx.fillRect(x + 18, y + 6, 3, 3);

    // 目のハイライト（白）
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 12, y + 6, 1, 1);
    ctx.fillRect(x + 19, y + 6, 1, 1);

    // 髪（茶色）
    ctx.fillStyle = '#5a3825';
    ctx.fillRect(x + 7, y + 0, 18, 5);
    ctx.fillRect(x + 7, y + 2, 3, 6);
    ctx.fillRect(x + 22, y + 2, 3, 6);

    // 足（紺）
    ctx.fillStyle = '#2c3e6b';
    ctx.fillRect(x + 8, y + 24, 7, 8);
    ctx.fillRect(x + 17, y + 24, 7, 8);
  }
}
