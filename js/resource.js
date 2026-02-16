// 資源の種類
const RESOURCE_TYPE = {
  TREE: 'TREE',
  ROCK: 'ROCK',
  IRON_ORE: 'IRON_ORE',
};

// 資源の定義
const RESOURCE_DEF = {
  [RESOURCE_TYPE.TREE]: {
    name: '木',
    widthTiles: 1,
    heightTiles: 1,
    gatherFrames: 120,     // 採集時間（フレーム数、60fps × 2秒）
    dropItem: 'WOOD',      // ドロップアイテムID
    dropMin: 3,            // 最小獲得数
    dropMax: 5,            // 最大獲得数
    requiredTool: 'axe',   // 適切な道具の種類
  },
  [RESOURCE_TYPE.ROCK]: {
    name: '石',
    widthTiles: 1,
    heightTiles: 1,
    gatherFrames: 180,         // 3秒
    dropItem: 'STONE',
    dropMin: 2,
    dropMax: 4,
    requiredTool: 'pickaxe',
  },
  [RESOURCE_TYPE.IRON_ORE]: {
    name: '鉄鉱石',
    widthTiles: 1,
    heightTiles: 1,
    gatherFrames: 240,         // 4秒
    dropItem: 'IRON',
    dropMin: 1,
    dropMax: 2,
    requiredTool: 'pickaxe',
  },
};

// 個々の資源オブジェクト
class Resource {
  constructor(type, col, row) {
    this.type = type;
    this.col = col;
    this.row = row;
    this.x = col * TILE_SIZE;
    this.y = row * TILE_SIZE;
    this.def = RESOURCE_DEF[type];
  }

  // 8bitドット絵風の木を描画
  drawTree(ctx) {
    const x = this.x;
    const y = this.y;

    // 幹（茶色）
    ctx.fillStyle = '#5c3a1e';
    ctx.fillRect(x + 12, y + 18, 8, 14);

    // 幹のハイライト
    ctx.fillStyle = '#7a4e2e';
    ctx.fillRect(x + 14, y + 20, 3, 10);

    // 葉（下段・広い部分）
    ctx.fillStyle = '#2d8c3c';
    ctx.fillRect(x + 4, y + 10, 24, 10);

    // 葉（上段・狭い部分）
    ctx.fillStyle = '#3aad4a';
    ctx.fillRect(x + 8, y + 2, 16, 12);

    // 葉のハイライト
    ctx.fillStyle = '#5cc86a';
    ctx.fillRect(x + 10, y + 4, 4, 4);
    ctx.fillRect(x + 18, y + 6, 3, 3);
  }

  // 8bitドット絵風の石を描画
  drawRock(ctx) {
    const x = this.x;
    const y = this.y;

    // メインの岩（灰色）
    ctx.fillStyle = '#777777';
    ctx.fillRect(x + 4, y + 10, 24, 18);
    ctx.fillRect(x + 8, y + 6, 16, 4);

    // ハイライト（明るい灰色）
    ctx.fillStyle = '#999999';
    ctx.fillRect(x + 6, y + 10, 10, 6);
    ctx.fillRect(x + 10, y + 6, 8, 4);

    // 影（暗い灰色）
    ctx.fillStyle = '#555555';
    ctx.fillRect(x + 4, y + 24, 24, 4);
    ctx.fillRect(x + 20, y + 14, 8, 10);
  }

  // 8bitドット絵風の鉄鉱石を描画
  drawIronOre(ctx) {
    const x = this.x;
    const y = this.y;

    // メインの岩（灰色）
    ctx.fillStyle = '#666666';
    ctx.fillRect(x + 4, y + 8, 24, 20);
    ctx.fillRect(x + 8, y + 4, 16, 4);

    // ハイライト（明るい灰色）
    ctx.fillStyle = '#888888';
    ctx.fillRect(x + 6, y + 8, 8, 6);

    // 鉄鉱石の模様（オレンジ色の斑点）
    ctx.fillStyle = '#d4883c';
    ctx.fillRect(x + 10, y + 12, 4, 4);
    ctx.fillRect(x + 18, y + 16, 4, 4);
    ctx.fillRect(x + 8, y + 20, 3, 3);
    ctx.fillRect(x + 20, y + 10, 3, 3);

    // 影（暗い灰色）
    ctx.fillStyle = '#444444';
    ctx.fillRect(x + 4, y + 24, 24, 4);
    ctx.fillRect(x + 22, y + 12, 6, 12);
  }

  draw(ctx) {
    switch (this.type) {
      case RESOURCE_TYPE.TREE:
        this.drawTree(ctx);
        break;
      case RESOURCE_TYPE.ROCK:
        this.drawRock(ctx);
        break;
      case RESOURCE_TYPE.IRON_ORE:
        this.drawIronOre(ctx);
        break;
    }
  }
}

// 資源マネージャー：資源の配置・管理・描画を担当
class ResourceManager {
  // 資源の配置数
  static TREE_COUNT = 30;
  static ROCK_COUNT = 15;
  static IRON_ORE_COUNT = 5;

  // 資源再生の定数（3日ごと）
  static REGEN_INTERVAL = 3;
  static REGEN_TREE_MIN = 2;
  static REGEN_TREE_MAX = 3;
  static REGEN_ROCK_MIN = 1;
  static REGEN_ROCK_MAX = 2;
  static REGEN_IRON_MIN = 0;
  static REGEN_IRON_MAX = 1;

  // 家の周囲に配置しない範囲（タイル数）
  static HOUSE_MARGIN = 4;

  // 採集に必要なプレイヤーとの距離（ピクセル）
  static GATHER_RANGE = 48;

  // プログレスバーの見た目
  static BAR_WIDTH = 32;
  static BAR_HEIGHT = 6;
  static BAR_OFFSET_Y = -6; // 資源の上に表示するオフセット

  constructor(gameMap) {
    this.gameMap = gameMap;
    this.resources = [];
    // 資源が配置されたタイルを管理（衝突判定用）
    this.occupiedTiles = new Set();

    // 採集状態
    this.gatherTarget = null;   // 採集中の資源オブジェクト
    this.gatherProgress = 0;    // 現在の採集進行フレーム数
    this.gatherDuration = 0;    // 完了に必要なフレーム数

    // 資源再生の最終日
    this.lastRegenDay = 0;

    this.placeResources();
  }

  // タイル座標からキーを生成
  tileKey(col, row) {
    return `${col},${row}`;
  }

  // 家の周辺かどうか判定
  isNearHouse(col, row) {
    const margin = ResourceManager.HOUSE_MARGIN;
    const houseLeft = this.gameMap.houseCol - margin;
    const houseRight = this.gameMap.houseCol + 4 + margin;
    const houseTop = this.gameMap.houseRow - margin;
    const houseBottom = this.gameMap.houseRow + 4 + margin;

    return col >= houseLeft && col <= houseRight &&
           row >= houseTop && row <= houseBottom;
  }

  // マップの端寄りかどうか判定（鉄鉱石の配置用）
  isNearEdge(col, row) {
    const edgeMargin = 10;
    return col < edgeMargin || col >= this.gameMap.cols - edgeMargin ||
           row < edgeMargin || row >= this.gameMap.rows - edgeMargin;
  }

  // 指定位置に資源を配置できるか判定
  canPlace(col, row) {
    // マップ範囲外
    if (col < 0 || col >= this.gameMap.cols || row < 0 || row >= this.gameMap.rows) {
      return false;
    }
    // 草地以外には配置しない
    if (this.gameMap.getTile(col, row) !== TILE.GRASS) {
      return false;
    }
    // 家の周辺には配置しない
    if (this.isNearHouse(col, row)) {
      return false;
    }
    // 既に資源がある場所には配置しない
    if (this.occupiedTiles.has(this.tileKey(col, row))) {
      return false;
    }
    return true;
  }

  // ランダムな位置に資源を1つ配置する
  placeOne(type, edgeOnly) {
    const maxAttempts = 100;
    for (let i = 0; i < maxAttempts; i++) {
      const col = Math.floor(Math.random() * this.gameMap.cols);
      const row = Math.floor(Math.random() * this.gameMap.rows);

      if (!this.canPlace(col, row)) continue;

      // 鉄鉱石はマップ端に配置
      if (edgeOnly && !this.isNearEdge(col, row)) continue;

      const resource = new Resource(type, col, row);
      this.resources.push(resource);
      this.occupiedTiles.add(this.tileKey(col, row));
      return true;
    }
    return false;
  }

  // 全資源を配置する
  placeResources() {
    // 木を配置
    for (let i = 0; i < ResourceManager.TREE_COUNT; i++) {
      this.placeOne(RESOURCE_TYPE.TREE, false);
    }
    // 石を配置
    for (let i = 0; i < ResourceManager.ROCK_COUNT; i++) {
      this.placeOne(RESOURCE_TYPE.ROCK, false);
    }
    // 鉄鉱石を配置（マップの端寄り）
    for (let i = 0; i < ResourceManager.IRON_ORE_COUNT; i++) {
      this.placeOne(RESOURCE_TYPE.IRON_ORE, true);
    }
  }

  // 畑の近くかどうか判定（再生配置用）
  isNearFarmland(col, row) {
    const margin = 2;
    for (let r = row - margin; r <= row + margin; r++) {
      for (let c = col - margin; c <= col + margin; c++) {
        if (this.gameMap.getTile(c, r) === TILE.FARMLAND) {
          return true;
        }
      }
    }
    return false;
  }

  // 資源再生用の配置（畑の近くを避ける）
  placeOneRegen(type, edgeOnly) {
    const maxAttempts = 100;
    for (let i = 0; i < maxAttempts; i++) {
      const col = Math.floor(Math.random() * this.gameMap.cols);
      const row = Math.floor(Math.random() * this.gameMap.rows);

      if (!this.canPlace(col, row)) continue;
      if (edgeOnly && !this.isNearEdge(col, row)) continue;
      if (this.isNearFarmland(col, row)) continue;

      const resource = new Resource(type, col, row);
      this.resources.push(resource);
      this.occupiedTiles.add(this.tileKey(col, row));
      return true;
    }
    return false;
  }

  // 資源の再生（3日ごとに新しい資源を少量生成）
  regenerateResources(currentDay) {
    if (currentDay < this.lastRegenDay + ResourceManager.REGEN_INTERVAL) return;
    this.lastRegenDay = currentDay;

    const treeCount = ResourceManager.REGEN_TREE_MIN +
      Math.floor(Math.random() * (ResourceManager.REGEN_TREE_MAX - ResourceManager.REGEN_TREE_MIN + 1));
    const rockCount = ResourceManager.REGEN_ROCK_MIN +
      Math.floor(Math.random() * (ResourceManager.REGEN_ROCK_MAX - ResourceManager.REGEN_ROCK_MIN + 1));
    const ironCount = ResourceManager.REGEN_IRON_MIN +
      Math.floor(Math.random() * (ResourceManager.REGEN_IRON_MAX - ResourceManager.REGEN_IRON_MIN + 1));

    for (let i = 0; i < treeCount; i++) {
      this.placeOneRegen(RESOURCE_TYPE.TREE, false);
    }
    for (let i = 0; i < rockCount; i++) {
      this.placeOneRegen(RESOURCE_TYPE.ROCK, false);
    }
    for (let i = 0; i < ironCount; i++) {
      this.placeOneRegen(RESOURCE_TYPE.IRON_ORE, true);
    }
  }

  // ワールド座標の矩形が資源と衝突するか判定
  isBlocked(x, y, size) {
    const left = Math.floor(x / TILE_SIZE);
    const right = Math.floor((x + size - 1) / TILE_SIZE);
    const top = Math.floor(y / TILE_SIZE);
    const bottom = Math.floor((y + size - 1) / TILE_SIZE);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (this.occupiedTiles.has(this.tileKey(c, r))) {
          return true;
        }
      }
    }
    return false;
  }

  // ワールド座標にある資源を返す（クリック判定用）
  getResourceAt(worldX, worldY) {
    const col = Math.floor(worldX / TILE_SIZE);
    const row = Math.floor(worldY / TILE_SIZE);
    return this.resources.find(r => r.col === col && r.row === row) || null;
  }

  // プレイヤーと資源の距離を計算（中心同士）
  distanceToResource(player, resource) {
    const px = player.x + player.size / 2;
    const py = player.y + player.size / 2;
    const rx = resource.x + TILE_SIZE / 2;
    const ry = resource.y + TILE_SIZE / 2;
    const dx = px - rx;
    const dy = py - ry;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 採集対象を設定する（クリック時に呼ばれる）
  // equippedTool: 装備中の道具のアイテム定義（nullなら素手）
  startGathering(resource, equippedTool) {
    this.gatherTarget = resource;
    this.gatherProgress = 0;

    let frames = resource.def.gatherFrames;
    // 適切な道具を装備している場合
    if (equippedTool && equippedTool.toolType === resource.def.requiredTool) {
      // 効率で採集時間を短縮
      frames = Math.floor(frames / equippedTool.efficiency);
      this.gatherUsedTool = true;
    } else {
      // 素手または不適切な道具: 2倍遅い
      frames = frames * 2;
      this.gatherUsedTool = false;
    }
    this.gatherDuration = frames;
  }

  // 採集をキャンセルする
  cancelGathering() {
    this.gatherTarget = null;
    this.gatherProgress = 0;
    this.gatherDuration = 0;
    this.gatherUsedTool = false;
  }

  // 採集の更新処理。採集完了時に { itemId, count } を返す
  updateGathering(player) {
    if (!this.gatherTarget) return null;

    // 対象がまだ存在するか確認
    if (!this.resources.includes(this.gatherTarget)) {
      this.cancelGathering();
      return null;
    }

    // プレイヤーが近くにいるか確認
    const dist = this.distanceToResource(player, this.gatherTarget);
    if (dist > ResourceManager.GATHER_RANGE) {
      // 遠すぎる場合は進行しない（移動中）
      return null;
    }

    // 採集進行
    this.gatherProgress++;

    if (this.gatherProgress >= this.gatherDuration) {
      // 採集完了
      const def = this.gatherTarget.def;
      const count = def.dropMin + Math.floor(Math.random() * (def.dropMax - def.dropMin + 1));
      const usedTool = this.gatherUsedTool;
      const result = { itemId: def.dropItem, count, usedTool };

      // 資源を削除
      this.removeResource(this.gatherTarget);
      this.cancelGathering();

      return result;
    }

    return null;
  }

  // 資源を削除する
  removeResource(resource) {
    const index = this.resources.indexOf(resource);
    if (index !== -1) {
      this.resources.splice(index, 1);
      this.occupiedTiles.delete(this.tileKey(resource.col, resource.row));
    }
  }

  // 全資源を描画する
  draw(ctx) {
    for (const resource of this.resources) {
      resource.draw(ctx);
    }

    // 採集中のプログレスバーを描画
    if (this.gatherTarget && this.gatherProgress > 0) {
      this.drawGatherBar(ctx);
    }
  }

  // 採集プログレスバーの描画（ワールド座標系で呼ばれる）
  drawGatherBar(ctx) {
    const resource = this.gatherTarget;
    const ratio = this.gatherProgress / this.gatherDuration;

    const barX = resource.x + (TILE_SIZE - ResourceManager.BAR_WIDTH) / 2;
    const barY = resource.y + ResourceManager.BAR_OFFSET_Y;

    // 背景（暗い灰色）
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, ResourceManager.BAR_WIDTH, ResourceManager.BAR_HEIGHT);

    // ゲージ（緑）
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(barX, barY, ResourceManager.BAR_WIDTH * ratio, ResourceManager.BAR_HEIGHT);

    // 枠線
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, ResourceManager.BAR_WIDTH, ResourceManager.BAR_HEIGHT);
  }
}
