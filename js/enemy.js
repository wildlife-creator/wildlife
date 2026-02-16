// 敵の種類定義
const ENEMY_TYPES = {
  COW:      { name: 'ウシ',       period: 'day',   speed: 0.3, size: 32, behavior: 'wander', hp: 20, attack: 0, drops: { itemId: 'BEEF',         min: 2, max: 3 } },
  CHICKEN:  { name: 'ニワトリ',   period: 'day',   speed: 0.5, size: 20, behavior: 'wander', hp: 5,  attack: 0, drops: { itemId: 'CHICKEN_MEAT', min: 1, max: 2 } },
  PIG:      { name: 'ブタ',       period: 'day',   speed: 0.3, size: 28, behavior: 'wander', hp: 15, attack: 0, drops: { itemId: 'PORK',         min: 2, max: 3 } },
  ZOMBIE:   { name: 'ゾンビ',     period: 'night', speed: 0.5, size: 32, behavior: 'chase',  hp: 30, attack: 8, drops: null },
  SKELETON: { name: 'スケルトン', period: 'night', speed: 0.6, size: 32, behavior: 'chase',  hp: 20, attack: 12, drops: null },
};

// 武器のダメージ
const WEAPON_DAMAGE = {
  WOOD_SWORD: 8,
  STONE_SWORD: 12,
  IRON_SWORD: 18,
};
const BARE_HAND_DAMAGE = 3;

// 攻撃関連の定数
const PLAYER_ATTACK_RANGE = 2 * TILE_SIZE;    // プレイヤー攻撃範囲（2タイル）
const PLAYER_ATTACK_COOLDOWN = 60;             // 攻撃間隔（1秒）
const MONSTER_ATTACK_RANGE = 1 * TILE_SIZE;    // モンスター攻撃範囲（1タイル）
const MONSTER_ATTACK_COOLDOWN = 120;           // モンスター攻撃間隔（2秒）
const DYING_DURATION = 30;                     // 撃破演出フレーム数
const DAMAGE_NUMBER_DURATION = 60;             // ダメージ数表示フレーム数

// ドロップアイテム関連
const DROP_LIFETIME = 1800;                    // ドロップの存在時間（30秒 = 1800フレーム）
const DROP_PICKUP_RANGE = 1 * TILE_SIZE;       // 拾える距離（1タイル）
const DROP_ICON_SIZE = 16;                     // ドロップアイコンサイズ

const DAY_ENEMY_LIST = ['COW', 'CHICKEN', 'PIG'];
const NIGHT_ENEMY_LIST = ['ZOMBIE', 'SKELETON'];

// 出現制限
const MAX_DAY_ENEMIES = 5;
const MAX_NIGHT_ENEMIES = 6;

// スポーン距離（タイル単位）
const SPAWN_MIN_DIST = 10;
const SPAWN_MAX_DIST = 16;
const DESPAWN_DIST = 20;
const HOUSE_SAFE_DIST = 5;

// スポーン間隔（フレーム）
const SPAWN_INTERVAL = 120;

// 敵クラス
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.def = ENEMY_TYPES[type];
    this.dirX = 0;
    this.dirY = 0;
    this.moveTimer = 0;
    this.pauseTimer = 0;
    // 戦闘関連
    this.hp = this.def.hp;
    this.maxHp = this.def.hp;
    this.attackCooldown = 0;
    this.dying = false;
    this.dyingTimer = 0;
  }

  update(playerX, playerY, gameMap) {
    // 撃破演出中は動かない
    if (this.dying) {
      this.dyingTimer++;
      return;
    }

    // 攻撃クールダウン更新
    if (this.attackCooldown > 0) {
      this.attackCooldown--;
    }

    if (this.def.behavior === 'wander') {
      this.updateWander(gameMap);
    } else if (this.def.behavior === 'chase') {
      this.updateChase(playerX, playerY, gameMap);
    }
  }

  // ダメージを受ける。HPが0以下になったらtrueを返す
  takeDamage(damage) {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.hp = 0;
      this.dying = true;
      this.dyingTimer = 0;
      return true;
    }
    return false;
  }

  // ランダム歩き回り（動物用）
  updateWander(gameMap) {
    if (this.pauseTimer > 0) {
      this.pauseTimer--;
      return;
    }

    if (this.moveTimer <= 0) {
      // 新しいランダム方向を決定
      const angle = Math.random() * Math.PI * 2;
      this.dirX = Math.cos(angle);
      this.dirY = Math.sin(angle);
      this.moveTimer = 60 + Math.floor(Math.random() * 120);
    }

    this.moveTimer--;
    const newX = this.x + this.dirX * this.def.speed;
    const newY = this.y + this.dirY * this.def.speed;

    if (!gameMap.isBlocked(newX, newY, this.def.size)) {
      this.x = newX;
      this.y = newY;
    } else {
      // 壁にぶつかったら止まって方向転換
      this.moveTimer = 0;
      this.pauseTimer = 30 + Math.floor(Math.random() * 60);
    }

    if (this.moveTimer <= 0) {
      this.pauseTimer = 60 + Math.floor(Math.random() * 120);
    }
  }

  // プレイヤーを追跡（モンスター用）
  updateChase(playerX, playerY, gameMap) {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      this.dirX = dx / dist;
      this.dirY = dy / dist;
    }

    const newX = this.x + this.dirX * this.def.speed;
    const newY = this.y + this.dirY * this.def.speed;

    // X軸とY軸を個別に試す
    if (!gameMap.isBlocked(newX, newY, this.def.size)) {
      this.x = newX;
      this.y = newY;
    } else {
      const blockedX = gameMap.isBlocked(newX, this.y, this.def.size);
      const blockedY = gameMap.isBlocked(this.x, newY, this.def.size);
      if (!blockedX) {
        this.x = newX;
      } else if (!blockedY) {
        this.y = newY;
      }
    }
  }
}

// 敵マネージャー
class EnemyManager {
  constructor() {
    this.enemies = [];
    this.spawnTimer = 0;
    this.currentPeriod = 'day'; // 'day' or 'night'
    this.damageNumbers = [];     // 浮遊ダメージ数表示
    this.playerAttackCooldown = 0;
    this.droppedItems = [];      // 地面のドロップアイテム
  }

  // 昼夜判定（6:00〜19:00が昼）
  isNight(hour) {
    return hour >= 19 || hour < 6;
  }

  // 昼夜切り替えチェック
  checkPeriodChange(hour) {
    const newPeriod = this.isNight(hour) ? 'night' : 'day';
    if (newPeriod !== this.currentPeriod) {
      // 全敵を消す
      this.enemies = [];
      this.currentPeriod = newPeriod;
    }
  }

  // スポーン位置を生成（プレイヤー周囲の画面外）
  getSpawnPosition(playerX, playerY, gameMap) {
    for (let attempt = 0; attempt < 20; attempt++) {
      // プレイヤーからランダムな方向・距離でスポーン
      const angle = Math.random() * Math.PI * 2;
      const dist = SPAWN_MIN_DIST + Math.random() * (SPAWN_MAX_DIST - SPAWN_MIN_DIST);
      const spawnX = playerX + Math.cos(angle) * dist * TILE_SIZE;
      const spawnY = playerY + Math.sin(angle) * dist * TILE_SIZE;

      // マップ範囲内チェック
      const col = Math.floor(spawnX / TILE_SIZE);
      const row = Math.floor(spawnY / TILE_SIZE);
      if (col < 1 || col >= gameMap.cols - 1 || row < 1 || row >= gameMap.rows - 1) {
        continue;
      }

      // 通行不可タイルチェック
      if (gameMap.isBlocked(spawnX, spawnY, TILE_SIZE)) {
        continue;
      }

      // 家の近く（5タイル以内）チェック
      const houseCenterCol = gameMap.houseCol + 2.5;
      const houseCenterRow = gameMap.houseRow + 2.5;
      const houseDistCol = Math.abs(col - houseCenterCol);
      const houseDistRow = Math.abs(row - houseCenterRow);
      if (houseDistCol <= HOUSE_SAFE_DIST && houseDistRow <= HOUSE_SAFE_DIST) {
        continue;
      }

      return { x: spawnX, y: spawnY };
    }
    return null;
  }

  // 敵をスポーンさせる
  trySpawn(playerX, playerY, gameMap) {
    const maxCount = this.currentPeriod === 'day' ? MAX_DAY_ENEMIES : MAX_NIGHT_ENEMIES;
    if (this.enemies.length >= maxCount) return;

    const pos = this.getSpawnPosition(playerX, playerY, gameMap);
    if (!pos) return;

    // ランダムに敵の種類を選択
    const typeList = this.currentPeriod === 'day' ? DAY_ENEMY_LIST : NIGHT_ENEMY_LIST;
    const type = typeList[Math.floor(Math.random() * typeList.length)];

    this.enemies.push(new Enemy(pos.x, pos.y, type));
  }

  // 遠すぎる敵を消す
  despawnFarEnemies(playerX, playerY) {
    const maxDist = DESPAWN_DIST * TILE_SIZE;
    this.enemies = this.enemies.filter(enemy => {
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      return Math.sqrt(dx * dx + dy * dy) < maxDist;
    });
  }

  // 指定ワールド座標にいる敵を返す（クリック判定用）
  getEnemyAt(worldX, worldY) {
    for (const enemy of this.enemies) {
      if (enemy.dying) continue;
      if (
        worldX >= enemy.x && worldX <= enemy.x + enemy.def.size &&
        worldY >= enemy.y && worldY <= enemy.y + enemy.def.size
      ) {
        return enemy;
      }
    }
    return null;
  }

  // プレイヤーが敵を攻撃する。成功したらダメージ量を返す
  playerAttack(enemy, equippedItem) {
    if (this.playerAttackCooldown > 0) return 0;

    // ダメージ計算
    let damage = BARE_HAND_DAMAGE;
    let usedSword = false;
    if (equippedItem && equippedItem.toolType === 'sword') {
      damage = WEAPON_DAMAGE[equippedItem.id] || BARE_HAND_DAMAGE;
      usedSword = true;
    }

    // ダメージを与える
    enemy.takeDamage(damage);

    // ダメージ数表示を追加
    this.addDamageNumber(
      enemy.x + enemy.def.size / 2,
      enemy.y,
      `-${damage}`,
      '#fff'
    );

    // クールダウン設定
    this.playerAttackCooldown = PLAYER_ATTACK_COOLDOWN;

    return usedSword ? damage : -damage; // 正:剣使用, 負:素手
  }

  // モンスターがプレイヤーを攻撃する判定
  checkMonsterAttacks(player) {
    let totalDamage = 0;
    const playerCX = player.x + player.size / 2;
    const playerCY = player.y + player.size / 2;

    for (const enemy of this.enemies) {
      if (enemy.dying || enemy.def.attack <= 0 || enemy.attackCooldown > 0) continue;

      const enemyCX = enemy.x + enemy.def.size / 2;
      const enemyCY = enemy.y + enemy.def.size / 2;
      const dx = playerCX - enemyCX;
      const dy = playerCY - enemyCY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= MONSTER_ATTACK_RANGE) {
        totalDamage += enemy.def.attack;
        enemy.attackCooldown = MONSTER_ATTACK_COOLDOWN;

        // プレイヤー上にダメージ数表示
        this.addDamageNumber(
          playerCX,
          player.y,
          `-${enemy.def.attack}`,
          '#e74c3c'
        );
      }
    }
    return totalDamage;
  }

  // ダメージ数表示を追加
  addDamageNumber(x, y, text, color) {
    this.damageNumbers.push({
      x, y, text, color,
      timer: DAMAGE_NUMBER_DURATION,
    });
  }

  // ダメージ数表示の更新
  updateDamageNumbers() {
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      this.damageNumbers[i].timer--;
      this.damageNumbers[i].y -= 0.5;
      if (this.damageNumbers[i].timer <= 0) {
        this.damageNumbers.splice(i, 1);
      }
    }
  }

  // 敵撃破時にドロップアイテムを生成
  spawnDrop(enemy) {
    const drops = enemy.def.drops;
    if (!drops) return;

    const count = drops.min + Math.floor(Math.random() * (drops.max - drops.min + 1));
    this.droppedItems.push({
      x: enemy.x + enemy.def.size / 2,
      y: enemy.y + enemy.def.size / 2,
      itemId: drops.itemId,
      count: count,
      timer: DROP_LIFETIME,
      bobPhase: Math.random() * Math.PI * 2,
    });
  }

  // ドロップアイテムの更新
  updateDroppedItems() {
    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      this.droppedItems[i].timer--;
      this.droppedItems[i].bobPhase += 0.05;
      if (this.droppedItems[i].timer <= 0) {
        this.droppedItems.splice(i, 1);
      }
    }
  }

  // プレイヤーとの距離でドロップアイテムを自動拾い。拾ったアイテムリストを返す
  checkPickups(player, inventory) {
    const picked = [];
    const playerCX = player.x + player.size / 2;
    const playerCY = player.y + player.size / 2;

    for (let i = this.droppedItems.length - 1; i >= 0; i--) {
      const drop = this.droppedItems[i];
      const dx = playerCX - drop.x;
      const dy = playerCY - drop.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist <= DROP_PICKUP_RANGE) {
        const added = inventory.addItem(drop.itemId, drop.count);
        if (added > 0) {
          picked.push({ itemId: drop.itemId, count: added });
          this.droppedItems.splice(i, 1);
        }
      }
    }
    return picked;
  }

  // ドロップアイテムの描画
  drawDroppedItems(ctx) {
    for (const drop of this.droppedItems) {
      const itemDef = ITEMS[drop.itemId];
      if (!itemDef) continue;

      // 浮遊アニメーション
      const bobY = Math.sin(drop.bobPhase) * 3;
      const drawX = drop.x - DROP_ICON_SIZE / 2;
      const drawY = drop.y - DROP_ICON_SIZE / 2 + bobY;

      // 影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(drop.x, drop.y + DROP_ICON_SIZE / 2 + 2, 6, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // アイテムアイコン（小さな丸）
      ctx.fillStyle = itemDef.color;
      ctx.beginPath();
      ctx.arc(drawX + DROP_ICON_SIZE / 2, drawY + DROP_ICON_SIZE / 2, DROP_ICON_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();

      // ハイライト
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.arc(drawX + DROP_ICON_SIZE / 2 - 2, drawY + DROP_ICON_SIZE / 2 - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // 個数（2個以上）
      if (drop.count > 1) {
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`×${drop.count}`, drop.x, drop.y + DROP_ICON_SIZE + bobY + 2);
      }
    }
  }

  // 更新処理
  update(player, timeManager, gameMap) {
    const hour = timeManager.getHour();
    this.checkPeriodChange(hour);

    // プレイヤー攻撃クールダウン
    if (this.playerAttackCooldown > 0) {
      this.playerAttackCooldown--;
    }

    // スポーンタイマー
    this.spawnTimer++;
    if (this.spawnTimer >= SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this.trySpawn(player.x, player.y, gameMap);
    }

    // 各敵の行動更新
    for (const enemy of this.enemies) {
      enemy.update(player.x, player.y, gameMap);
    }

    // 撃破演出が終わった敵を除去（ドロップアイテムを生成）
    for (const enemy of this.enemies) {
      if (enemy.dying && enemy.dyingTimer >= DYING_DURATION && !enemy.dropped) {
        enemy.dropped = true;
        this.spawnDrop(enemy);
      }
    }
    this.enemies = this.enemies.filter(
      enemy => !(enemy.dying && enemy.dyingTimer >= DYING_DURATION)
    );

    // ドロップアイテムの更新（タイマー減少）
    this.updateDroppedItems();

    // ダメージ数表示の更新
    this.updateDamageNumbers();

    // 遠い敵を消す
    this.despawnFarEnemies(player.x, player.y);
  }

  // 全敵の描画
  draw(ctx) {
    for (const enemy of this.enemies) {
      // 撃破演出中は点滅させる（3フレームごとに表示/非表示）
      if (enemy.dying && Math.floor(enemy.dyingTimer / 3) % 2 === 0) {
        continue;
      }
      this.drawEnemy(ctx, enemy);
      // HPバー（ダメージを受けている敵のみ）
      if (enemy.hp < enemy.maxHp && !enemy.dying) {
        this.drawEnemyHpBar(ctx, enemy);
      }
    }
    // ドロップアイテム
    this.drawDroppedItems(ctx);
    // ダメージ数表示
    this.drawDamageNumbers(ctx);
  }

  // 敵のHPバー描画
  drawEnemyHpBar(ctx, enemy) {
    const barW = enemy.def.size;
    const barH = 4;
    const barX = enemy.x;
    const barY = enemy.y - 6;
    const ratio = enemy.hp / enemy.maxHp;

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = ratio > 0.5 ? '#2ecc71' : ratio > 0.2 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(barX, barY, barW * ratio, barH);
  }

  // ダメージ数表示の描画
  drawDamageNumbers(ctx) {
    for (const dn of this.damageNumbers) {
      const alpha = dn.timer / DAMAGE_NUMBER_DURATION;
      ctx.fillStyle = dn.color === '#e74c3c'
        ? `rgba(231, 76, 60, ${alpha})`
        : `rgba(255, 255, 255, ${alpha})`;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(dn.text, dn.x, dn.y);
    }
  }

  // 敵の描画（種類別）
  drawEnemy(ctx, enemy) {
    switch (enemy.type) {
      case 'COW':
        this.drawCow(ctx, enemy.x, enemy.y);
        break;
      case 'CHICKEN':
        this.drawChicken(ctx, enemy.x, enemy.y);
        break;
      case 'PIG':
        this.drawPig(ctx, enemy.x, enemy.y);
        break;
      case 'ZOMBIE':
        this.drawZombie(ctx, enemy.x, enemy.y);
        break;
      case 'SKELETON':
        this.drawSkeleton(ctx, enemy.x, enemy.y);
        break;
    }
  }

  // ウシの描画（茶色の四角＋角）
  drawCow(ctx, x, y) {
    // 胴体（茶色）
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 4, y + 10, 24, 14);

    // 白い模様
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + 8, y + 12, 10, 8);

    // 頭
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 20, y + 6, 12, 12);

    // 角
    ctx.fillStyle = '#d4a830';
    ctx.fillRect(x + 22, y + 2, 3, 6);
    ctx.fillRect(x + 27, y + 2, 3, 6);

    // 目
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 26, y + 9, 2, 2);

    // 鼻（ピンク）
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(x + 28, y + 13, 4, 3);

    // 足
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(x + 6, y + 24, 4, 8);
    ctx.fillRect(x + 14, y + 24, 4, 8);
    ctx.fillRect(x + 22, y + 24, 4, 8);
  }

  // ニワトリの描画（白の小さい四角＋くちばし）
  drawChicken(ctx, x, y) {
    // 胴体（白）
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(x + 2, y + 6, 12, 8);

    // 頭
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(x + 10, y + 2, 8, 8);

    // トサカ（赤）
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x + 12, y + 0, 4, 4);

    // くちばし（オレンジ）
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(x + 16, y + 5, 4, 3);

    // 目
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 14, y + 4, 2, 2);

    // しっぽ
    ctx.fillStyle = '#ddd';
    ctx.fillRect(x + 0, y + 4, 4, 4);

    // 足（黄色）
    ctx.fillStyle = '#f1c40f';
    ctx.fillRect(x + 4, y + 14, 2, 6);
    ctx.fillRect(x + 10, y + 14, 2, 6);
  }

  // ブタの描画（ピンクの四角＋鼻）
  drawPig(ctx, x, y) {
    // 胴体（ピンク）
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(x + 4, y + 8, 20, 14);

    // 頭
    ctx.fillStyle = '#FFB6C1';
    ctx.fillRect(x + 18, y + 4, 10, 12);

    // 耳
    ctx.fillStyle = '#FF9CAD';
    ctx.fillRect(x + 18, y + 2, 4, 4);
    ctx.fillRect(x + 24, y + 2, 4, 4);

    // 鼻（丸い鼻）
    ctx.fillStyle = '#FF8C9E';
    ctx.fillRect(x + 24, y + 9, 6, 5);
    // 鼻の穴
    ctx.fillStyle = '#e06070';
    ctx.fillRect(x + 25, y + 10, 2, 2);
    ctx.fillRect(x + 28, y + 10, 2, 2);

    // 目
    ctx.fillStyle = '#000';
    ctx.fillRect(x + 22, y + 7, 2, 2);

    // 足
    ctx.fillStyle = '#e8909e';
    ctx.fillRect(x + 6, y + 22, 4, 6);
    ctx.fillRect(x + 14, y + 22, 4, 6);
    ctx.fillRect(x + 20, y + 22, 4, 6);

    // しっぽ（くるん）
    ctx.fillStyle = '#FF9CAD';
    ctx.fillRect(x + 2, y + 10, 3, 2);
    ctx.fillRect(x + 0, y + 8, 3, 2);
    ctx.fillRect(x + 2, y + 6, 3, 2);
  }

  // ゾンビの描画（緑の人型）
  drawZombie(ctx, x, y) {
    // 体（ダークグリーン）
    ctx.fillStyle = '#1a7a3a';
    ctx.fillRect(x + 8, y + 10, 16, 16);

    // 頭（グリーン）
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x + 8, y + 2, 16, 12);

    // 目（赤い目）
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(x + 11, y + 6, 3, 3);
    ctx.fillRect(x + 18, y + 6, 3, 3);

    // 口
    ctx.fillStyle = '#145a2a';
    ctx.fillRect(x + 12, y + 11, 8, 2);

    // 腕（前に伸ばした状態）
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x + 2, y + 12, 8, 4);
    ctx.fillRect(x + 22, y + 12, 8, 4);

    // 足
    ctx.fillStyle = '#1a5c2e';
    ctx.fillRect(x + 8, y + 26, 7, 6);
    ctx.fillRect(x + 17, y + 26, 7, 6);

    // ボロボロの服（ライン）
    ctx.fillStyle = '#145020';
    ctx.fillRect(x + 8, y + 18, 16, 2);
  }

  // スケルトンの描画（白の人型）
  drawSkeleton(ctx, x, y) {
    // 頭蓋骨
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(x + 10, y + 2, 12, 12);

    // 目のくぼみ（暗い穴）
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 12, y + 5, 3, 4);
    ctx.fillRect(x + 18, y + 5, 3, 4);

    // 鼻の穴
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 15, y + 9, 2, 2);

    // 口（歯のライン）
    ctx.fillStyle = '#bdc3c7';
    ctx.fillRect(x + 12, y + 12, 8, 2);
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(x + 14, y + 12, 1, 2);
    ctx.fillRect(x + 17, y + 12, 1, 2);

    // 背骨
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(x + 14, y + 14, 4, 14);

    // 肋骨
    ctx.fillStyle = '#dde0e1';
    ctx.fillRect(x + 10, y + 16, 12, 2);
    ctx.fillRect(x + 10, y + 20, 12, 2);

    // 腕の骨
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(x + 4, y + 14, 8, 3);
    ctx.fillRect(x + 20, y + 14, 8, 3);
    ctx.fillRect(x + 2, y + 16, 4, 3);
    ctx.fillRect(x + 26, y + 16, 4, 3);

    // 足の骨
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(x + 10, y + 28, 4, 4);
    ctx.fillRect(x + 18, y + 28, 4, 4);
  }
}
