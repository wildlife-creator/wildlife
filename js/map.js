const TILE = {
  GRASS: 0,
  STONE: 1,
  DIRT: 2,
  SAND: 3,
  WOOD: 4,
  WALL: 5,
  ROOF: 6,
  DOOR: 7,
  FARMLAND: 8,
};

const TILE_COLORS = {
  [TILE.GRASS]: ['#4a8c2a', '#3f7a24', '#55a030', '#4d9428'],
  [TILE.STONE]: ['#888888', '#7a7a7a', '#969696', '#808080'],
  [TILE.DIRT]: ['#8B7355', '#7d6749', '#996b3d', '#8a6e50'],
  [TILE.SAND]: ['#d4b878', '#c8ac6c', '#dfc484', '#d0b070'],
  [TILE.WOOD]: ['#5c3a1e', '#4e3118', '#6b4424', '#573620'],
  [TILE.WALL]: ['#8B6914', '#7a5c10', '#9c7618', '#846312'],
  [TILE.ROOF]: ['#b03030', '#a02828', '#c03838', '#a83030'],
  [TILE.DOOR]: ['#5a3825', '#4e3118', '#5a3825', '#4e3118'],
  [TILE.FARMLAND]: ['#6b4a2a', '#5e4024', '#735030', '#634628'],
};

const TILE_NAMES = {
  [TILE.STONE]: '石',
  [TILE.DIRT]: '土',
  [TILE.SAND]: '砂',
  [TILE.GRASS]: '草',
  [TILE.WOOD]: '木',
  [TILE.WALL]: '壁',
  [TILE.ROOF]: '屋根',
  [TILE.DOOR]: '扉',
  [TILE.FARMLAND]: '畑',
};

// 通行不可タイルの集合
const SOLID_TILES = new Set([TILE.WALL, TILE.ROOF]);

const TILE_SIZE = 32;

class GameMap {
  constructor(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    this.tileSize = TILE_SIZE;
    this.width = cols * TILE_SIZE;
    this.height = rows * TILE_SIZE;
    this.tiles = [];

    for (let r = 0; r < rows; r++) {
      this.tiles[r] = [];
      for (let c = 0; c < cols; c++) {
        this.tiles[r][c] = TILE.GRASS;
      }
    }

    // 初期の家を配置
    this.placeHouse();
  }

  getTile(col, row) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return -1;
    return this.tiles[row][col];
  }

  setTile(col, row, tile) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) return;
    this.tiles[row][col] = tile;
  }

  placeBlock(worldX, worldY, tileType) {
    const col = Math.floor(worldX / this.tileSize);
    const row = Math.floor(worldY / this.tileSize);
    if (this.getTile(col, row) === -1) return;

    if (this.tiles[row][col] === tileType) {
      this.tiles[row][col] = TILE.GRASS;
    } else {
      this.tiles[row][col] = tileType;
    }
  }

  // 指定タイルが通行不可かどうか
  isSolid(col, row) {
    const tile = this.getTile(col, row);
    if (tile === -1) return true; // 範囲外は通行不可
    return SOLID_TILES.has(tile);
  }

  // ワールド座標で衝突判定（矩形の四隅をチェック）
  isBlocked(x, y, size) {
    const left = Math.floor(x / this.tileSize);
    const right = Math.floor((x + size - 1) / this.tileSize);
    const top = Math.floor(y / this.tileSize);
    const bottom = Math.floor((y + size - 1) / this.tileSize);

    for (let r = top; r <= bottom; r++) {
      for (let c = left; c <= right; c++) {
        if (this.isSolid(c, r)) return true;
      }
    }
    return false;
  }

  // マップ中央付近に家を配置する
  placeHouse() {
    // 家の左上をマップ中央から少し左上にオフセット
    const startCol = Math.floor(this.cols / 2) - 2;
    const startRow = Math.floor(this.rows / 2) - 4;

    // 家のレイアウト（5列×5行）
    // R=屋根, W=壁, D=入口(ドア), .=床(草のまま)
    const layout = [
      ['R', 'R', 'R', 'R', 'R'],  // 屋根
      ['W', '.', '.', '.', 'W'],  // 壁＋内部
      ['W', '.', '.', '.', 'W'],  // 壁＋内部
      ['W', '.', '.', '.', 'W'],  // 壁＋内部
      ['W', 'W', 'D', 'W', 'W'],  // 壁＋入口
    ];

    const tileMap = {
      'R': TILE.ROOF,
      'W': TILE.WALL,
      'D': TILE.DOOR,
    };

    for (let r = 0; r < layout.length; r++) {
      for (let c = 0; c < layout[r].length; c++) {
        const symbol = layout[r][c];
        if (symbol !== '.') {
          this.setTile(startCol + c, startRow + r, tileMap[symbol]);
        }
      }
    }

    // 家の位置情報を保存（後のチケットで使う）
    this.houseCol = startCol;
    this.houseRow = startRow;
    this.houseDoorCol = startCol + 2;
    this.houseDoorRow = startRow + 4;
  }

  draw(ctx) {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = c * this.tileSize;
        const y = r * this.tileSize;

        const tile = this.tiles[r][c];
        const colors = TILE_COLORS[tile];
        ctx.fillStyle = colors[(r + c) % colors.length];

        ctx.fillRect(x, y, this.tileSize, this.tileSize);

        // 畑タイルの横線模様（耕された土の表現）
        if (tile === TILE.FARMLAND) {
          ctx.fillStyle = '#4a3018';
          for (let i = 0; i < 4; i++) {
            ctx.fillRect(x + 2, y + 4 + i * 8, this.tileSize - 4, 2);
          }
        }
      }
    }
  }
}
