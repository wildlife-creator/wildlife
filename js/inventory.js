// アイテム定義
const ITEMS = {
  // 資源
  WOOD:    { id: 'WOOD',    name: '木材',   type: 'resource', color: '#5c3a1e', stackable: true,  maxStack: 64 },
  STONE:   { id: 'STONE',   name: '石',     type: 'resource', color: '#888888', stackable: true,  maxStack: 64 },
  IRON:    { id: 'IRON',    name: '鉄',     type: 'resource', color: '#d4883c', stackable: true,  maxStack: 64 },
  DIRT:    { id: 'DIRT',    name: '土',     type: 'resource', color: '#8B7355', stackable: true,  maxStack: 64 },
  SAND:    { id: 'SAND',    name: '砂',     type: 'resource', color: '#d4b878', stackable: true,  maxStack: 64 },

  // 食べ物
  APPLE:   { id: 'APPLE',   name: 'りんご', type: 'food',     color: '#e74c3c', stackable: true,  maxStack: 16, hungerRestore: 10 },
  MEAT:    { id: 'MEAT',    name: '肉',     type: 'food',     color: '#c0392b', stackable: true,  maxStack: 16, hungerRestore: 25 },

  // 作物（収穫物）
  TOMATO:     { id: 'TOMATO',     name: 'トマト',       type: 'food', color: '#e74c3c', stackable: true, maxStack: 16, hungerRestore: 15 },
  PUMPKIN:    { id: 'PUMPKIN',    name: 'かぼちゃ',     type: 'food', color: '#e67e22', stackable: true, maxStack: 16, hungerRestore: 20 },
  EGGPLANT:   { id: 'EGGPLANT',   name: 'なす',         type: 'food', color: '#8e44ad', stackable: true, maxStack: 16, hungerRestore: 15 },
  STRAWBERRY: { id: 'STRAWBERRY', name: 'いちご',       type: 'food', color: '#e91e8c', stackable: true, maxStack: 16, hungerRestore: 10 },
  CHERRY:     { id: 'CHERRY',     name: 'さくらんぼ',   type: 'food', color: '#c0392b', stackable: true, maxStack: 16, hungerRestore: 8 },
  PEACH:      { id: 'PEACH',      name: 'もも',         type: 'food', color: '#f5b7b1', stackable: true, maxStack: 16, hungerRestore: 12 },
  CORN:       { id: 'CORN',       name: 'とうもろこし', type: 'food', color: '#f1c40f', stackable: true, maxStack: 16, hungerRestore: 18 },

  // 肉（生）
  BEEF:         { id: 'BEEF',         name: '牛肉', type: 'food', color: '#a93226', stackable: true, maxStack: 16, hungerRestore: 10 },
  CHICKEN_MEAT: { id: 'CHICKEN_MEAT', name: '鶏肉', type: 'food', color: '#f5b041', stackable: true, maxStack: 16, hungerRestore: 8 },
  PORK:         { id: 'PORK',         name: '豚肉', type: 'food', color: '#e8909e', stackable: true, maxStack: 16, hungerRestore: 10 },

  // 料理
  GRILLED_BEEF:    { id: 'GRILLED_BEEF',    name: '焼き牛肉',   type: 'food', color: '#7b241c', stackable: true, maxStack: 16, hungerRestore: 25 },
  GRILLED_CHICKEN: { id: 'GRILLED_CHICKEN', name: '焼き鶏肉',   type: 'food', color: '#b9770e', stackable: true, maxStack: 16, hungerRestore: 20 },
  GRILLED_PORK:    { id: 'GRILLED_PORK',    name: '焼き豚肉',   type: 'food', color: '#c0606e', stackable: true, maxStack: 16, hungerRestore: 25 },
  VEGETABLE_SALAD: { id: 'VEGETABLE_SALAD', name: '野菜サラダ',  type: 'food', color: '#27ae60', stackable: true, maxStack: 16, hungerRestore: 30 },
  VEGETABLE_SOUP:  { id: 'VEGETABLE_SOUP',  name: '野菜スープ',  type: 'food', color: '#e67e22', stackable: true, maxStack: 16, hungerRestore: 35 },
  FRUIT_PLATTER:   { id: 'FRUIT_PLATTER',   name: 'フルーツ盛り', type: 'food', color: '#e91e8c', stackable: true, maxStack: 16, hungerRestore: 35 },
  SPECIAL_STEW:    { id: 'SPECIAL_STEW',    name: '特製シチュー', type: 'food', color: '#8e44ad', stackable: true, maxStack: 16, hungerRestore: 50 },

  // 家具
  STORAGE_BOX: { id: 'STORAGE_BOX', name: '収納箱', type: 'furniture', color: '#8B6914', stackable: false, maxStack: 1 },

  // 斧（木/石/鉄）
  WOOD_AXE:  { id: 'WOOD_AXE',  name: '木の斧',   type: 'tool', toolType: 'axe',     color: '#5c3a1e', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 30,  efficiency: 1.0 },
  STONE_AXE: { id: 'STONE_AXE', name: '石の斧',   type: 'tool', toolType: 'axe',     color: '#888888', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 60,  efficiency: 1.5 },
  IRON_AXE:  { id: 'IRON_AXE',  name: '鉄の斧',   type: 'tool', toolType: 'axe',     color: '#d4883c', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 120, efficiency: 2.0 },

  // ツルハシ（木/石/鉄）
  WOOD_PICKAXE:  { id: 'WOOD_PICKAXE',  name: '木のツルハシ',   type: 'tool', toolType: 'pickaxe', color: '#5c3a1e', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 30,  efficiency: 1.0 },
  STONE_PICKAXE: { id: 'STONE_PICKAXE', name: '石のツルハシ',   type: 'tool', toolType: 'pickaxe', color: '#888888', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 60,  efficiency: 1.5 },
  IRON_PICKAXE:  { id: 'IRON_PICKAXE',  name: '鉄のツルハシ',   type: 'tool', toolType: 'pickaxe', color: '#d4883c', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 120, efficiency: 2.0 },

  // クワ（木/石/鉄）
  WOOD_HOE:  { id: 'WOOD_HOE',  name: '木のクワ',   type: 'tool', toolType: 'hoe',     color: '#5c3a1e', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 30,  efficiency: 1.0 },
  STONE_HOE: { id: 'STONE_HOE', name: '石のクワ',   type: 'tool', toolType: 'hoe',     color: '#888888', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 60,  efficiency: 1.5 },
  IRON_HOE:  { id: 'IRON_HOE',  name: '鉄のクワ',   type: 'tool', toolType: 'hoe',     color: '#d4883c', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 120, efficiency: 2.0 },

  // 剣（木/石/鉄）
  WOOD_SWORD:  { id: 'WOOD_SWORD',  name: '木の剣',   type: 'tool', toolType: 'sword',   color: '#5c3a1e', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 30,  efficiency: 1.0 },
  STONE_SWORD: { id: 'STONE_SWORD', name: '石の剣',   type: 'tool', toolType: 'sword',   color: '#888888', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 60,  efficiency: 1.5 },
  IRON_SWORD:  { id: 'IRON_SWORD',  name: '鉄の剣',   type: 'tool', toolType: 'sword',   color: '#d4883c', handleColor: '#8B6914', stackable: false, maxStack: 1, maxDurability: 120, efficiency: 2.0 },

  // じょうろ（耐久度無限）
  WATERING_CAN: { id: 'WATERING_CAN', name: 'じょうろ', type: 'tool', toolType: 'watering_can', color: '#3498db', handleColor: '#2980b9', stackable: false, maxStack: 1 },

  // 種
  TOMATO_SEED:    { id: 'TOMATO_SEED',    name: 'トマトの種',       type: 'seed', color: '#e74c3c', stackable: true, maxStack: 64 },
  PUMPKIN_SEED:   { id: 'PUMPKIN_SEED',   name: 'かぼちゃの種',     type: 'seed', color: '#e67e22', stackable: true, maxStack: 64 },
  EGGPLANT_SEED:  { id: 'EGGPLANT_SEED',  name: 'なすの種',         type: 'seed', color: '#8e44ad', stackable: true, maxStack: 64 },
  STRAWBERRY_SEED:{ id: 'STRAWBERRY_SEED', name: 'いちごの種',       type: 'seed', color: '#e91e8c', stackable: true, maxStack: 64 },
  CHERRY_SEED:    { id: 'CHERRY_SEED',    name: 'さくらんぼの種',   type: 'seed', color: '#c0392b', stackable: true, maxStack: 64 },
  PEACH_SEED:     { id: 'PEACH_SEED',     name: 'ももの種',         type: 'seed', color: '#f5b7b1', stackable: true, maxStack: 64 },
  CORN_SEED:      { id: 'CORN_SEED',      name: 'とうもろこしの種', type: 'seed', color: '#f1c40f', stackable: true, maxStack: 64 },
};

class Inventory {
  static MAX_SLOTS = 20;
  static COLS = 4;
  static ROWS = 5;
  static SLOT_SIZE = 48;
  static SLOT_PADDING = 4;

  constructor() {
    // スロット配列: { itemId: string, count: number, durability?: number } または null
    this.slots = new Array(Inventory.MAX_SLOTS).fill(null);
    this.selectedSlot = -1;
    this.equippedSlot = -1; // 装備中の道具スロット（-1で未装備）
    this.open = false;
    this.fullWarningTimer = 0;
    this.eatMessage = '';
    this.eatMessageTimer = 0;
  }

  // インベントリの開閉を切り替える
  toggle() {
    this.open = !this.open;
  }

  // アイテムを追加する。追加できた個数を返す
  addItem(itemId, count) {
    const itemDef = ITEMS[itemId];
    if (!itemDef) return 0;

    let remaining = count;

    // スタック可能なら既存スロットに積む
    if (itemDef.stackable) {
      for (let i = 0; i < this.slots.length && remaining > 0; i++) {
        const slot = this.slots[i];
        if (slot && slot.itemId === itemId && slot.count < itemDef.maxStack) {
          const space = itemDef.maxStack - slot.count;
          const toAdd = Math.min(remaining, space);
          slot.count += toAdd;
          remaining -= toAdd;
        }
      }
    }

    // 空きスロットに新規配置
    while (remaining > 0) {
      const emptyIndex = this.slots.indexOf(null);
      if (emptyIndex === -1) {
        // 満杯
        this.fullWarningTimer = 120;
        break;
      }
      const toAdd = Math.min(remaining, itemDef.maxStack);
      const slotData = { itemId, count: toAdd };
      // 道具の場合は耐久度を設定
      if (itemDef.type === 'tool') {
        slotData.durability = itemDef.maxDurability;
      }
      this.slots[emptyIndex] = slotData;
      remaining -= toAdd;
    }

    return count - remaining;
  }

  // 指定スロットからアイテムを消費する
  removeItem(slotIndex, count) {
    const slot = this.slots[slotIndex];
    if (!slot) return 0;

    const removed = Math.min(slot.count, count);
    slot.count -= removed;
    if (slot.count <= 0) {
      this.slots[slotIndex] = null;
      if (this.selectedSlot === slotIndex) {
        this.selectedSlot = -1;
      }
      if (this.equippedSlot === slotIndex) {
        this.equippedSlot = -1;
      }
    }
    return removed;
  }

  // 指定アイテムの合計所持数を返す
  countItem(itemId) {
    let total = 0;
    for (const slot of this.slots) {
      if (slot && slot.itemId === itemId) {
        total += slot.count;
      }
    }
    return total;
  }

  // 指定アイテムを合計count個消費する。消費できた数を返す
  consumeItem(itemId, count) {
    let remaining = count;
    for (let i = 0; i < this.slots.length && remaining > 0; i++) {
      const slot = this.slots[i];
      if (slot && slot.itemId === itemId) {
        const toRemove = Math.min(slot.count, remaining);
        slot.count -= toRemove;
        remaining -= toRemove;
        if (slot.count <= 0) {
          this.slots[i] = null;
          if (this.selectedSlot === i) this.selectedSlot = -1;
          if (this.equippedSlot === i) this.equippedSlot = -1;
        }
      }
    }
    return count - remaining;
  }

  // 満杯かどうか
  isFull() {
    return this.slots.every(slot => slot !== null);
  }

  // 選択中のスロットのアイテム定義を返す
  getSelectedItem() {
    if (this.selectedSlot < 0) return null;
    const slot = this.slots[this.selectedSlot];
    if (!slot) return null;
    return ITEMS[slot.itemId];
  }

  // 装備中の道具のアイテム定義を返す
  getEquippedItem() {
    if (this.equippedSlot < 0) return null;
    const slot = this.slots[this.equippedSlot];
    if (!slot) return null;
    return ITEMS[slot.itemId];
  }

  // 装備中の道具の耐久度を1減らす。壊れたらtrueを返す
  reduceEquippedDurability() {
    if (this.equippedSlot < 0) return false;
    const slot = this.slots[this.equippedSlot];
    if (!slot || slot.durability === undefined) return false;

    slot.durability--;
    if (slot.durability <= 0) {
      // 道具が壊れた
      this.slots[this.equippedSlot] = null;
      if (this.selectedSlot === this.equippedSlot) {
        this.selectedSlot = -1;
      }
      this.equippedSlot = -1;
      return true;
    }
    return false;
  }

  // クリック処理（スクリーン座標）。処理したらtrue、食べたら{ate, hungerRestore}を返す
  handleClick(screenX, screenY, canvasWidth, canvasHeight, playerHunger, playerMaxHunger) {
    if (!this.open) return false;

    const { x: gridX, y: gridY, totalW, totalH } = this.getGridOrigin(canvasWidth, canvasHeight);
    const slotStep = Inventory.SLOT_SIZE + Inventory.SLOT_PADDING;

    // 「食べる」ボタンのクリック判定
    const eatResult = this.handleEatButtonClick(screenX, screenY, canvasWidth, canvasHeight, playerHunger, playerMaxHunger);
    if (eatResult) return eatResult;

    // 装備スロットのクリック判定
    const equipSlotX = gridX + Inventory.COLS * slotStep + 12;
    const equipSlotY = gridY;
    if (
      screenX >= equipSlotX && screenX <= equipSlotX + Inventory.SLOT_SIZE &&
      screenY >= equipSlotY && screenY <= equipSlotY + Inventory.SLOT_SIZE
    ) {
      // 装備スロットクリック → 装備解除
      this.equippedSlot = -1;
      return true;
    }

    for (let r = 0; r < Inventory.ROWS; r++) {
      for (let c = 0; c < Inventory.COLS; c++) {
        const sx = gridX + c * slotStep;
        const sy = gridY + r * slotStep;
        if (
          screenX >= sx && screenX <= sx + Inventory.SLOT_SIZE &&
          screenY >= sy && screenY <= sy + Inventory.SLOT_SIZE
        ) {
          const index = r * Inventory.COLS + c;
          const slot = this.slots[index];

          // 既に選択中のスロットをもう一度クリック
          if (this.selectedSlot === index) {
            if (slot) {
              const itemDef = ITEMS[slot.itemId];
              // 道具なら装備/装備解除をトグル
              if (itemDef.type === 'tool') {
                this.equippedSlot = (this.equippedSlot === index) ? -1 : index;
              }
              // 食べ物ならダブルクリックで食べる
              if (itemDef.type === 'food') {
                const result = this.tryEat(index, playerHunger, playerMaxHunger);
                if (result) return result;
              }
            }
            this.selectedSlot = -1;
          } else {
            this.selectedSlot = index;
          }
          return true;
        }
      }
    }

    // グリッド外クリックで閉じる
    this.open = false;
    this.selectedSlot = -1;
    return true;
  }

  // 食べる処理。成功したら{ate, hungerRestore}を返す
  tryEat(slotIndex, playerHunger, playerMaxHunger) {
    if (playerHunger >= playerMaxHunger) {
      this.eatMessage = 'お腹がいっぱいです';
      this.eatMessageTimer = 90;
      return true;
    }
    const slot = this.slots[slotIndex];
    if (!slot) return null;
    const itemDef = ITEMS[slot.itemId];
    if (!itemDef || itemDef.type !== 'food') return null;

    const hungerRestore = itemDef.hungerRestore || 0;
    this.removeItem(slotIndex, 1);
    return { ate: true, hungerRestore };
  }

  // 「食べる」ボタンのクリック判定
  handleEatButtonClick(screenX, screenY, canvasWidth, canvasHeight, playerHunger, playerMaxHunger) {
    if (this.selectedSlot < 0) return null;
    const slot = this.slots[this.selectedSlot];
    if (!slot) return null;
    const itemDef = ITEMS[slot.itemId];
    if (!itemDef || itemDef.type !== 'food') return null;

    const btn = this.getEatButtonRect(canvasWidth, canvasHeight);
    if (
      screenX >= btn.x && screenX <= btn.x + btn.w &&
      screenY >= btn.y && screenY <= btn.y + btn.h
    ) {
      return this.tryEat(this.selectedSlot, playerHunger, playerMaxHunger);
    }
    return null;
  }

  // 「食べる」ボタンの矩形を返す
  getEatButtonRect(canvasWidth, canvasHeight) {
    const { x: gridX, y: gridY, totalW, totalH } = this.getGridOrigin(canvasWidth, canvasHeight);
    const slotStep = Inventory.SLOT_SIZE + Inventory.SLOT_PADDING;
    const equipX = gridX + Inventory.COLS * slotStep + 12;
    return {
      x: equipX,
      y: gridY + Inventory.SLOT_SIZE + 30,
      w: Inventory.SLOT_SIZE,
      h: 24,
    };
  }

  // グリッドの左上座標を計算
  getGridOrigin(canvasWidth, canvasHeight) {
    const slotStep = Inventory.SLOT_SIZE + Inventory.SLOT_PADDING;
    const totalW = Inventory.COLS * slotStep + Inventory.SLOT_PADDING;
    const totalH = Inventory.ROWS * slotStep + Inventory.SLOT_PADDING + 24; // +24はタイトル分
    // 装備スロット分を含めた全体幅で中央揃え
    const equipAreaW = 12 + Inventory.SLOT_SIZE + Inventory.SLOT_PADDING;
    const fullW = totalW + equipAreaW;
    return {
      x: Math.floor((canvasWidth - fullW) / 2) + Inventory.SLOT_PADDING,
      y: Math.floor((canvasHeight - totalH) / 2) + 24 + Inventory.SLOT_PADDING,
      totalW,
      totalH,
    };
  }

  // インベントリUIの描画
  draw(ctx, canvasWidth, canvasHeight) {
    if (!this.open) {
      // 満杯警告の表示（インベントリ閉じていても表示）
      if (this.fullWarningTimer > 0) {
        this.fullWarningTimer--;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(canvasWidth / 2 - 130, canvasHeight / 2 - 16, 260, 32);
        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('インベントリがいっぱいです！', canvasWidth / 2, canvasHeight / 2 + 5);
      }
      return;
    }

    const { x: gridX, y: gridY, totalW, totalH } = this.getGridOrigin(canvasWidth, canvasHeight);
    const slotStep = Inventory.SLOT_SIZE + Inventory.SLOT_PADDING;

    // 背景パネル
    const panelX = gridX - Inventory.SLOT_PADDING;
    const panelY = gridY - 24 - Inventory.SLOT_PADDING;
    ctx.fillStyle = 'rgba(20, 15, 10, 0.85)';
    ctx.fillRect(panelX, panelY, totalW, totalH);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(panelX, panelY, totalW, totalH);

    // タイトル
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('もちもの', panelX + totalW / 2, panelY + 18);

    // スロット描画
    for (let r = 0; r < Inventory.ROWS; r++) {
      for (let c = 0; c < Inventory.COLS; c++) {
        const index = r * Inventory.COLS + c;
        const sx = gridX + c * slotStep;
        const sy = gridY + r * slotStep;

        // スロット背景
        ctx.fillStyle = '#2a2520';
        ctx.fillRect(sx, sy, Inventory.SLOT_SIZE, Inventory.SLOT_SIZE);

        // 装備中ハイライト（黄色枠）
        if (index === this.equippedSlot) {
          ctx.strokeStyle = '#f1c40f';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx - 1, sy - 1, Inventory.SLOT_SIZE + 2, Inventory.SLOT_SIZE + 2);
        } else if (index === this.selectedSlot) {
          // 選択ハイライト
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx - 1, sy - 1, Inventory.SLOT_SIZE + 2, Inventory.SLOT_SIZE + 2);
        } else {
          ctx.strokeStyle = '#555';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, Inventory.SLOT_SIZE, Inventory.SLOT_SIZE);
        }

        // アイテム描画
        const slot = this.slots[index];
        if (slot) {
          const itemDef = ITEMS[slot.itemId];
          this.drawItemIcon(ctx, sx, sy, itemDef);

          // 個数（2個以上のみ表示）
          if (slot.count > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(
              String(slot.count),
              sx + Inventory.SLOT_SIZE - 3,
              sy + Inventory.SLOT_SIZE - 4
            );
          }

          // 道具の耐久度バー
          if (slot.durability !== undefined) {
            this.drawDurabilityBar(ctx, sx, sy, slot, itemDef);
          }
        }
      }
    }

    // 装備スロットの描画（グリッドの右横）
    this.drawEquipSlot(ctx, gridX, gridY, slotStep);

    // 選択中のアイテム名を下部に表示
    if (this.selectedSlot >= 0) {
      const slot = this.slots[this.selectedSlot];
      if (slot) {
        const itemDef = ITEMS[slot.itemId];
        let label = itemDef.name;
        // 道具なら「もう一度クリックで装備」ヒント
        if (itemDef.type === 'tool') {
          label += '（クリックで装備）';
        } else if (itemDef.type === 'food') {
          label += '（ダブルクリックで食べる）';
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(label, panelX + totalW / 2, panelY + totalH + 16);
      }
    }

    // 「食べる」ボタン描画
    this.drawEatButton(ctx, canvasWidth, canvasHeight);

    // 食べるメッセージ表示
    if (this.eatMessageTimer > 0) {
      this.eatMessageTimer--;
      ctx.fillStyle = '#ffcc00';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(this.eatMessage, canvasWidth / 2, canvasHeight / 2 - 40);
    }
  }

  // 装備スロットの描画
  drawEquipSlot(ctx, gridX, gridY, slotStep) {
    const equipX = gridX + Inventory.COLS * slotStep + 12;
    const equipY = gridY;

    // ラベル
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('装備', equipX + Inventory.SLOT_SIZE / 2, equipY - 6);

    // スロット背景
    ctx.fillStyle = '#2a2520';
    ctx.fillRect(equipX, equipY, Inventory.SLOT_SIZE, Inventory.SLOT_SIZE);
    ctx.strokeStyle = '#f1c40f';
    ctx.lineWidth = 2;
    ctx.strokeRect(equipX, equipY, Inventory.SLOT_SIZE, Inventory.SLOT_SIZE);

    // 装備中アイテム描画
    if (this.equippedSlot >= 0) {
      const slot = this.slots[this.equippedSlot];
      if (slot) {
        const itemDef = ITEMS[slot.itemId];
        this.drawItemIcon(ctx, equipX, equipY, itemDef);

        // 耐久度バー
        if (slot.durability !== undefined) {
          this.drawDurabilityBar(ctx, equipX, equipY, slot, itemDef);
        }

        // 道具名を下に表示
        ctx.fillStyle = '#ccc';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          itemDef.name,
          equipX + Inventory.SLOT_SIZE / 2,
          equipY + Inventory.SLOT_SIZE + 14
        );
      }
    }
  }

  // 耐久度バーの描画（スロット内下部）
  drawDurabilityBar(ctx, sx, sy, slot, itemDef) {
    const barW = Inventory.SLOT_SIZE - 6;
    const barH = 3;
    const barX = sx + 3;
    const barY = sy + Inventory.SLOT_SIZE - 6;
    const ratio = slot.durability / itemDef.maxDurability;

    // 背景
    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barW, barH);

    // ゲージ（残量で色を変える）
    if (ratio > 0.5) {
      ctx.fillStyle = '#2ecc71';
    } else if (ratio > 0.2) {
      ctx.fillStyle = '#f39c12';
    } else {
      ctx.fillStyle = '#e74c3c';
    }
    ctx.fillRect(barX, barY, barW * ratio, barH);
  }

  // アイテムアイコンのドット絵描画
  drawItemIcon(ctx, sx, sy, itemDef) {
    const cx = sx + Inventory.SLOT_SIZE / 2;
    const cy = sy + Inventory.SLOT_SIZE / 2;

    if (itemDef.type === 'resource') {
      // 資源: ブロック風の四角
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(sx + 8, sy + 8, 32, 32);
      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(sx + 8, sy + 8, 32, 8);
    } else if (itemDef.type === 'food') {
      // 食べ物: 丸型
      ctx.fillStyle = itemDef.color;
      ctx.beginPath();
      ctx.arc(cx, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (itemDef.type === 'tool') {
      this.drawToolIcon(ctx, sx, sy, itemDef);
    } else if (itemDef.type === 'seed') {
      // 種: 小さなしずく型
      ctx.fillStyle = itemDef.color;
      ctx.beginPath();
      ctx.arc(cx, cy + 4, 8, 0, Math.PI * 2);
      ctx.fill();
      // 上部の尖り
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy + 1);
      ctx.lineTo(cx, cy - 10);
      ctx.lineTo(cx + 5, cy + 1);
      ctx.closePath();
      ctx.fill();
      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx - 2, cy + 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (itemDef.type === 'furniture') {
      // 家具: 箱型
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(sx + 8, sy + 14, 32, 24);
      // 蓋
      ctx.fillStyle = '#a07818';
      ctx.fillRect(sx + 6, sy + 10, 36, 6);
      // 金具
      ctx.fillStyle = '#d4a830';
      ctx.fillRect(sx + 20, sy + 22, 8, 6);
    }
  }

  // 「食べる」ボタンの描画
  drawEatButton(ctx, canvasWidth, canvasHeight) {
    if (this.selectedSlot < 0) return;
    const slot = this.slots[this.selectedSlot];
    if (!slot) return;
    const itemDef = ITEMS[slot.itemId];
    if (!itemDef || itemDef.type !== 'food') return;

    const btn = this.getEatButtonRect(canvasWidth, canvasHeight);

    // ボタン背景
    ctx.fillStyle = '#e67e22';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.strokeStyle = '#f39c12';
    ctx.lineWidth = 2;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    // ボタンテキスト
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('食べる', btn.x + btn.w / 2, btn.y + btn.h - 6);
  }

  // 道具アイコンの描画（toolTypeに応じた形状）
  drawToolIcon(ctx, sx, sy, itemDef) {
    const cx = sx + Inventory.SLOT_SIZE / 2;
    const cy = sy + Inventory.SLOT_SIZE / 2;
    const handleColor = itemDef.handleColor || '#8B6914';

    if (itemDef.toolType === 'axe') {
      // 斧: 斜めの柄 + 刃
      ctx.fillStyle = handleColor;
      ctx.fillRect(cx - 2, cy - 4, 4, 20);
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 10, cy - 14, 12, 12);
      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(cx - 10, cy - 14, 12, 4);
    } else if (itemDef.toolType === 'pickaxe') {
      // ツルハシ: 柄 + 左右に尖った刃
      ctx.fillStyle = handleColor;
      ctx.fillRect(cx - 2, cy - 2, 4, 20);
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 12, cy - 14, 24, 8);
      ctx.fillRect(cx - 14, cy - 10, 4, 6);
      ctx.fillRect(cx + 10, cy - 10, 4, 6);
      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(cx - 12, cy - 14, 24, 3);
    } else if (itemDef.toolType === 'hoe') {
      // クワ: 柄 + L字型の刃
      ctx.fillStyle = handleColor;
      ctx.fillRect(cx - 2, cy - 2, 4, 20);
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 10, cy - 14, 14, 8);
      ctx.fillRect(cx - 10, cy - 8, 4, 6);
      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(cx - 10, cy - 14, 14, 3);
    } else if (itemDef.toolType === 'sword') {
      // 剣: 細長い刃 + 柄 + 鍔
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 2, cy - 16, 4, 18);
      // 鍔
      ctx.fillStyle = handleColor;
      ctx.fillRect(cx - 6, cy + 0, 12, 3);
      // 柄
      ctx.fillStyle = '#5a3825';
      ctx.fillRect(cx - 2, cy + 3, 4, 10);
      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillRect(cx - 1, cy - 14, 1, 14);
    } else if (itemDef.toolType === 'watering_can') {
      // じょうろ: 本体 + 注ぎ口 + 取っ手
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 8, cy - 6, 16, 16);
      // 注ぎ口
      ctx.fillRect(cx + 6, cy - 10, 4, 8);
      ctx.fillRect(cx + 8, cy - 12, 6, 3);
      // 取っ手
      ctx.fillStyle = handleColor;
      ctx.fillRect(cx - 10, cy - 10, 4, 4);
      ctx.fillRect(cx - 12, cy - 8, 4, 10);
      ctx.fillRect(cx - 10, cy, 4, 4);
      // ハイライト
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(cx - 6, cy - 4, 6, 4);
    }
  }
}
