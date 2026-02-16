const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

const gameMap = new GameMap(50, 50);
const resourceManager = new ResourceManager(gameMap);

const camera = {
  x: 0,
  y: 0,
  update(target) {
    this.x = target.x + target.size / 2 - canvas.width / 2;
    this.y = target.y + target.size / 2 - canvas.height / 2;

    this.x = Math.max(0, Math.min(this.x, gameMap.width - canvas.width));
    this.y = Math.max(0, Math.min(this.y, gameMap.height - canvas.height));
  },
};

// プレイヤーを家の入口の前に配置
const player = new Player(
  gameMap.houseDoorCol * TILE_SIZE,
  (gameMap.houseDoorRow + 1) * TILE_SIZE,
  gameMap,
  resourceManager
);

const timeManager = new TimeManager();
const houseScene = new HouseScene(canvas.width, canvas.height);

// 現在のシーン（'title', 'world' または 'house'）
let currentScene = 'title';

// インベントリ（初期所持品）
const inventory = new Inventory();
const craftingMenu = new CraftingMenu();
const storageBox = new StorageBox();
const cookingMenu = new CookingMenu();
const farmManager = new FarmManager();
const enemyManager = new EnemyManager();
inventory.addItem('WOOD_AXE', 1);
inventory.addItem('WOOD_PICKAXE', 1);
inventory.addItem('WOOD_HOE', 1);
inventory.addItem('APPLE', 3);

// タイトル画面の状態
let titleConfirmNew = false;

// セーブ関連
const SAVE_KEY = 'wildlife_save';
let saveMessage = '';
let saveMessageTimer = 0;
const SAVE_MESSAGE_DURATION = 120;

// セーブボタン定数
const SAVE_BTN_WIDTH = 72;
const SAVE_BTN_HEIGHT = 24;

// セーブボタンの矩形を返す
function getSaveBtnRect() {
  return {
    x: canvas.width - SAVE_BTN_WIDTH - 10,
    y: 34,
    w: SAVE_BTN_WIDTH,
    h: SAVE_BTN_HEIGHT,
  };
}

// セーブデータの有無を確認
function hasSaveData() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

// ゲーム状態をセーブ
function saveGame() {
  const data = {
    player: {
      x: player.x,
      y: player.y,
      health: player.health,
      hunger: player.hunger,
    },
    inventory: {
      slots: inventory.slots,
      equippedSlot: inventory.equippedSlot,
    },
    storageBox: {
      slots: storageBox.slots,
    },
    map: {
      tiles: gameMap.tiles,
    },
    resources: resourceManager.resources.map(r => ({
      type: r.type,
      col: r.col,
      row: r.row,
    })),
    resourceLastRegenDay: resourceManager.lastRegenDay,
    farm: {
      crops: farmManager.crops.map(c => ({
        col: c.col,
        row: c.row,
        seedType: c.seedType,
        watered: c.watered,
        growthStage: c.growthStage,
      })),
      lastResetDay: farmManager.lastResetDay,
    },
    time: {
      day: timeManager.day,
      timeOfDay: timeManager.timeOfDay,
    },
    currentScene: currentScene,
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  saveMessage = 'セーブしました';
  saveMessageTimer = SAVE_MESSAGE_DURATION;
}

// セーブデータからロード
function loadGame() {
  const json = localStorage.getItem(SAVE_KEY);
  if (!json) return false;

  try {
    const data = JSON.parse(json);

    // プレイヤー
    player.x = data.player.x;
    player.y = data.player.y;
    player.targetX = data.player.x;
    player.targetY = data.player.y;
    player.health = data.player.health;
    player.hunger = data.player.hunger;

    // インベントリ
    inventory.slots = data.inventory.slots;
    inventory.equippedSlot = data.inventory.equippedSlot;
    inventory.selectedSlot = -1;
    inventory.open = false;

    // 収納箱
    storageBox.slots = data.storageBox.slots;
    storageBox.open = false;

    // マップ
    for (let r = 0; r < gameMap.rows; r++) {
      for (let c = 0; c < gameMap.cols; c++) {
        gameMap.tiles[r][c] = data.map.tiles[r][c];
      }
    }

    // 資源
    resourceManager.resources = [];
    resourceManager.occupiedTiles.clear();
    for (const rd of data.resources) {
      const resource = new Resource(rd.type, rd.col, rd.row);
      resourceManager.resources.push(resource);
      resourceManager.occupiedTiles.add(resourceManager.tileKey(rd.col, rd.row));
    }
    resourceManager.cancelGathering();
    resourceManager.lastRegenDay = data.resourceLastRegenDay || 0;

    // 農場
    farmManager.crops = data.farm.crops.map(cd => {
      const crop = new Crop(cd.col, cd.row, cd.seedType);
      crop.watered = cd.watered;
      crop.growthStage = cd.growthStage;
      return crop;
    });
    farmManager.lastResetDay = data.farm.lastResetDay;

    // 時間
    timeManager.day = data.time.day;
    timeManager.timeOfDay = data.time.timeOfDay;

    // シーン
    currentScene = data.currentScene;

    // 敵をリセット（時間帯に応じて再生成される）
    enemyManager.enemies = [];
    enemyManager.droppedItems = [];
    enemyManager.damageNumbers = [];

    // UIを閉じる
    craftingMenu.open = false;
    cookingMenu.open = false;

    // タイマーリセット
    coldTimer = 0;
    heatTimer = 0;
    envDamageType = null;
    damageFlashTimer = 0;
    sleepState = null;

    // ロード時はチュートリアルをスキップ
    tutorialComplete = true;

    return true;
  } catch (e) {
    console.error('セーブデータの読み込みに失敗:', e);
    return false;
  }
}

// タイトル画面のクリック処理
function handleTitleClick(screenX, screenY) {
  const hasSave = hasSaveData();
  const btnW = 200;
  const btnH = 44;
  const btnX = canvas.width / 2 - btnW / 2;

  if (titleConfirmNew) {
    // 確認ダイアログのボタン判定
    const dh = 180;
    const dy = canvas.height / 2 - dh / 2;
    const cbtnW = 120;
    const cbtnH = 36;
    const cbtnY = dy + dh - 54;

    // 「はい」ボタン
    if (
      screenX >= canvas.width / 2 - cbtnW - 16 &&
      screenX <= canvas.width / 2 - 16 &&
      screenY >= cbtnY && screenY <= cbtnY + cbtnH
    ) {
      localStorage.removeItem(SAVE_KEY);
      titleConfirmNew = false;
      resetTutorial();
      currentScene = 'world';
      return;
    }

    // 「いいえ」ボタン
    if (
      screenX >= canvas.width / 2 + 16 &&
      screenX <= canvas.width / 2 + 16 + cbtnW &&
      screenY >= cbtnY && screenY <= cbtnY + cbtnH
    ) {
      titleConfirmNew = false;
      return;
    }
    return;
  }

  let btnY = 260;

  if (hasSave) {
    // 「つづきから」ボタン
    if (
      screenX >= btnX && screenX <= btnX + btnW &&
      screenY >= btnY && screenY <= btnY + btnH
    ) {
      loadGame();
      return;
    }
    btnY += 60;
  }

  // 「はじめから」ボタン
  if (
    screenX >= btnX && screenX <= btnX + btnW &&
    screenY >= btnY && screenY <= btnY + btnH
  ) {
    if (hasSave) {
      titleConfirmNew = true;
    } else {
      resetTutorial();
      currentScene = 'world';
    }
  }
}

// タイトル画面の装飾用の木
function drawTitleTree(ctx, x, y) {
  ctx.fillStyle = '#5c3a1e';
  ctx.fillRect(x - 4, y, 8, 20);
  ctx.fillStyle = '#2d8c3c';
  ctx.fillRect(x - 14, y - 10, 28, 16);
  ctx.fillStyle = '#3aad4a';
  ctx.fillRect(x - 10, y - 20, 20, 14);
}

// タイトル画面のボタン描画
function drawTitleButton(ctx, x, y, w, h, text, color, borderColor) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(x, y, w, h / 2);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, x + w / 2, y + h / 2 + 6);
}

// 確認ダイアログの描画
function drawConfirmDialog(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const dw = 360;
  const dh = 180;
  const dx = canvas.width / 2 - dw / 2;
  const dy = canvas.height / 2 - dh / 2;

  ctx.fillStyle = 'rgba(20, 15, 10, 0.95)';
  ctx.fillRect(dx, dy, dw, dh);
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.strokeRect(dx, dy, dw, dh);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('セーブデータがあります', canvas.width / 2, dy + 40);
  ctx.fillText('最初から始めますか？', canvas.width / 2, dy + 62);

  ctx.fillStyle = '#e74c3c';
  ctx.font = '12px monospace';
  ctx.fillText('※セーブデータは消去されます', canvas.width / 2, dy + 86);

  const btnW = 120;
  const btnH = 36;
  const btnY = dy + dh - 54;

  drawTitleButton(ctx, canvas.width / 2 - btnW - 16, btnY, btnW, btnH, 'はい', '#e74c3c', '#c0392b');
  drawTitleButton(ctx, canvas.width / 2 + 16, btnY, btnW, btnH, 'いいえ', '#555', '#444');
}

// タイトル画面の描画
function drawTitleScreen(ctx) {
  // 背景
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 地面の装飾
  for (let c = 0; c < Math.ceil(canvas.width / 32); c++) {
    const x = c * 32;
    ctx.fillStyle = (c % 2 === 0) ? '#2a5a2a' : '#245024';
    ctx.fillRect(x, canvas.height - 64, 32, 64);
  }

  // 木の装飾
  drawTitleTree(ctx, 80, canvas.height - 100);
  drawTitleTree(ctx, 180, canvas.height - 80);
  drawTitleTree(ctx, canvas.width - 100, canvas.height - 110);
  drawTitleTree(ctx, canvas.width - 200, canvas.height - 85);

  // タイトル影
  ctx.fillStyle = '#000';
  ctx.font = 'bold 48px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ワイルドライフ', canvas.width / 2 + 3, 163);

  // タイトル
  ctx.fillStyle = '#4adc5a';
  ctx.fillText('ワイルドライフ', canvas.width / 2, 160);

  // サブタイトル
  ctx.fillStyle = '#aaa';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('- サバイバル建築ゲーム -', canvas.width / 2, 195);

  const hasSave = hasSaveData();

  if (titleConfirmNew) {
    drawConfirmDialog(ctx);
  } else {
    const btnW = 200;
    const btnH = 44;
    const btnX = canvas.width / 2 - btnW / 2;
    let btnY = 260;

    if (hasSave) {
      drawTitleButton(ctx, btnX, btnY, btnW, btnH, 'つづきから', '#2ecc71', '#27ae60');
      btnY += 60;
    }
    drawTitleButton(ctx, btnX, btnY, btnW, btnH, 'はじめから', '#3498db', '#2980b9');
  }

  // フッター
  ctx.fillStyle = '#555';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('クリックで移動 / Shift+クリックで走る', canvas.width / 2, canvas.height - 20);
}

// セーブボタンの描画
function drawSaveButton(ctx) {
  const btn = getSaveBtnRect();
  ctx.fillStyle = '#555';
  ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
  ctx.strokeStyle = '#777';
  ctx.lineWidth = 1;
  ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('セーブ', btn.x + btn.w / 2, btn.y + btn.h - 7);
}

// セーブメッセージの描画
function drawSaveMessage(ctx) {
  if (saveMessageTimer <= 0) return;
  saveMessageTimer--;
  const alpha = Math.min(saveMessageTimer / 30, 1);
  ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * alpha})`;
  ctx.fillRect(canvas.width / 2 - 100, canvas.height / 2 - 20, 200, 40);
  ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
  ctx.font = 'bold 16px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(saveMessage, canvas.width / 2, canvas.height / 2 + 6);
}

// チュートリアル関連
const TUTORIAL_KEY = 'wildlife_tutorial';
const TUTORIAL_DURATION = 300; // 5秒
const TUTORIAL_MESSAGES = [
  { text: 'まずは周りの木や石を集めてみましょう', shown: false, done: false, timer: 0 },
  { text: '夜は危険です。家に戻りましょう', shown: false, done: false, timer: 0 },
];
let tutorialComplete = localStorage.getItem(TUTORIAL_KEY) === 'done';

// チュートリアルをリセットする
function resetTutorial() {
  localStorage.removeItem(TUTORIAL_KEY);
  tutorialComplete = false;
  for (const msg of TUTORIAL_MESSAGES) {
    msg.shown = false;
    msg.done = false;
    msg.timer = 0;
  }
}

// チュートリアルの更新
function updateTutorial() {
  if (tutorialComplete || currentScene !== 'world') return;

  const msg0 = TUTORIAL_MESSAGES[0];
  const msg1 = TUTORIAL_MESSAGES[1];

  // ステップ1: ワールドに入ったら「資源を集めよう」
  if (!msg0.shown) {
    msg0.shown = true;
    msg0.timer = TUTORIAL_DURATION;
  }
  if (msg0.timer > 0) {
    msg0.timer--;
    if (msg0.timer <= 0) msg0.done = true;
  }

  // ステップ2: 夕方になったら「夜は危険」
  if (msg0.done && !msg1.shown && timeManager.getHour() >= 17) {
    msg1.shown = true;
    msg1.timer = TUTORIAL_DURATION;
  }
  if (msg1.timer > 0) {
    msg1.timer--;
    if (msg1.timer <= 0) {
      msg1.done = true;
      tutorialComplete = true;
      localStorage.setItem(TUTORIAL_KEY, 'done');
    }
  }
}

// チュートリアルメッセージの描画（吹き出し形式）
function drawTutorialMessage(ctx) {
  if (tutorialComplete) return;

  for (const msg of TUTORIAL_MESSAGES) {
    if (msg.timer > 0) {
      const alpha = Math.min(msg.timer / 30, 1);

      ctx.font = 'bold 14px monospace';
      const textWidth = ctx.measureText(msg.text).width;
      const bubbleW = textWidth + 24;
      const bubbleH = 36;
      const bubbleX = canvas.width / 2 - bubbleW / 2;
      const bubbleY = 100;

      // 吹き出し背景
      ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
      ctx.fillRect(bubbleX, bubbleY, bubbleW, bubbleH);
      ctx.strokeStyle = `rgba(255, 204, 0, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.strokeRect(bubbleX, bubbleY, bubbleW, bubbleH);

      // 吹き出しの矢印
      ctx.fillStyle = `rgba(0, 0, 0, ${0.7 * alpha})`;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 8, bubbleY + bubbleH);
      ctx.lineTo(canvas.width / 2, bubbleY + bubbleH + 10);
      ctx.lineTo(canvas.width / 2 + 8, bubbleY + bubbleH);
      ctx.closePath();
      ctx.fill();

      // テキスト
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.textAlign = 'center';
      ctx.fillText(msg.text, canvas.width / 2, bubbleY + bubbleH / 2 + 5);
      break; // 1つだけ表示
    }
  }
}

// 操作ガイドの描画（画面右下）
function drawOperationGuide(ctx) {
  const lines = [
    '左クリック: 移動/アクション',
    '右クリック: ブロック配置',
    'I: インベントリ',
    'C: 錬成',
  ];

  const lineHeight = 16;
  const padding = 8;
  const guideW = 190;
  const guideH = lines.length * lineHeight + padding * 2;
  const guideX = canvas.width - guideW - 10;
  const guideY = canvas.height - guideH - 70;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.fillRect(guideX, guideY, guideW, guideH);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], guideX + padding, guideY + padding + (i + 1) * lineHeight - 3);
  }
}

// 睡眠システム
const SLEEP_FADE_FRAMES = 60;  // フェードにかけるフレーム数（約1秒）
const SLEEP_HOLD_FRAMES = 120; // zzz表示のフレーム数（約2秒）
let sleepState = null;   // null / 'fadeOut' / 'sleeping' / 'fadeIn'
let sleepTimer = 0;      // 各フェーズのフレームカウンタ
let sleepForced = false;  // 強制睡眠かどうか

// 警告メッセージ
let warningMessage = '';
let warningTimer = 0;
const WARNING_DURATION = 90; // 約1.5秒

// 回復エフェクト
let recoveryText = '';
let recoveryTimer = 0;
let recoveryY = 0;
const RECOVERY_DURATION = 60; // 約1秒

// 被ダメージ赤フラッシュ
let damageFlashTimer = 0;
const DAMAGE_FLASH_DURATION = 15; // 約0.25秒

// 環境ダメージ
const COLD_DAMAGE = 2;                        // 寒さダメージ量
const COLD_INTERVAL = 30 * 60;                // 30秒（1800フレーム）
const HEAT_DAMAGE = 1;                        // 暑さダメージ量
const HEAT_INTERVAL = 60 * 60;                // 60秒（3600フレーム）
let coldTimer = 0;
let heatTimer = 0;
let envDamageType = null; // null / 'cold' / 'heat'

function showWarning(message) {
  warningMessage = message;
  warningTimer = WARNING_DURATION;
}

function showRecovery(amount) {
  recoveryText = `+${amount}`;
  recoveryTimer = RECOVERY_DURATION;
  recoveryY = 0;
}

// 環境ダメージ警告の描画
function drawEnvDamageWarning(ctx) {
  if (!envDamageType) return;

  const warnX = HUD_X;
  const warnY = 64;

  // 背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(warnX, warnY, 120, 24);

  if (envDamageType === 'cold') {
    // 雪の結晶アイコン（簡易）
    ctx.fillStyle = '#a0d8ef';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('*', warnX + 6, warnY + 17);
    // 十字の線で結晶風
    const icx = warnX + 10;
    const icy = warnY + 12;
    ctx.fillStyle = '#a0d8ef';
    ctx.fillRect(icx - 1, icy - 6, 2, 12);
    ctx.fillRect(icx - 6, icy - 1, 12, 2);
    ctx.fillRect(icx - 4, icy - 4, 2, 2);
    ctx.fillRect(icx + 2, icy - 4, 2, 2);
    ctx.fillRect(icx - 4, icy + 2, 2, 2);
    ctx.fillRect(icx + 2, icy + 2, 2, 2);
    // テキスト
    ctx.fillStyle = '#a0d8ef';
    ctx.font = 'bold 12px monospace';
    ctx.fillText('寒い！', warnX + 24, warnY + 17);
  } else if (envDamageType === 'heat') {
    // 太陽アイコン（簡易）
    const sx = warnX + 10;
    const sy = warnY + 12;
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.arc(sx, sy, 5, 0, Math.PI * 2);
    ctx.fill();
    // 光線
    ctx.fillRect(sx - 1, sy - 9, 2, 4);
    ctx.fillRect(sx - 1, sy + 5, 2, 4);
    ctx.fillRect(sx - 9, sy - 1, 4, 2);
    ctx.fillRect(sx + 5, sy - 1, 4, 2);
    // テキスト
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('暑い！', warnX + 24, warnY + 17);
  }
}

// HUD定数
const HUD_X = 10;
const HUD_BAR_WIDTH = 200;
const HUD_BAR_HEIGHT = 20;
const HUD_FONT = 'bold 12px monospace';

// 体力ゲージの描画
let healthBarBlinkFrame = 0;
function drawHealthGauge(ctx, player) {
  const x = HUD_X;
  const y = 10;
  const ratio = player.health / player.maxHealth;

  // 環境ダメージ時は点滅
  healthBarBlinkFrame++;
  const blinking = envDamageType !== null && Math.floor(healthBarBlinkFrame / 15) % 2 === 0;

  // 背景（暗い赤）
  ctx.fillStyle = '#6b1a1a';
  ctx.fillRect(x, y, HUD_BAR_WIDTH, HUD_BAR_HEIGHT);

  // ゲージ（点滅時は明るく）
  ctx.fillStyle = blinking ? '#ff6b6b' : '#e74c3c';
  ctx.fillRect(x, y, HUD_BAR_WIDTH * ratio, HUD_BAR_HEIGHT);

  // 枠線（点滅時は白く）
  ctx.strokeStyle = blinking ? '#fff' : '#333';
  ctx.lineWidth = blinking ? 2 : 1;
  ctx.strokeRect(x, y, HUD_BAR_WIDTH, HUD_BAR_HEIGHT);

  // テキスト
  ctx.fillStyle = '#fff';
  ctx.font = HUD_FONT;
  ctx.textAlign = 'left';
  ctx.fillText(
    `HP: ${Math.ceil(player.health)}/${player.maxHealth}`,
    x + 6,
    y + HUD_BAR_HEIGHT - 5
  );
}

// 空腹ゲージの描画
function drawHungerGauge(ctx, player) {
  const x = HUD_X;
  const y = 36; // 体力ゲージの下
  const ratio = player.hunger / player.maxHunger;

  // 背景（暗いオレンジ）
  ctx.fillStyle = '#6b3a1a';
  ctx.fillRect(x, y, HUD_BAR_WIDTH, HUD_BAR_HEIGHT);

  // ゲージ（明るいオレンジ）
  ctx.fillStyle = '#e67e22';
  ctx.fillRect(x, y, HUD_BAR_WIDTH * ratio, HUD_BAR_HEIGHT);

  // 枠線
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, HUD_BAR_WIDTH, HUD_BAR_HEIGHT);

  // テキスト
  ctx.fillStyle = '#fff';
  ctx.font = HUD_FONT;
  ctx.textAlign = 'left';
  ctx.fillText(
    `満腹度: ${Math.ceil(player.hunger)}/${player.maxHunger}`,
    x + 6,
    y + HUD_BAR_HEIGHT - 5
  );
}

// 時刻表示の描画（画面右上）
function drawTimeDisplay(ctx, timeManager) {
  const text = timeManager.getDisplayString();
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'right';

  // 背景
  const textWidth = ctx.measureText(text).width;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(canvas.width - textWidth - 20, 6, textWidth + 14, 24);

  // テキスト
  ctx.fillStyle = '#fff';
  ctx.fillText(text, canvas.width - 13, 23);
}

// 昼夜オーバーレイの描画
function drawDayNightOverlay(ctx, timeManager) {
  const overlay = timeManager.getOverlay();
  if (overlay.color) {
    ctx.fillStyle = overlay.color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// 睡眠を開始する
function startSleep(forced) {
  sleepState = 'fadeOut';
  sleepTimer = 0;
  sleepForced = forced;
}

// 睡眠の効果を適用する（フェードアウト完了時に呼ばれる）
function applySleepEffect() {
  if (sleepForced) {
    // 強制睡眠: HP50%まで回復（ペナルティ）
    player.health = player.maxHealth * 0.5;
    // 家の中に移動
    currentScene = 'house';
  } else {
    // 自発的睡眠: HP全回復
    player.health = player.maxHealth;
  }
  // 翌朝6:00まで時間を進める
  timeManager.skipToMorning();
}

// 睡眠演出の更新と描画
function updateAndDrawSleep(ctx) {
  if (sleepState === 'fadeOut') {
    sleepTimer++;
    const opacity = Math.min(sleepTimer / SLEEP_FADE_FRAMES, 1);
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (sleepTimer >= SLEEP_FADE_FRAMES) {
      // フェードアウト完了 → 睡眠効果を適用
      applySleepEffect();
      sleepState = 'sleeping';
      sleepTimer = 0;
    }
  } else if (sleepState === 'sleeping') {
    sleepTimer++;
    // 黒画面 + zzz演出
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // zzzアニメーション（ゆらゆら動く）
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    const dots = '.'.repeat(Math.floor(sleepTimer / 20) % 4);
    ctx.fillText(`zzz${dots}`, canvas.width / 2, canvas.height / 2 - 10);

    // 補足テキスト
    ctx.font = 'bold 14px monospace';
    ctx.fillStyle = '#aaa';
    if (sleepForced) {
      ctx.fillText('体力が尽きて倒れてしまった...', canvas.width / 2, canvas.height / 2 + 30);
    } else {
      ctx.fillText('ぐっすり眠っている...', canvas.width / 2, canvas.height / 2 + 30);
    }

    if (sleepTimer >= SLEEP_HOLD_FRAMES) {
      sleepState = 'fadeIn';
      sleepTimer = 0;
    }
  } else if (sleepState === 'fadeIn') {
    sleepTimer++;
    const opacity = Math.max(1 - sleepTimer / SLEEP_FADE_FRAMES, 0);
    ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (sleepTimer >= SLEEP_FADE_FRAMES) {
      // 睡眠終了
      sleepState = null;
      sleepTimer = 0;
    }
  }
}

// 装備中の道具アイコンをプレイヤーの横に描画（ワールド座標系）
function drawEquippedToolIcon(ctx, player, inventory) {
  const equippedItem = inventory.getEquippedItem();
  if (!equippedItem) return;

  // プレイヤーの右上に小さくアイコン表示
  const iconX = player.x + player.size - 4;
  const iconY = player.y - 8;
  const iconSize = 20;

  // 背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(iconX, iconY, iconSize, iconSize);

  // 道具ミニアイコン描画
  const cx = iconX + iconSize / 2;
  const cy = iconY + iconSize / 2;

  if (equippedItem.toolType === 'axe') {
    ctx.fillStyle = equippedItem.handleColor;
    ctx.fillRect(cx - 1, cy - 1, 2, 10);
    ctx.fillStyle = equippedItem.color;
    ctx.fillRect(cx - 5, cy - 6, 6, 6);
  } else if (equippedItem.toolType === 'pickaxe') {
    ctx.fillStyle = equippedItem.handleColor;
    ctx.fillRect(cx - 1, cy, 2, 10);
    ctx.fillStyle = equippedItem.color;
    ctx.fillRect(cx - 6, cy - 6, 12, 4);
  } else if (equippedItem.toolType === 'hoe') {
    ctx.fillStyle = equippedItem.handleColor;
    ctx.fillRect(cx - 1, cy, 2, 10);
    ctx.fillStyle = equippedItem.color;
    ctx.fillRect(cx - 5, cy - 6, 7, 4);
    ctx.fillRect(cx - 5, cy - 3, 2, 3);
  } else if (equippedItem.toolType === 'sword') {
    ctx.fillStyle = equippedItem.color;
    ctx.fillRect(cx - 1, cy - 8, 2, 10);
    ctx.fillStyle = equippedItem.handleColor;
    ctx.fillRect(cx - 3, cy + 1, 6, 2);
    ctx.fillStyle = '#5a3825';
    ctx.fillRect(cx - 1, cy + 3, 2, 5);
  } else if (equippedItem.toolType === 'watering_can') {
    ctx.fillStyle = equippedItem.color;
    ctx.fillRect(cx - 4, cy - 3, 8, 8);
    ctx.fillRect(cx + 3, cy - 6, 2, 4);
    ctx.fillRect(cx + 4, cy - 7, 3, 2);
    ctx.fillStyle = equippedItem.handleColor;
    ctx.fillRect(cx - 6, cy - 5, 2, 6);
  }
}

// 空腹時の警告表示
function drawStarvingWarning(ctx) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(canvas.width / 2 - 120, canvas.height / 2 - 20, 240, 40);
  ctx.fillStyle = '#ff4444';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('空腹で動けない！', canvas.width / 2, canvas.height / 2 + 6);
}

const blockBar = {
  blockTypes: [TILE.STONE, TILE.DIRT, TILE.SAND, TILE.GRASS, TILE.WOOD],
  selected: 0,
  itemSize: 48,
  padding: 6,
  getY() {
    return canvas.height - this.itemSize - this.padding * 2;
  },
  getStartX() {
    const totalWidth = this.blockTypes.length * (this.itemSize + this.padding) + this.padding;
    return (canvas.width - totalWidth) / 2;
  },
  handleClick(mouseX, mouseY) {
    if (mouseY < this.getY()) return false;
    const startX = this.getStartX();
    for (let i = 0; i < this.blockTypes.length; i++) {
      const x = startX + this.padding + i * (this.itemSize + this.padding);
      if (mouseX >= x && mouseX <= x + this.itemSize) {
        this.selected = i;
        return true;
      }
    }
    return false;
  },
  getSelectedTile() {
    return this.blockTypes[this.selected];
  },
  draw(ctx) {
    const startX = this.getStartX();
    const y = this.getY();
    const totalWidth = this.blockTypes.length * (this.itemSize + this.padding) + this.padding;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(startX, y, totalWidth, this.itemSize + this.padding * 2);

    for (let i = 0; i < this.blockTypes.length; i++) {
      const tile = this.blockTypes[i];
      const x = startX + this.padding + i * (this.itemSize + this.padding);
      const iy = y + this.padding;

      ctx.fillStyle = TILE_COLORS[tile][0];
      ctx.fillRect(x, iy, this.itemSize, this.itemSize);

      if (i === this.selected) {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(x - 1, iy - 1, this.itemSize + 2, this.itemSize + 2);
      }

      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(TILE_NAMES[tile], x + this.itemSize / 2, iy + this.itemSize - 4);
    }
  },
};

// プレイヤーがドアタイルの上にいるか判定
function isPlayerOnDoor() {
  const centerCol = Math.floor((player.x + player.size / 2) / TILE_SIZE);
  const centerRow = Math.floor((player.y + player.size / 2) / TILE_SIZE);
  return centerCol === gameMap.houseDoorCol && centerRow === gameMap.houseDoorRow;
}

// Iキーでインベントリ開閉、Cキーで錬成メニュー開閉、Escで各UI閉じる
document.addEventListener('keydown', (e) => {
  if (sleepState || currentScene === 'title') return;

  // Escキーで開いているUIを閉じる
  if (e.key === 'Escape') {
    if (cookingMenu.open) {
      cookingMenu.open = false;
      return;
    }
    if (storageBox.open) {
      storageBox.open = false;
      return;
    }
    if (craftingMenu.open) {
      craftingMenu.open = false;
      return;
    }
    if (inventory.open) {
      inventory.open = false;
      inventory.selectedSlot = -1;
      return;
    }
  }

  if (e.key === 'i' || e.key === 'I') {
    if (!craftingMenu.open && !storageBox.open && !cookingMenu.open) {
      inventory.toggle();
    }
  }
  if (e.key === 'c' || e.key === 'C') {
    if (!inventory.open && !storageBox.open && !cookingMenu.open) {
      craftingMenu.toggle();
    }
  }
});

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (currentScene !== 'world') return;

  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;

  if (blockBar.handleClick(screenX, screenY)) return;

  const worldX = screenX + camera.x;
  const worldY = screenY + camera.y;
  gameMap.placeBlock(worldX, worldY, blockBar.getSelectedTile());
});

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const screenX = e.clientX - rect.left;
  const screenY = e.clientY - rect.top;

  // タイトル画面のクリック処理
  if (currentScene === 'title') {
    handleTitleClick(screenX, screenY);
    return;
  }

  // 睡眠中はクリック無効
  if (sleepState) return;

  // セーブボタンのクリック判定
  const saveBtn = getSaveBtnRect();
  if (
    screenX >= saveBtn.x && screenX <= saveBtn.x + saveBtn.w &&
    screenY >= saveBtn.y && screenY <= saveBtn.y + saveBtn.h
  ) {
    saveGame();
    return;
  }

  // 料理UIが開いている場合
  if (cookingMenu.open) {
    cookingMenu.handleClick(screenX, screenY, canvas.width, canvas.height, inventory);
    return;
  }

  // 収納UIが開いている場合
  if (storageBox.open) {
    storageBox.handleClick(screenX, screenY, canvas.width, canvas.height, inventory);
    return;
  }

  // 錬成メニューが開いている場合
  if (craftingMenu.open) {
    craftingMenu.handleClick(screenX, screenY, canvas.width, canvas.height, inventory);
    return;
  }

  // インベントリが開いている場合
  if (inventory.open) {
    const result = inventory.handleClick(screenX, screenY, canvas.width, canvas.height, player.hunger, player.maxHunger);
    if (result && result.ate) {
      player.hunger = Math.min(player.maxHunger, player.hunger + result.hungerRestore);
      showRecovery(result.hungerRestore);
    }
    return;
  }

  // 室内シーンの場合
  if (currentScene === 'house') {
    if (houseScene.isKitchenClicked(screenX, screenY)) {
      // 調理台クリック → 料理UI表示
      cookingMenu.open = true;
      return;
    }
    if (houseScene.isStorageClicked(screenX, screenY)) {
      // 収納箱クリック → 収納UI表示
      storageBox.open = true;
      return;
    }
    if (houseScene.isBedClicked(screenX, screenY)) {
      // ベッドクリック → 睡眠開始
      startSleep(false);
      return;
    }
    if (houseScene.isExitClicked(screenX, screenY)) {
      // 出口クリック → 外へ出る（家の入口前に配置）
      currentScene = 'world';
      player.x = gameMap.houseDoorCol * TILE_SIZE;
      player.y = (gameMap.houseDoorRow + 1) * TILE_SIZE;
      player.targetX = player.x;
      player.targetY = player.y;
    }
    return;
  }

  // ワールドシーンの場合
  if (blockBar.handleClick(screenX, screenY)) return;

  const clickX = screenX + camera.x;
  const clickY = screenY + camera.y;

  // 敵をクリックした場合 → 攻撃
  const clickedEnemy = enemyManager.getEnemyAt(clickX, clickY);
  if (clickedEnemy) {
    // プレイヤーとの距離チェック（2タイル以内）
    const playerCX = player.x + player.size / 2;
    const playerCY = player.y + player.size / 2;
    const enemyCX = clickedEnemy.x + clickedEnemy.def.size / 2;
    const enemyCY = clickedEnemy.y + clickedEnemy.def.size / 2;
    const dist = Math.sqrt((playerCX - enemyCX) ** 2 + (playerCY - enemyCY) ** 2);

    if (dist <= PLAYER_ATTACK_RANGE) {
      const equippedItem = inventory.getEquippedItem();
      const result = enemyManager.playerAttack(clickedEnemy, equippedItem);
      if (result > 0) {
        // 剣を使用 → 耐久度消費
        inventory.reduceEquippedDurability();
      }
      if (result !== 0) {
        resourceManager.cancelGathering();
        return;
      }
    } else {
      // 遠い敵をクリック → 近づく
      player.setTarget(clickX, clickY, e.shiftKey);
      resourceManager.cancelGathering();
      return;
    }
  }

  // 資源をクリックした場合 → 採集モードへ
  const clickedResource = resourceManager.getResourceAt(clickX, clickY);
  if (clickedResource) {
    // 資源の隣に移動するターゲットを設定
    const targetX = clickedResource.x + TILE_SIZE / 2;
    const targetY = clickedResource.y + TILE_SIZE + player.size / 2;
    player.setTarget(targetX, targetY, e.shiftKey);
    // 装備中の道具を渡して採集開始
    const equippedTool = inventory.getEquippedItem();
    resourceManager.startGathering(clickedResource, equippedTool);
    return;
  }

  // クワ装備中に草タイルをクリック → 畑を耕す
  const equippedForTill = inventory.getEquippedItem();
  if (equippedForTill && equippedForTill.toolType === 'hoe') {
    const tileCol = Math.floor(clickX / TILE_SIZE);
    const tileRow = Math.floor(clickY / TILE_SIZE);
    const clickedTile = gameMap.getTile(tileCol, tileRow);

    if (clickedTile === TILE.GRASS) {
      // 資源がある場所は耕せない
      if (!resourceManager.isBlocked(tileCol * TILE_SIZE, tileRow * TILE_SIZE, 1)) {
        gameMap.setTile(tileCol, tileRow, TILE.FARMLAND);
        inventory.reduceEquippedDurability();
        // 耕した場所の近くに移動
        player.setTarget(clickX, clickY, e.shiftKey);
        resourceManager.cancelGathering();
        return;
      }
    } else if (clickedTile === TILE.FARMLAND) {
      // 既に畑
    } else if (clickedTile !== -1) {
      showWarning('草地にしか畑は作れません');
    }
  }

  // 収穫可能な作物をクリック → 収穫
  const harvestCol = Math.floor(clickX / TILE_SIZE);
  const harvestRow = Math.floor(clickY / TILE_SIZE);
  const harvestTile = gameMap.getTile(harvestCol, harvestRow);
  if (harvestTile === TILE.FARMLAND) {
    const cropAtClick = farmManager.getCropAt(harvestCol, harvestRow);
    if (cropAtClick && cropAtClick.growthStage === GROWTH_STAGE.HARVEST) {
      const harvestResult = farmManager.harvest(harvestCol, harvestRow);
      if (harvestResult) {
        const addedFood = inventory.addItem(harvestResult.foodId, harvestResult.foodCount);
        if (addedFood > 0) {
          const foodDef = ITEMS[harvestResult.foodId];
          showWarning(`${foodDef.name}を${addedFood}個収穫した！`);
        }
        // 種のドロップ
        if (harvestResult.seedId && harvestResult.seedCount > 0) {
          inventory.addItem(harvestResult.seedId, harvestResult.seedCount);
        }
        player.setTarget(clickX, clickY, e.shiftKey);
        resourceManager.cancelGathering();
        return;
      }
    }
  }

  // じょうろ装備中に作物タイルをクリック → 水やり
  if (equippedForTill && equippedForTill.toolType === 'watering_can') {
    const waterCol = Math.floor(clickX / TILE_SIZE);
    const waterRow = Math.floor(clickY / TILE_SIZE);
    const waterTile = gameMap.getTile(waterCol, waterRow);

    if (waterTile === TILE.FARMLAND) {
      const crop = farmManager.getCropAt(waterCol, waterRow);
      if (crop) {
        if (crop.watered) {
          showWarning('もう水やり済みです');
        } else {
          farmManager.waterCrop(waterCol, waterRow);
          player.setTarget(clickX, clickY, e.shiftKey);
          resourceManager.cancelGathering();
          return;
        }
      } else {
        showWarning('作物が植わっていません');
      }
    }
  }

  // 種を選択中に畑タイルをクリック → 種を植える
  const clickCol = Math.floor(clickX / TILE_SIZE);
  const clickRow = Math.floor(clickY / TILE_SIZE);
  const clickTile = gameMap.getTile(clickCol, clickRow);

  if (inventory.selectedSlot >= 0) {
    const selectedSlotData = inventory.slots[inventory.selectedSlot];
    if (selectedSlotData) {
      const selectedDef = ITEMS[selectedSlotData.itemId];
      if (selectedDef && selectedDef.type === 'seed') {
        if (clickTile === TILE.FARMLAND) {
          // 既に作物が植わっていないか確認
          if (farmManager.getCropAt(clickCol, clickRow)) {
            showWarning('ここには既に作物が植わっています');
          } else {
            farmManager.addCrop(clickCol, clickRow, selectedSlotData.itemId);
            inventory.removeItem(inventory.selectedSlot, 1);
            player.setTarget(clickX, clickY, e.shiftKey);
            resourceManager.cancelGathering();
            return;
          }
        } else if (clickTile !== -1) {
          showWarning('種は畑にしか植えられません');
        }
      }
    }
  }

  // 草タイルをクリック → 採集（30%で種をドロップ）
  if (clickTile === TILE.GRASS && !(equippedForTill && equippedForTill.toolType === 'hoe')) {
    // 資源がない草タイルのみ
    if (!resourceManager.isBlocked(clickCol * TILE_SIZE, clickRow * TILE_SIZE, 1)) {
      gameMap.setTile(clickCol, clickRow, TILE.DIRT);
      // 30%の確率でランダムな種をドロップ
      if (Math.random() < SEED_DROP_CHANCE) {
        const seedType = SEED_TYPES[Math.floor(Math.random() * SEED_TYPES.length)];
        const added = inventory.addItem(seedType, 1);
        if (added > 0) {
          const seedDef = ITEMS[seedType];
          showWarning(`${seedDef.name}を見つけた！`);
        }
      }
      player.setTarget(clickX, clickY, e.shiftKey);
      resourceManager.cancelGathering();
      return;
    }
  }

  // 通常クリック → 移動（採集キャンセル）
  resourceManager.cancelGathering();
  player.setTarget(clickX, clickY, e.shiftKey);
});

function gameLoop() {
  // タイトル画面
  if (currentScene === 'title') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawTitleScreen(ctx);
    requestAnimationFrame(gameLoop);
    return;
  }

  // 睡眠中は時間と空腹度を止める
  if (!sleepState) {
    timeManager.update();
  }

  // 毎朝6:00に水やり状態をリセット
  if (timeManager.getHour() >= 6 && timeManager.day > farmManager.lastResetDay) {
    farmManager.resetWatering(timeManager.day);
  }

  // 資源の再生（3日ごと）
  resourceManager.regenerateResources(timeManager.day);

  // 環境ダメージの判定（屋外のみ、睡眠中は除外）
  if (!sleepState) {
    const hour = timeManager.getHour();
    const isOutdoor = (currentScene === 'world');
    const isCold = isOutdoor && (hour >= 19 || hour < 6);
    const isHot = isOutdoor && (hour >= 11 && hour < 14);

    if (isCold) {
      envDamageType = 'cold';
      coldTimer++;
      if (coldTimer >= COLD_INTERVAL) {
        coldTimer = 0;
        player.health = Math.max(0, player.health - COLD_DAMAGE);
        damageFlashTimer = DAMAGE_FLASH_DURATION;
      }
    } else {
      coldTimer = 0;
    }

    if (isHot) {
      envDamageType = envDamageType || 'heat';
      heatTimer++;
      if (heatTimer >= HEAT_INTERVAL) {
        heatTimer = 0;
        player.health = Math.max(0, player.health - HEAT_DAMAGE);
        damageFlashTimer = DAMAGE_FLASH_DURATION;
      }
    } else {
      heatTimer = 0;
    }

    if (!isCold && !isHot) {
      envDamageType = null;
    }
  }

  if (currentScene === 'world') {
    if (!sleepState && !inventory.open && !craftingMenu.open && !storageBox.open && !cookingMenu.open) {
      player.update();

      // 採集の更新処理
      const gatherResult = resourceManager.updateGathering(player);
      if (gatherResult) {
        inventory.addItem(gatherResult.itemId, gatherResult.count);
        // 道具を使用した場合は耐久度を減らす
        if (gatherResult.usedTool) {
          inventory.reduceEquippedDurability();
        }
      }

      // 敵の更新
      enemyManager.update(player, timeManager, gameMap);

      // モンスターの攻撃判定
      const monsterDamage = enemyManager.checkMonsterAttacks(player);
      if (monsterDamage > 0) {
        player.health = Math.max(0, player.health - monsterDamage);
        damageFlashTimer = DAMAGE_FLASH_DURATION;
      }

      // ドロップアイテムの自動拾い
      const pickedItems = enemyManager.checkPickups(player, inventory);
      for (const picked of pickedItems) {
        const itemDef = ITEMS[picked.itemId];
        showWarning(`${itemDef.name}を${picked.count}個拾った！`);
      }

      // プレイヤーがドアタイルに乗ったら自動で室内へ
      if (isPlayerOnDoor()) {
        currentScene = 'house';
      }
    }
    camera.update(player);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(-camera.x, -camera.y);
    gameMap.draw(ctx);
    resourceManager.draw(ctx);
    farmManager.draw(ctx);
    enemyManager.draw(ctx);
    player.draw(ctx);
    // 装備中の道具をプレイヤーの横に表示
    drawEquippedToolIcon(ctx, player, inventory);
    ctx.restore();

    // 昼夜オーバーレイ（ワールド描画の後、UIの前）
    drawDayNightOverlay(ctx, timeManager);

    // 被ダメージ赤フラッシュ
    if (damageFlashTimer > 0) {
      damageFlashTimer--;
      const flashAlpha = 0.3 * (damageFlashTimer / DAMAGE_FLASH_DURATION);
      ctx.fillStyle = `rgba(255, 0, 0, ${flashAlpha})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    blockBar.draw(ctx);
    drawHealthGauge(ctx, player);
    drawHungerGauge(ctx, player);
    drawTimeDisplay(ctx, timeManager);
    drawSaveButton(ctx);
    drawEnvDamageWarning(ctx);
    drawOperationGuide(ctx);

    // チュートリアル更新・描画
    updateTutorial();
    drawTutorialMessage(ctx);

    // 回復エフェクトの表示（満腹度ゲージの横）
    if (recoveryTimer > 0) {
      recoveryTimer--;
      recoveryY += 0.5;
      const alpha = recoveryTimer / RECOVERY_DURATION;
      ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(recoveryText, HUD_X + HUD_BAR_WIDTH + 10, 52 - recoveryY);
    }

    // 警告メッセージの表示
    if (warningTimer > 0) {
      warningTimer--;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(canvas.width / 2 - 160, canvas.height / 2 - 20, 320, 40);
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(warningMessage, canvas.width / 2, canvas.height / 2 + 5);
    }

    // 空腹度ゼロ時に警告表示
    if (player.hunger <= 0 && !sleepState) {
      drawStarvingWarning(ctx);
    }

    // 体力ゼロで強制睡眠発動
    if (player.health <= 0 && !sleepState) {
      startSleep(true);
    }

    // インベントリUI
    inventory.draw(ctx, canvas.width, canvas.height);

    // 錬成メニューUI
    craftingMenu.draw(ctx, canvas.width, canvas.height, inventory);
  } else if (currentScene === 'house') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 室内シーンの描画
    houseScene.draw(ctx);

    // 室内でもHUDを表示
    drawHealthGauge(ctx, player);
    drawHungerGauge(ctx, player);
    drawTimeDisplay(ctx, timeManager);
    drawSaveButton(ctx);

    // 回復エフェクトの表示（室内でも）
    if (recoveryTimer > 0) {
      recoveryTimer--;
      recoveryY += 0.5;
      const alpha = recoveryTimer / RECOVERY_DURATION;
      ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
      ctx.font = 'bold 16px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(recoveryText, HUD_X + HUD_BAR_WIDTH + 10, 52 - recoveryY);
    }

    // インベントリUI
    inventory.draw(ctx, canvas.width, canvas.height);

    // 錬成メニューUI
    craftingMenu.draw(ctx, canvas.width, canvas.height, inventory);

    // 収納UI
    storageBox.draw(ctx, canvas.width, canvas.height, inventory);

    // 料理UI
    cookingMenu.draw(ctx, canvas.width, canvas.height, inventory);
  }

  // セーブメッセージ
  drawSaveMessage(ctx);

  // 睡眠演出（シーン描画の上に重ねる）
  if (sleepState) {
    updateAndDrawSleep(ctx);
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
console.log('ゲーム開始');
