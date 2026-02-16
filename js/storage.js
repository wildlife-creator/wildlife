// 収納箱クラス
class StorageBox {
  static MAX_SLOTS = 30;
  static COLS = 5;
  static ROWS = 6;
  static SLOT_SIZE = 44;
  static SLOT_PADDING = 4;
  static PANEL_GAP = 24; // 左右パネル間の隙間

  constructor() {
    // 収納スロット: { itemId, count, durability? } または null
    this.slots = new Array(StorageBox.MAX_SLOTS).fill(null);
    this.open = false;
  }

  // 開閉切り替え
  toggle() {
    this.open = !this.open;
  }

  // 収納箱にアイテムを追加する。追加できた個数を返す
  addItem(itemId, count, durability) {
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
      if (emptyIndex === -1) break; // 満杯
      const toAdd = Math.min(remaining, itemDef.maxStack);
      const slotData = { itemId, count: toAdd };
      if (durability !== undefined) {
        slotData.durability = durability;
      }
      this.slots[emptyIndex] = slotData;
      remaining -= toAdd;
    }

    return count - remaining;
  }

  // 指定スロットからアイテムを取り出す（スロットを空にする）
  takeSlot(slotIndex) {
    const slot = this.slots[slotIndex];
    if (!slot) return null;
    this.slots[slotIndex] = null;
    return slot;
  }

  // パネル全体のレイアウト計算
  getLayout(canvasWidth, canvasHeight) {
    const slotStep = StorageBox.SLOT_SIZE + StorageBox.SLOT_PADDING;

    // インベントリ側（左パネル）: 4列×5行
    const invCols = Inventory.COLS;
    const invRows = Inventory.ROWS;
    const invW = invCols * slotStep + StorageBox.SLOT_PADDING;
    const invH = invRows * slotStep + StorageBox.SLOT_PADDING;

    // 収納側（右パネル）: 5列×6行
    const stoCols = StorageBox.COLS;
    const stoRows = StorageBox.ROWS;
    const stoW = stoCols * slotStep + StorageBox.SLOT_PADDING;
    const stoH = stoRows * slotStep + StorageBox.SLOT_PADDING;

    // 全体サイズ（タイトルバー分 +30）
    const titleH = 30;
    const totalW = invW + StorageBox.PANEL_GAP + stoW;
    const totalH = Math.max(invH, stoH) + titleH;

    // 中央配置
    const panelX = Math.floor((canvasWidth - totalW) / 2);
    const panelY = Math.floor((canvasHeight - totalH) / 2);

    return {
      panelX, panelY, totalW, totalH, titleH,
      // インベントリグリッド左上
      invX: panelX,
      invY: panelY + titleH,
      invW, invH, invCols, invRows,
      // 収納グリッド左上
      stoX: panelX + invW + StorageBox.PANEL_GAP,
      stoY: panelY + titleH,
      stoW, stoH, stoCols, stoRows,
      slotStep,
    };
  }

  // クリック処理。処理したらtrueを返す
  handleClick(screenX, screenY, canvasWidth, canvasHeight, inventory) {
    if (!this.open) return false;

    const layout = this.getLayout(canvasWidth, canvasHeight);
    const { slotStep } = layout;

    // インベントリ側のクリック判定
    for (let r = 0; r < layout.invRows; r++) {
      for (let c = 0; c < layout.invCols; c++) {
        const sx = layout.invX + StorageBox.SLOT_PADDING + c * slotStep;
        const sy = layout.invY + StorageBox.SLOT_PADDING + r * slotStep;
        if (
          screenX >= sx && screenX <= sx + StorageBox.SLOT_SIZE &&
          screenY >= sy && screenY <= sy + StorageBox.SLOT_SIZE
        ) {
          // インベントリ→収納箱へ移動
          const index = r * layout.invCols + c;
          this.transferToStorage(inventory, index);
          return true;
        }
      }
    }

    // 収納側のクリック判定
    for (let r = 0; r < layout.stoRows; r++) {
      for (let c = 0; c < layout.stoCols; c++) {
        const sx = layout.stoX + StorageBox.SLOT_PADDING + c * slotStep;
        const sy = layout.stoY + StorageBox.SLOT_PADDING + r * slotStep;
        if (
          screenX >= sx && screenX <= sx + StorageBox.SLOT_SIZE &&
          screenY >= sy && screenY <= sy + StorageBox.SLOT_SIZE
        ) {
          // 収納箱→インベントリへ移動
          const index = r * layout.stoCols + c;
          this.transferToInventory(inventory, index);
          return true;
        }
      }
    }

    // パネル外クリック → 閉じる
    if (
      screenX < layout.panelX || screenX > layout.panelX + layout.totalW ||
      screenY < layout.panelY || screenY > layout.panelY + layout.totalH
    ) {
      this.open = false;
      return true;
    }

    return true; // パネル内の空白クリックも吸収
  }

  // インベントリのスロットから収納箱へ移動
  transferToStorage(inventory, invSlotIndex) {
    const slot = inventory.slots[invSlotIndex];
    if (!slot) return;

    // 装備中の道具は移動不可
    if (inventory.equippedSlot === invSlotIndex) return;

    const added = this.addItem(slot.itemId, slot.count, slot.durability);
    if (added > 0) {
      inventory.removeItem(invSlotIndex, added);
    }
  }

  // 収納箱のスロットからインベントリへ移動
  transferToInventory(inventory, stoSlotIndex) {
    const slot = this.slots[stoSlotIndex];
    if (!slot) return;

    const itemDef = ITEMS[slot.itemId];
    // 道具の場合は耐久度付きで直接空きスロットに入れる
    if (itemDef.type === 'tool' && slot.durability !== undefined) {
      const emptyIndex = inventory.slots.indexOf(null);
      if (emptyIndex === -1) return; // インベントリ満杯
      inventory.slots[emptyIndex] = { itemId: slot.itemId, count: 1, durability: slot.durability };
      this.slots[stoSlotIndex] = null;
    } else {
      const added = inventory.addItem(slot.itemId, slot.count);
      if (added > 0) {
        slot.count -= added;
        if (slot.count <= 0) {
          this.slots[stoSlotIndex] = null;
        }
      }
    }
  }

  // 収納UI全体の描画
  draw(ctx, canvasWidth, canvasHeight, inventory) {
    if (!this.open) return;

    const layout = this.getLayout(canvasWidth, canvasHeight);

    // 半透明の背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // パネル背景
    ctx.fillStyle = 'rgba(20, 15, 10, 0.92)';
    ctx.fillRect(layout.panelX, layout.panelY, layout.totalW, layout.totalH);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(layout.panelX, layout.panelY, layout.totalW, layout.totalH);

    // インベントリ側タイトル
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('もちもの', layout.invX + layout.invW / 2, layout.panelY + 20);

    // 収納側タイトル
    ctx.fillText('収納箱', layout.stoX + layout.stoW / 2, layout.panelY + 20);

    // 区切り線
    const dividerX = layout.invX + layout.invW + StorageBox.PANEL_GAP / 2;
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(dividerX, layout.panelY + layout.titleH - 4);
    ctx.lineTo(dividerX, layout.panelY + layout.totalH - 4);
    ctx.stroke();

    // インベントリスロット描画
    this.drawSlotGrid(ctx, layout.invX, layout.invY, layout.invCols, layout.invRows, layout.slotStep, inventory.slots, inventory);

    // 収納スロット描画
    this.drawSlotGrid(ctx, layout.stoX, layout.stoY, layout.stoCols, layout.stoRows, layout.slotStep, this.slots, null);
  }

  // スロットグリッドの描画
  drawSlotGrid(ctx, gridX, gridY, cols, rows, slotStep, slots, inventoryRef) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const index = r * cols + c;
        if (index >= slots.length) continue;

        const sx = gridX + StorageBox.SLOT_PADDING + c * slotStep;
        const sy = gridY + StorageBox.SLOT_PADDING + r * slotStep;

        // スロット背景
        ctx.fillStyle = '#2a2520';
        ctx.fillRect(sx, sy, StorageBox.SLOT_SIZE, StorageBox.SLOT_SIZE);

        // 装備中マーク（インベントリ側のみ）
        if (inventoryRef && inventoryRef.equippedSlot === index) {
          ctx.strokeStyle = '#f1c40f';
          ctx.lineWidth = 2;
          ctx.strokeRect(sx - 1, sy - 1, StorageBox.SLOT_SIZE + 2, StorageBox.SLOT_SIZE + 2);
        } else {
          ctx.strokeStyle = '#555';
          ctx.lineWidth = 1;
          ctx.strokeRect(sx, sy, StorageBox.SLOT_SIZE, StorageBox.SLOT_SIZE);
        }

        // アイテム描画
        const slot = slots[index];
        if (slot) {
          const itemDef = ITEMS[slot.itemId];
          this.drawItemIcon(ctx, sx, sy, itemDef);

          // 個数（2以上のみ）
          if (slot.count > 1) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(
              String(slot.count),
              sx + StorageBox.SLOT_SIZE - 3,
              sy + StorageBox.SLOT_SIZE - 4
            );
          }

          // 耐久度バー
          if (slot.durability !== undefined) {
            const barW = StorageBox.SLOT_SIZE - 6;
            const barH = 3;
            const barX = sx + 3;
            const barY = sy + StorageBox.SLOT_SIZE - 6;
            const ratio = slot.durability / itemDef.maxDurability;

            ctx.fillStyle = '#333';
            ctx.fillRect(barX, barY, barW, barH);

            if (ratio > 0.5) ctx.fillStyle = '#2ecc71';
            else if (ratio > 0.2) ctx.fillStyle = '#f39c12';
            else ctx.fillStyle = '#e74c3c';
            ctx.fillRect(barX, barY, barW * ratio, barH);
          }
        }
      }
    }
  }

  // アイテムアイコン描画（Inventoryのものと同じロジック）
  drawItemIcon(ctx, sx, sy, itemDef) {
    const cx = sx + StorageBox.SLOT_SIZE / 2;
    const cy = sy + StorageBox.SLOT_SIZE / 2;

    if (itemDef.type === 'resource') {
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(sx + 6, sy + 6, 32, 32);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(sx + 6, sy + 6, 32, 8);
    } else if (itemDef.type === 'food') {
      ctx.fillStyle = itemDef.color;
      ctx.beginPath();
      ctx.arc(cx, cy, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx - 3, cy - 3, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (itemDef.type === 'seed') {
      // 種: 小さなしずく型
      ctx.fillStyle = itemDef.color;
      ctx.beginPath();
      ctx.arc(cx, cy + 3, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy);
      ctx.lineTo(cx, cy - 9);
      ctx.lineTo(cx + 4, cy);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.arc(cx - 2, cy + 1, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (itemDef.type === 'tool') {
      this.drawToolIcon(ctx, sx, sy, itemDef);
    } else if (itemDef.type === 'furniture') {
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(sx + 6, sy + 12, 32, 22);
      ctx.fillStyle = '#a07818';
      ctx.fillRect(sx + 4, sy + 8, 36, 6);
      ctx.fillStyle = '#d4a830';
      ctx.fillRect(sx + 18, sy + 20, 8, 6);
    }
  }

  // 道具アイコン描画
  drawToolIcon(ctx, sx, sy, itemDef) {
    const cx = sx + StorageBox.SLOT_SIZE / 2;
    const cy = sy + StorageBox.SLOT_SIZE / 2;
    const handleColor = itemDef.handleColor || '#8B6914';

    if (itemDef.toolType === 'axe') {
      ctx.fillStyle = handleColor;
      ctx.fillRect(cx - 2, cy - 4, 4, 20);
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 10, cy - 14, 12, 12);
    } else if (itemDef.toolType === 'pickaxe') {
      ctx.fillStyle = handleColor;
      ctx.fillRect(cx - 2, cy - 2, 4, 20);
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 12, cy - 14, 24, 8);
      ctx.fillRect(cx - 14, cy - 10, 4, 6);
      ctx.fillRect(cx + 10, cy - 10, 4, 6);
    } else if (itemDef.toolType === 'hoe') {
      ctx.fillStyle = handleColor;
      ctx.fillRect(cx - 2, cy - 2, 4, 20);
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 10, cy - 14, 14, 8);
      ctx.fillRect(cx - 10, cy - 8, 4, 6);
    } else if (itemDef.toolType === 'sword') {
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 2, cy - 16, 4, 18);
      ctx.fillStyle = handleColor;
      ctx.fillRect(cx - 6, cy + 0, 12, 3);
      ctx.fillStyle = '#5a3825';
      ctx.fillRect(cx - 2, cy + 3, 4, 10);
    } else if (itemDef.toolType === 'watering_can') {
      // じょうろ
      ctx.fillStyle = itemDef.color;
      ctx.fillRect(cx - 8, cy - 6, 16, 16);
      ctx.fillRect(cx + 6, cy - 10, 4, 8);
      ctx.fillRect(cx + 8, cy - 12, 6, 3);
      ctx.fillStyle = handleColor;
      ctx.fillRect(cx - 10, cy - 10, 4, 4);
      ctx.fillRect(cx - 12, cy - 8, 4, 10);
      ctx.fillRect(cx - 10, cy, 4, 4);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(cx - 6, cy - 4, 6, 4);
    }
  }
}
