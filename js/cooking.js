// 料理レシピ定義
const COOKING_RECIPES = [
  { result: 'GRILLED_BEEF',    count: 1, materials: [{ itemId: 'BEEF', count: 1 }] },
  { result: 'GRILLED_CHICKEN', count: 1, materials: [{ itemId: 'CHICKEN_MEAT', count: 1 }] },
  { result: 'GRILLED_PORK',    count: 1, materials: [{ itemId: 'PORK', count: 1 }] },
  { result: 'VEGETABLE_SALAD', count: 1, materials: [{ itemId: 'TOMATO', count: 1 }, { itemId: 'EGGPLANT', count: 1 }] },
  { result: 'VEGETABLE_SOUP',  count: 1, materials: [{ itemId: 'PUMPKIN', count: 1 }, { itemId: 'CORN', count: 1 }] },
  { result: 'FRUIT_PLATTER',   count: 1, materials: [{ itemId: 'STRAWBERRY', count: 1 }, { itemId: 'CHERRY', count: 1 }, { itemId: 'PEACH', count: 1 }] },
  { result: 'SPECIAL_STEW',    count: 1, materials: [{ itemId: 'BEEF', count: 1 }, { itemId: 'PUMPKIN', count: 1 }, { itemId: 'TOMATO', count: 1 }] },
];

// 料理メニュー（錬成メニューと同様のレイアウト）
class CookingMenu {
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

  toggle() {
    this.open = !this.open;
    this.selectedRecipe = 0;
  }

  getPanelOrigin(canvasWidth, canvasHeight) {
    return {
      x: Math.floor((canvasWidth - CookingMenu.PANEL_WIDTH) / 2),
      y: Math.floor((canvasHeight - CookingMenu.PANEL_HEIGHT) / 2),
    };
  }

  // レシピの素材が足りているか判定
  canCook(recipe, inventory) {
    for (const mat of recipe.materials) {
      if (inventory.countItem(mat.itemId) < mat.count) {
        return false;
      }
    }
    if (inventory.isFull()) {
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

  // 料理を実行
  cook(recipe, inventory) {
    if (!this.canCook(recipe, inventory)) return false;

    for (const mat of recipe.materials) {
      inventory.consumeItem(mat.itemId, mat.count);
    }
    inventory.addItem(recipe.result, recipe.count);
    return true;
  }

  // クリック処理
  handleClick(screenX, screenY, canvasWidth, canvasHeight, inventory) {
    if (!this.open) return false;

    const { x: px, y: py } = this.getPanelOrigin(canvasWidth, canvasHeight);
    const pad = CookingMenu.PADDING;

    // パネル外クリック → 閉じる
    if (
      screenX < px || screenX > px + CookingMenu.PANEL_WIDTH ||
      screenY < py || screenY > py + CookingMenu.PANEL_HEIGHT
    ) {
      this.open = false;
      return true;
    }

    // レシピリストのクリック判定
    const listX = px + pad;
    const listY = py + 30;
    const listW = CookingMenu.RECIPE_LIST_WIDTH;

    for (let i = 0; i < COOKING_RECIPES.length; i++) {
      const ry = listY + i * CookingMenu.RECIPE_ROW_HEIGHT;
      if (
        screenX >= listX && screenX <= listX + listW &&
        screenY >= ry && screenY <= ry + CookingMenu.RECIPE_ROW_HEIGHT
      ) {
        this.selectedRecipe = i;
        return true;
      }
    }

    // 「料理する」ボタンのクリック判定
    const btnX = px + CookingMenu.PANEL_WIDTH - pad - CookingMenu.BUTTON_WIDTH;
    const btnY = py + CookingMenu.PANEL_HEIGHT - pad - CookingMenu.BUTTON_HEIGHT;
    if (
      screenX >= btnX && screenX <= btnX + CookingMenu.BUTTON_WIDTH &&
      screenY >= btnY && screenY <= btnY + CookingMenu.BUTTON_HEIGHT
    ) {
      const recipe = COOKING_RECIPES[this.selectedRecipe];
      if (recipe) {
        this.cook(recipe, inventory);
      }
      return true;
    }

    return true;
  }

  // 料理メニューUIの描画
  draw(ctx, canvasWidth, canvasHeight, inventory) {
    if (!this.open) return;

    const { x: px, y: py } = this.getPanelOrigin(canvasWidth, canvasHeight);
    const pad = CookingMenu.PADDING;

    // 背景パネル
    ctx.fillStyle = 'rgba(20, 15, 10, 0.9)';
    ctx.fillRect(px, py, CookingMenu.PANEL_WIDTH, CookingMenu.PANEL_HEIGHT);
    ctx.strokeStyle = '#d04030';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, CookingMenu.PANEL_WIDTH, CookingMenu.PANEL_HEIGHT);

    // タイトル
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('料理', px + CookingMenu.PANEL_WIDTH / 2, py + 20);

    // 区切り線
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + pad + CookingMenu.RECIPE_LIST_WIDTH + pad, py + 28);
    ctx.lineTo(px + pad + CookingMenu.RECIPE_LIST_WIDTH + pad, py + CookingMenu.PANEL_HEIGHT - pad - CookingMenu.BUTTON_HEIGHT - 10);
    ctx.stroke();

    // レシピリスト描画
    this.drawRecipeList(ctx, px, py, pad, inventory);

    // 選択中のレシピ詳細描画
    this.drawRecipeDetail(ctx, px, py, pad, inventory);

    // 料理ボタン描画
    this.drawCookButton(ctx, px, py, pad, inventory);
  }

  // レシピリスト描画
  drawRecipeList(ctx, px, py, pad, inventory) {
    const listX = px + pad;
    const listY = py + 30;
    const listW = CookingMenu.RECIPE_LIST_WIDTH;
    const rowH = CookingMenu.RECIPE_ROW_HEIGHT;

    for (let i = 0; i < COOKING_RECIPES.length; i++) {
      const recipe = COOKING_RECIPES[i];
      const ry = listY + i * rowH;
      const resultDef = ITEMS[recipe.result];
      const cookable = this.canCook(recipe, inventory);

      // 選択中の背景
      if (i === this.selectedRecipe) {
        ctx.fillStyle = 'rgba(208, 64, 48, 0.4)';
        ctx.fillRect(listX, ry, listW, rowH);
      }

      // レシピ名
      ctx.fillStyle = cookable ? '#fff' : '#666';
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(resultDef.name, listX + 4, ry + rowH - 7);

      // 料理可能マーク
      if (cookable) {
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(listX + listW - 12, ry + 8, 8, 8);
      }
    }
  }

  // レシピ詳細描画
  drawRecipeDetail(ctx, px, py, pad, inventory) {
    const recipe = COOKING_RECIPES[this.selectedRecipe];
    if (!recipe) return;

    const resultDef = ITEMS[recipe.result];
    const detailX = px + pad + CookingMenu.RECIPE_LIST_WIDTH + pad + 8;
    const detailY = py + 36;

    // 結果アイテム名
    ctx.fillStyle = '#e67e22';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(resultDef.name, detailX, detailY);

    // 結果アイテムアイコン
    const iconX = detailX;
    const iconY = detailY + 8;
    ctx.fillStyle = resultDef.color;
    ctx.fillRect(iconX, iconY, 40, 40);
    ctx.strokeStyle = '#d04030';
    ctx.lineWidth = 1;
    ctx.strokeRect(iconX, iconY, 40, 40);

    // 回復量表示
    ctx.fillStyle = '#2ecc71';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`回復: +${resultDef.hungerRestore}`, iconX + 48, iconY + 16);

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

      // 素材アイコン
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

  // 料理ボタン描画
  drawCookButton(ctx, px, py, pad, inventory) {
    const recipe = COOKING_RECIPES[this.selectedRecipe];
    const cookable = recipe && this.canCook(recipe, inventory);

    const btnW = CookingMenu.BUTTON_WIDTH;
    const btnH = CookingMenu.BUTTON_HEIGHT;
    const btnX = px + CookingMenu.PANEL_WIDTH - pad - btnW;
    const btnY = py + CookingMenu.PANEL_HEIGHT - pad - btnH;

    // ボタン背景
    ctx.fillStyle = cookable ? '#d04030' : '#444';
    ctx.fillRect(btnX, btnY, btnW, btnH);

    // ボタン枠
    ctx.strokeStyle = cookable ? '#e06050' : '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(btnX, btnY, btnW, btnH);

    // ボタンテキスト
    ctx.fillStyle = cookable ? '#fff' : '#888';
    ctx.font = 'bold 13px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('料理する', btnX + btnW / 2, btnY + btnH - 8);
  }
}
