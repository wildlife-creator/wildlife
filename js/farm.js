// 種の種類リスト（草から採集時のランダム選択用）
const SEED_TYPES = [
  'TOMATO_SEED', 'PUMPKIN_SEED', 'EGGPLANT_SEED',
  'STRAWBERRY_SEED', 'CHERRY_SEED', 'PEACH_SEED', 'CORN_SEED',
];

// 草採集時の種ドロップ確率
const SEED_DROP_CHANCE = 0.3;

// 種→作物（食べ物）の対応
const SEED_TO_FOOD = {
  TOMATO_SEED: 'TOMATO',
  PUMPKIN_SEED: 'PUMPKIN',
  EGGPLANT_SEED: 'EGGPLANT',
  STRAWBERRY_SEED: 'STRAWBERRY',
  CHERRY_SEED: 'CHERRY',
  PEACH_SEED: 'PEACH',
  CORN_SEED: 'CORN',
};

// 収穫時のドロップ設定
const HARVEST_DROP_MIN = 1;
const HARVEST_DROP_MAX = 3;
const HARVEST_SEED_CHANCE = 0.5; // 収穫時に種も得られる確率

// 成長段階の定数
const GROWTH_STAGE = {
  SPROUT: 0,    // 芽
  SEEDLING: 1,  // 苗
  GROWING: 2,   // 成長中
  HARVEST: 3,   // 収穫可能
};

// 作物データ
class Crop {
  constructor(col, row, seedType) {
    this.col = col;
    this.row = row;
    this.seedType = seedType;
    this.watered = false;
    this.growthStage = GROWTH_STAGE.SPROUT;
  }
}

// 農場マネージャー：作物の配置・管理・描画を担当
class FarmManager {
  constructor() {
    this.crops = [];
    this.lastResetDay = 0;
  }

  // 指定位置に作物を植える
  addCrop(col, row, seedType) {
    this.crops.push(new Crop(col, row, seedType));
  }

  // 指定位置に作物があるか返す
  getCropAt(col, row) {
    return this.crops.find(c => c.col === col && c.row === row) || null;
  }

  // 指定位置の作物に水やりする
  waterCrop(col, row) {
    const crop = this.getCropAt(col, row);
    if (crop) {
      crop.watered = true;
      return true;
    }
    return false;
  }

  // 指定位置の作物を除去する
  removeCrop(col, row) {
    this.crops = this.crops.filter(c => !(c.col === col && c.row === row));
  }

  // 収穫する。成功したら{foodId, foodCount, seedId?, seedCount?}を返す
  harvest(col, row) {
    const crop = this.getCropAt(col, row);
    if (!crop || crop.growthStage !== GROWTH_STAGE.HARVEST) return null;

    const foodId = SEED_TO_FOOD[crop.seedType];
    if (!foodId) return null;

    // 食べ物を1〜3個ドロップ
    const foodCount = HARVEST_DROP_MIN + Math.floor(Math.random() * (HARVEST_DROP_MAX - HARVEST_DROP_MIN + 1));

    // 50%の確率で種も1つドロップ
    let seedId = null;
    let seedCount = 0;
    if (Math.random() < HARVEST_SEED_CHANCE) {
      seedId = crop.seedType;
      seedCount = 1;
    }

    // 作物を除去
    this.removeCrop(col, row);

    return { foodId, foodCount, seedId, seedCount };
  }

  // 毎朝6:00: 成長判定 → 水やりリセット
  resetWatering(currentDay) {
    if (currentDay <= this.lastResetDay) return;
    this.lastResetDay = currentDay;

    for (const crop of this.crops) {
      // 前日に水やりされていたら成長を1段階進める
      if (crop.watered && crop.growthStage < GROWTH_STAGE.HARVEST) {
        crop.growthStage++;
      }
      crop.watered = false;
    }
  }

  // 全作物の描画（ワールド座標系で呼ばれる）
  draw(ctx) {
    for (const crop of this.crops) {
      if (crop.watered) {
        this.drawWateredOverlay(ctx, crop);
      }
      this.drawCrop(ctx, crop);
    }
  }

  // 水やり済み畑のオーバーレイ
  drawWateredOverlay(ctx, crop) {
    const x = crop.col * TILE_SIZE;
    const y = crop.row * TILE_SIZE;
    ctx.fillStyle = 'rgba(20, 10, 0, 0.35)';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }

  // 成長段階に応じた作物の描画
  drawCrop(ctx, crop) {
    switch (crop.growthStage) {
      case GROWTH_STAGE.SPROUT:
        this.drawStage0(ctx, crop);
        break;
      case GROWTH_STAGE.SEEDLING:
        this.drawStage1(ctx, crop);
        break;
      case GROWTH_STAGE.GROWING:
        this.drawStage2(ctx, crop);
        break;
      case GROWTH_STAGE.HARVEST:
        this.drawStage3(ctx, crop);
        break;
    }
  }

  // 段階0: 芽（小さな緑の点）
  drawStage0(ctx, crop) {
    const x = crop.col * TILE_SIZE;
    const y = crop.row * TILE_SIZE;

    // 小さな芽
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x + 14, y + 22, 4, 6);

    // 小さい葉
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x + 12, y + 20, 3, 3);
    ctx.fillRect(x + 17, y + 21, 3, 3);
  }

  // 段階1: 苗（小さな茎と葉）
  drawStage1(ctx, crop) {
    const x = crop.col * TILE_SIZE;
    const y = crop.row * TILE_SIZE;

    // 茎
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x + 15, y + 14, 2, 14);

    // 左の葉
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x + 10, y + 16, 6, 3);
    ctx.fillRect(x + 10, y + 14, 4, 2);

    // 右の葉
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x + 16, y + 18, 6, 3);
    ctx.fillRect(x + 18, y + 16, 4, 2);
  }

  // 段階2: 成長中（大きな茎と葉）
  drawStage2(ctx, crop) {
    const x = crop.col * TILE_SIZE;
    const y = crop.row * TILE_SIZE;

    // 太い茎
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x + 14, y + 8, 4, 22);

    // 左の葉（大きい）
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x + 6, y + 12, 10, 4);
    ctx.fillRect(x + 4, y + 10, 8, 3);

    // 右の葉（大きい）
    ctx.fillStyle = '#33d17a';
    ctx.fillRect(x + 16, y + 14, 10, 4);
    ctx.fillRect(x + 20, y + 12, 8, 3);

    // 上の小さい葉
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x + 10, y + 6, 6, 3);
    ctx.fillRect(x + 18, y + 8, 6, 3);
  }

  // 段階3: 収穫可能（実がなっている）
  drawStage3(ctx, crop) {
    const x = crop.col * TILE_SIZE;
    const y = crop.row * TILE_SIZE;
    const seedDef = ITEMS[crop.seedType];
    const fruitColor = seedDef ? seedDef.color : '#e74c3c';

    // 太い茎
    ctx.fillStyle = '#27ae60';
    ctx.fillRect(x + 14, y + 8, 4, 22);

    // 左の葉
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(x + 6, y + 14, 10, 4);
    ctx.fillRect(x + 4, y + 12, 8, 3);

    // 右の葉
    ctx.fillStyle = '#33d17a';
    ctx.fillRect(x + 16, y + 16, 10, 4);
    ctx.fillRect(x + 20, y + 14, 8, 3);

    // 作物ごとの実を描画
    this.drawFruit(ctx, x, y, crop.seedType, fruitColor);
  }

  // 作物の実の描画（種類別）
  drawFruit(ctx, x, y, seedType, color) {
    ctx.fillStyle = color;

    switch (seedType) {
      case 'TOMATO_SEED':
        // トマト: 赤い丸
        ctx.beginPath();
        ctx.arc(x + 16, y + 6, 6, 0, Math.PI * 2);
        ctx.fill();
        // ハイライト
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + 13, y + 2, 3, 3);
        // ヘタ
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x + 14, y + 0, 4, 3);
        break;

      case 'PUMPKIN_SEED':
        // かぼちゃ: オレンジの大きな丸
        ctx.fillRect(x + 8, y + 2, 16, 10);
        ctx.fillRect(x + 10, y + 0, 12, 12);
        // 筋
        ctx.fillStyle = '#cc6600';
        ctx.fillRect(x + 15, y + 1, 2, 10);
        // ヘタ
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x + 15, y - 2, 2, 4);
        break;

      case 'EGGPLANT_SEED':
        // なす: 紫の楕円
        ctx.fillRect(x + 12, y + 2, 8, 14);
        ctx.fillRect(x + 10, y + 4, 12, 10);
        // ハイライト
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(x + 11, y + 5, 3, 6);
        // ヘタ
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x + 12, y + 0, 8, 4);
        break;

      case 'STRAWBERRY_SEED':
        // いちご: 小さな赤い三角形風
        ctx.beginPath();
        ctx.moveTo(x + 16, y + 14);
        ctx.lineTo(x + 10, y + 4);
        ctx.lineTo(x + 22, y + 4);
        ctx.closePath();
        ctx.fill();
        // 種の点
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(x + 14, y + 7, 1, 1);
        ctx.fillRect(x + 17, y + 9, 1, 1);
        ctx.fillRect(x + 15, y + 11, 1, 1);
        // ヘタ
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x + 12, y + 2, 8, 3);
        break;

      case 'CHERRY_SEED':
        // さくらんぼ: 赤い小さな丸×2
        ctx.beginPath();
        ctx.arc(x + 12, y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 20, y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
        // ハイライト
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(x + 10, y + 8, 2, 2);
        ctx.fillRect(x + 18, y + 8, 2, 2);
        // 茎
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x + 12, y + 2, 2, 6);
        ctx.fillRect(x + 19, y + 3, 2, 5);
        ctx.fillRect(x + 13, y + 2, 7, 2);
        break;

      case 'PEACH_SEED':
        // もも: ピンクの丸
        ctx.beginPath();
        ctx.arc(x + 16, y + 7, 7, 0, Math.PI * 2);
        ctx.fill();
        // 割れ目ライン
        ctx.fillStyle = '#e8a0a0';
        ctx.fillRect(x + 15, y + 1, 2, 12);
        // ハイライト
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x + 12, y + 3, 3, 3);
        // 葉
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x + 18, y + 0, 6, 3);
        break;

      case 'CORN_SEED':
        // とうもろこし: 黄色の縦長
        ctx.fillRect(x + 12, y + 2, 8, 14);
        // 粒の模様
        ctx.fillStyle = '#e6b800';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(x + 13, y + 3 + i * 4, 2, 2);
          ctx.fillRect(x + 17, y + 5 + i * 4, 2, 2);
        }
        // 皮（緑）
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(x + 10, y + 10, 4, 8);
        ctx.fillRect(x + 18, y + 8, 4, 8);
        // ヒゲ
        ctx.fillStyle = '#c89810';
        ctx.fillRect(x + 14, y + 0, 2, 3);
        ctx.fillRect(x + 16, y + -1, 2, 3);
        break;
    }
  }
}
