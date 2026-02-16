// レシピ定義
const RECIPES = [
  // 木の道具
  { result: 'WOOD_AXE',     count: 1, materials: [{ itemId: 'WOOD', count: 5 }] },
  { result: 'WOOD_PICKAXE', count: 1, materials: [{ itemId: 'WOOD', count: 5 }] },
  { result: 'WOOD_HOE',     count: 1, materials: [{ itemId: 'WOOD', count: 5 }] },
  { result: 'WOOD_SWORD',   count: 1, materials: [{ itemId: 'WOOD', count: 8 }] },

  // 石の道具
  { result: 'STONE_AXE',     count: 1, materials: [{ itemId: 'STONE', count: 3 }, { itemId: 'WOOD', count: 2 }] },
  { result: 'STONE_PICKAXE', count: 1, materials: [{ itemId: 'STONE', count: 3 }, { itemId: 'WOOD', count: 2 }] },
  { result: 'STONE_HOE',     count: 1, materials: [{ itemId: 'STONE', count: 3 }, { itemId: 'WOOD', count: 2 }] },
  { result: 'STONE_SWORD',   count: 1, materials: [{ itemId: 'STONE', count: 5 }, { itemId: 'WOOD', count: 2 }] },

  // 鉄の道具
  { result: 'IRON_AXE',     count: 1, materials: [{ itemId: 'IRON', count: 3 }, { itemId: 'WOOD', count: 2 }] },
  { result: 'IRON_PICKAXE', count: 1, materials: [{ itemId: 'IRON', count: 3 }, { itemId: 'WOOD', count: 2 }] },
  { result: 'IRON_HOE',     count: 1, materials: [{ itemId: 'IRON', count: 3 }, { itemId: 'WOOD', count: 2 }] },
  { result: 'IRON_SWORD',   count: 1, materials: [{ itemId: 'IRON', count: 5 }, { itemId: 'WOOD', count: 2 }] },

  // 道具
  { result: 'WATERING_CAN', count: 1, materials: [{ itemId: 'IRON', count: 2 }, { itemId: 'WOOD', count: 3 }] },

  // 家具
  { result: 'STORAGE_BOX',  count: 1, materials: [{ itemId: 'WOOD', count: 10 }] },
];

// 錬成メニュー
class CraftingMenu {
  // レイアウト定数
  static PANEL_WIDTH = 480;
  static PANEL_HEIGHT = 370;
  static RECIPE_ROW_HEIGHT = 24;
  static RECIPE_LIST_WIDTH = 200;
  static PADDING = 12;
  static BUTTON_WIDTH = 120;
  static BUTTON_HEIGHT = 28;

  constructor() {
    this.open = false;
    this.selectedRecipe = 0;
  }

  // 開閉切り替え
  toggle() {
    this.open = !this.open;
    this.selectedRecipe = 0;
  }

  // パネル左上座標を取得
  getPanelOrigin(canvasWidth, canvasHeight) {
    return {
      x: Math.floor((canvasWidth - CraftingMenu.PANEL_WIDTH) / 2),
      y: Math.floor((canvasHeight - CraftingMenu.PANEL_HEIGHT) / 2),
    };
  }

  // レシピの素材が足りているか判定
  canCraft(recipe, inventory) {
    for (const mat of recipe.materials) {
      if (inventory.countItem(mat.itemId) < mat.count) {
        return false;
      }
    }
    // インベントリに空きがあるか確認
    if (inventory.isFull()) {
      // ただし結果アイテムがスタック可能で既存スロットに入る場合はOK
      const resultDef = ITEMS[recipe.result];
      if (resultDef && resultDef.stackable) {
        for (const slot of inventory.slots) {
          if (slot && slot.itemId === recipe.result && slot.count + recipe.count <= resultDef.maxStack) {
            return true;
          }
        }
      }
      return false;
    }
    return true;
  }

  // 錬成を実行する
  craft(recipe, inventory) {
    if (!this.canCraft(recipe, inventory)) return false;

    // 素材を消費
    for (const mat of recipe.materials) {
      inventory.consumeItem(mat.itemId, mat.count);
    }

    // 結果アイテムを追加
    inventory.addItem(recipe.result, recipe.count);
    return true;
  }

  // クリック処理
  handleClick(screenX, screenY, canvasWidth, canvasHeight, inventory) {
    if (!this.open) return false;

    const { x: px, y: py } = this.getPanelOrigin(canvasWidth, canvasHeight);
    const pad = CraftingMenu.PADDING;

    // パネル外クリック → 閉じる
    if (
      screenX < px || screenX > px + CraftingMenu.PANEL_WIDTH ||
      screenY < py || screenY > py + CraftingMenu.PANEL_HEIGHT
    ) {
      this.open = false;
      return true;
    }

    // レシピリストのクリック判定
    const listX = px + pad;
    const listY = py + 30;
    const listW = CraftingMenu.RECIPE_LIST_WIDTH;

    for (let i = 0; i < RECIPES.length; i++) {
      const ry = listY + i * CraftingMenu.RECIPE_ROW_HEIGHT;
      if (
        screenX >= listX && screenX <= listX + listW &&
        screenY >= ry && screenY <= ry + CraftingMenu.RECIPE_ROW_HEIGHT
      ) {
        this.selectedRecipe = i;
        return true;
      }
    }

    // 「錬成する」ボタンのクリック判定
    const btnX = px + CraftingMenu.PANEL_WIDTH - pad - CraftingMenu.BUTTON_WIDTH;
    const btnY = py + CraftingMenu.PANEL_HEIGHT - pad - CraftingMenu.BUTTON_HEIGHT;
    if (
      screenX >= btnX && screenX <= btnX + CraftingMenu.BUTTON_WIDTH &&
      screenY >= btnY && screenY <= btnY + CraftingMenu.BUTTON_HEIGHT
    ) {
      const recipe = RECIPES[this.selectedRecipe];
      if (recipe) {
        this.craft(recipe, inventory);
      }
      return true;
    }

    return true;
  }

  // 錬成メニューUIの描画
  draw(ctx, canvasWidth, canvasHeight, inventory) {
    if (!this.open) return;

    const { x: px, y: py } = this.getPanelOrigin(canvasWidth, canvasHeight);
    const pad = CraftingMenu.PADDING;

    // 背景パネル
    ctx.fillStyle = 'rgba(20, 15, 10, 0.9)';
    ctx.fillRect(px, py, CraftingMenu.PANEL_WIDTH, CraftingMenu.PANEL_HEIGHT);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, CraftingMenu.PANEL_WIDTH, CraftingMenu.PANEL_HEIGHT);

    // タイトル
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('錬成', px + CraftingMenu.PANEL_WIDTH / 2, py + 20);

    // 区切り線
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + pad + CraftingMenu.RECIPE_LIST_WIDTH + pad, py + 28);
    ctx.lineTo(px + pad + CraftingMenu.RECIPE_LIST_WIDTH + pad, py + CraftingMenu.PANEL_HEIGHT - pad - CraftingMenu.BUTTON_HEIGHT - 10);
    ctx.stroke();

    // レシピリスト描画
    this.drawRecipeList(ctx, px, py, pad, inventory);

    // 選択中のレシピ詳細描画
    this.drawRecipeDetail(ctx, px, py, pad, inventory);

    // 錬成ボタン描画
    this.drawCraftButton(ctx, px, py, pad, inventory);
  }

  // レシピリスト描画
  drawRecipeList(ctx, px, py, pad, inventory) {
    const listX = px + pad;
    const listY = py + 30;
    const listW = CraftingMenu.RECIPE_LIST_WIDTH;
    const rowH = CraftingMenu.RECIPE_ROW_HEIGHT;

    for (let i = 0; i < RECIPES.length; i++) {
      const recipe = RECIPES[i];
      const ry = listY + i * rowH;
      const resultDef = ITEMS[recipe.result];
      const craftable = this.canCraft(recipe, inventory);

      // 選択中の背景
      if (i === this.selectedRecipe) {
        ctx.fillStyle = 'rgba(139, 105, 20, 0.4)';
        ctx.fillRect(listX, ry, listW, rowH);
      }

      // レシピ名
      if (craftable) {
        ctx.fillStyle = '#fff';
      } else {
        ctx.fillStyle = '#666';
      }
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(resultDef.name, listX + 4, ry + rowH - 7);

      // 錬成可能マーク
      if (craftable) {
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(listX + listW - 12, ry + 8, 8, 8);
      }
    }
  }

  // レシピ詳細描画
  drawRecipeDetail(ctx, px, py, pad, inventory) {
    const recipe = RECIPES[this.selectedRecipe];
    if (!recipe) return;

    const resultDef = ITEMS[recipe.result];
    const detailX = px + pad + CraftingMenu.RECIPE_LIST_WIDTH + pad + 8;
    const detailY = py + 36;

    // 結果アイテム名
    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(resultDef.name, detailX, detailY);

    // 結果アイテムアイコン（簡易描画）
    const iconX = detailX;
    const iconY = detailY + 8;
    const iconSlot = { itemId: recipe.result, count: recipe.count };
    // Inventory の drawItemIcon を使いたいが static ではないため、簡易的に色だけ表示
    ctx.fillStyle = resultDef.color;
    ctx.fillRect(iconX, iconY, 40, 40);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    ctx.strokeRect(iconX, iconY, 40, 40);

    // 個数
    if (recipe.count > 1) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`×${recipe.count}`, iconX + 38, iconY + 36);
    }

    // 必要素材リスト
    ctx.fillStyle = '#ccc';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('必要素材:', detailX, iconY + 60);

    for (let i = 0; i < recipe.materials.length; i++) {
      const mat = recipe.materials[i];
      const matDef = ITEMS[mat.itemId];
      const have = inventory.countItem(mat.itemId);
      const enough = have >= mat.count;
      const my = iconY + 76 + i * 22;

      // 素材アイコン（小さい四角）
      ctx.fillStyle = matDef.color;
      ctx.fillRect(detailX, my, 14, 14);

      // 素材名と数量
      ctx.fillStyle = enough ? '#fff' : '#e74c3c';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `${matDef.name}  ${have}/${mat.count}`,
        detailX + 20,
        my + 11
      );
    }
  }

  // 錬成ボタン描画
  drawCraftButton(ctx, px, py, pad, inventory) {
    const recipe = RECIPES[this.selectedRecipe];
    const craftable = recipe && this.canCraft(recipe, inventory);

    const btnW = CraftingMenu.BUTTON_WIDTH;
    const btnH = CraftingMenu.BUTTON_HEIGHT;
    const btnX = px + CraftingMenu.PANEL_WIDTH - pad - btnW;
    const btnY = py + CraftingMenu.PANEL_HEIGHT - pad - btnH;

    // ボタン背景
    if (craftable) {
      ctx.fillStyle = '#27ae60';
    } else {
      ctx.fillStyle = '#444';
    }
    ctx.fillRect(btnX, btnY, btnW, btnH);

    // ボタン枠
    ctx.strokeStyle = craftable ? '#2ecc71' : '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    // ボタンテキスト
    ctx.fillStyle = craftable ? '#fff' : '#888';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('錬成する', btnX + btnW / 2, btnY + btnH - 8);
  }
}
