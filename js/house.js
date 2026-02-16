class HouseScene {
  // 室内の論理サイズ（タイル数）
  static ROOM_COLS = 8;
  static ROOM_ROWS = 8;
  // 室内専用のタイルサイズ（ワールドより大きく表示）
  static ROOM_TILE_SIZE = 56;

  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.tileSize = HouseScene.ROOM_TILE_SIZE;

    // 室内描画のオフセット（キャンバス中央に配置）
    this.offsetX = Math.floor((canvasWidth - HouseScene.ROOM_COLS * this.tileSize) / 2);
    this.offsetY = Math.floor((canvasHeight - HouseScene.ROOM_ROWS * this.tileSize) / 2);

    // 家具の配置（タイル座標）
    this.furniture = {
      bed:     { col: 1, row: 2, w: 2, h: 3, label: 'ベッド' },
      storage: { col: 5, row: 2, w: 2, h: 2, label: '収納箱' },
      kitchen: { col: 3, row: 1, w: 2, h: 1, label: '調理台' },
    };

    // 出口の位置（下側中央）
    this.exit = { col: 3, row: 7, w: 2, h: 1 };
  }

  // クリック座標がベッドかどうか判定
  isBedClicked(screenX, screenY) {
    const tileX = screenX - this.offsetX;
    const tileY = screenY - this.offsetY;
    const col = Math.floor(tileX / this.tileSize);
    const row = Math.floor(tileY / this.tileSize);
    const bed = this.furniture.bed;

    return (
      col >= bed.col &&
      col < bed.col + bed.w &&
      row >= bed.row &&
      row < bed.row + bed.h
    );
  }

  // クリック座標が収納箱かどうか判定
  isStorageClicked(screenX, screenY) {
    const tileX = screenX - this.offsetX;
    const tileY = screenY - this.offsetY;
    const col = Math.floor(tileX / this.tileSize);
    const row = Math.floor(tileY / this.tileSize);
    const storage = this.furniture.storage;

    return (
      col >= storage.col &&
      col < storage.col + storage.w &&
      row >= storage.row &&
      row < storage.row + storage.h
    );
  }

  // クリック座標が調理台かどうか判定
  isKitchenClicked(screenX, screenY) {
    const tileX = screenX - this.offsetX;
    const tileY = screenY - this.offsetY;
    const col = Math.floor(tileX / this.tileSize);
    const row = Math.floor(tileY / this.tileSize);
    const kitchen = this.furniture.kitchen;

    return (
      col >= kitchen.col &&
      col < kitchen.col + kitchen.w &&
      row >= kitchen.row &&
      row < kitchen.row + kitchen.h
    );
  }

  // クリック座標が出口かどうか判定
  isExitClicked(screenX, screenY) {
    const tileX = screenX - this.offsetX;
    const tileY = screenY - this.offsetY;
    const col = Math.floor(tileX / this.tileSize);
    const row = Math.floor(tileY / this.tileSize);

    return (
      col >= this.exit.col &&
      col < this.exit.col + this.exit.w &&
      row >= this.exit.row &&
      row < this.exit.row + this.exit.h
    );
  }

  draw(ctx) {
    // 背景を暗くする
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    const ox = this.offsetX;
    const oy = this.offsetY;
    const ts = this.tileSize;

    // 床（木の色・市松模様）
    for (let r = 0; r < HouseScene.ROOM_ROWS; r++) {
      for (let c = 0; c < HouseScene.ROOM_COLS; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? '#c89860' : '#b88850';
        ctx.fillRect(ox + c * ts, oy + r * ts, ts, ts);
      }
    }

    // 壁（上と左右下）
    this.drawWalls(ctx, ox, oy, ts);

    // 家具を描画
    this.drawBed(ctx, ox, oy, ts);
    this.drawStorage(ctx, ox, oy, ts);
    this.drawKitchen(ctx, ox, oy, ts);

    // 出口
    this.drawExit(ctx, ox, oy, ts);
  }

  // 壁の描画
  drawWalls(ctx, ox, oy, ts) {
    const cols = HouseScene.ROOM_COLS;
    const rows = HouseScene.ROOM_ROWS;

    // 上壁
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(ox + c * ts, oy, ts, ts);
      ctx.fillStyle = '#7a5c10';
      ctx.fillRect(ox + c * ts + 3, oy + 3, ts - 6, ts - 6);
    }

    // 左壁
    for (let r = 1; r < rows; r++) {
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(ox, oy + r * ts, ts, ts);
      ctx.fillStyle = '#7a5c10';
      ctx.fillRect(ox + 3, oy + r * ts + 3, ts - 6, ts - 6);
    }

    // 右壁
    for (let r = 1; r < rows; r++) {
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(ox + (cols - 1) * ts, oy + r * ts, ts, ts);
      ctx.fillStyle = '#7a5c10';
      ctx.fillRect(ox + (cols - 1) * ts + 3, oy + r * ts + 3, ts - 6, ts - 6);
    }

    // 下壁（出口以外）
    for (let c = 0; c < cols; c++) {
      if (c >= this.exit.col && c < this.exit.col + this.exit.w) continue;
      ctx.fillStyle = '#8B6914';
      ctx.fillRect(ox + c * ts, oy + (rows - 1) * ts, ts, ts);
      ctx.fillStyle = '#7a5c10';
      ctx.fillRect(ox + c * ts + 3, oy + (rows - 1) * ts + 3, ts - 6, ts - 6);
    }
  }

  // ベッドの描画（左側）
  drawBed(ctx, ox, oy, ts) {
    const f = this.furniture.bed;
    const x = ox + f.col * ts;
    const y = oy + f.row * ts;
    const w = f.w * ts;
    const h = f.h * ts;

    // ベッドフレーム（濃い木の色）
    ctx.fillStyle = '#5a2d10';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // マットレス（明るいクリーム色）
    ctx.fillStyle = '#f0e8d8';
    ctx.fillRect(x + 8, y + 8, w - 16, h - 16);

    // 枕（水色）
    ctx.fillStyle = '#87ceeb';
    ctx.fillRect(x + 12, y + 12, w - 24, ts - 12);

    // 掛け布団（鮮やかな青）
    ctx.fillStyle = '#3a6eaa';
    ctx.fillRect(x + 8, y + ts + 6, w - 16, h - ts - 24);

    // 掛け布団のストライプ模様
    ctx.fillStyle = '#4a80c0';
    for (let i = 0; i < 3; i++) {
      const sy = y + ts + 14 + i * 18;
      if (sy + 4 < y + h - 18) {
        ctx.fillRect(x + 12, sy, w - 24, 4);
      }
    }

    // 枠線
    ctx.strokeStyle = '#3a1a05';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // ラベル
    this.drawLabel(ctx, x + w / 2, y + h + 14, f.label);
  }

  // 収納箱の描画（右側）
  drawStorage(ctx, ox, oy, ts) {
    const f = this.furniture.storage;
    const x = ox + f.col * ts;
    const y = oy + f.row * ts;
    const w = f.w * ts;
    const h = f.h * ts;

    // 箱本体（しっかりした茶色）
    ctx.fillStyle = '#7a4a28';
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // 箱の上面（少し明るい茶色）
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(x + 4, y + 4, w - 8, h / 2 - 6);

    // 箱のフタライン
    ctx.fillStyle = '#5a3218';
    ctx.fillRect(x + 4, y + h / 2 - 2, w - 8, 4);

    // 金具（黄色）
    ctx.fillStyle = '#e8b820';
    ctx.fillRect(x + w / 2 - 6, y + h / 2 - 8, 12, 16);
    ctx.fillStyle = '#c89810';
    ctx.fillRect(x + w / 2 - 3, y + h / 2 - 5, 6, 10);

    // 枠線
    ctx.strokeStyle = '#3a1a05';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);

    // ラベル
    this.drawLabel(ctx, x + w / 2, y + h + 14, f.label);
  }

  // 調理台の描画（上側）
  drawKitchen(ctx, ox, oy, ts) {
    const f = this.furniture.kitchen;
    const x = ox + f.col * ts;
    const y = oy + f.row * ts;
    const w = f.w * ts;
    const h = f.h * ts;

    // 台（灰色）
    ctx.fillStyle = '#606060';
    ctx.fillRect(x + 2, y + 2, w - 4, h - 4);

    // 天板（明るい灰色）
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(x + 6, y + 6, w - 12, h - 12);

    // コンロ（赤丸×2）
    ctx.fillStyle = '#d04030';
    const cx1 = x + w / 3;
    const cx2 = x + (w * 2) / 3;
    const cy = y + h / 2;
    ctx.beginPath();
    ctx.arc(cx1, cy, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx2, cy, 10, 0, Math.PI * 2);
    ctx.fill();

    // コンロの内側
    ctx.fillStyle = '#e06050';
    ctx.beginPath();
    ctx.arc(cx1, cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx2, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // 枠線
    ctx.strokeStyle = '#404040';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);

    // ラベル
    this.drawLabel(ctx, x + w / 2, y + h + 14, f.label);
  }

  // 出口の描画
  drawExit(ctx, ox, oy, ts) {
    const e = this.exit;
    const x = ox + e.col * ts;
    const y = oy + e.row * ts;
    const w = e.w * ts;
    const h = e.h * ts;

    // 出口のハイライト（明るい緑）
    ctx.fillStyle = '#4a8c2a';
    ctx.fillRect(x, y, w, h);

    // 矢印（下向き）
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x + w / 2 - 14, y + 8);
    ctx.lineTo(x + w / 2 + 14, y + 8);
    ctx.lineTo(x + w / 2, y + h - 6);
    ctx.closePath();
    ctx.fill();

    // テキスト
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('出口', x + w / 2, y - 6);
  }

  // ラベル描画ヘルパー
  drawLabel(ctx, x, y, text) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(text, x, y);
  }
}
