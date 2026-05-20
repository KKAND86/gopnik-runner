/**
 * SpriteGenerator — детальная пиксельная графика
 * Каждый спрайт — массив строк, где символ = пиксель цвета
 * Размер: 1 символ = 1 пиксель, потом масштабируется через setDisplaySize
 */

// Палитра пиксельных цветов
const PALETTE = {
  '.': null,          // transparent
  'k': '#0a0a0a',     // black (куртка, кепка)
  'w': '#ffffff',     // white (полоски)
  'b': '#2d4a8a',     // blue (джинсы)
  'B': '#1a3a7a',     // dark blue (тень джинс)
  's': '#555555',     // grey (бочка)
  'S': '#888888',     // light grey
  'r': '#8b4513',     // brown (ящик)
  'R': '#a0522d',     // light brown
  'g': '#2ecc71',     // green
  'y': '#f1c40f',     // yellow (монетка)
  'Y': '#ffdd00',     // bright yellow
  'o': '#e67e22',     // orange
  'c': '#3498db',     // cyan (лужа)
  'C': '#5dade2',     // light cyan
  'p': '#ff69b4',     // pink
  'm': '#8b0000',     // dark red
  'd': '#dddddd',     // light grey
  'D': '#aaaaaa',     // mid grey
  'h': '#5d4037',     // dark brown
  'f': '#f5deb3',     // skin
  'F': '#eec090',     // darker skin
  'a': '#aaaaaa',     // asphalt grey
  'A': '#999999',     // asphalt dark
  'l': '#cc0000',     // red (кепка гопника)
  'e': '#eeeeee',     // phone screen
  'n': '#2c3e50',     // nokia body
  'N': '#34495e',     // nokia dark
  'v': '#8e44ad',     // violet (балалайка)
  'z': '#95a5a6',     // bottle (кефир)
  'Z': '#7f8c8d',     // bottle shadow
  'x': '#e74c3c',     // label red
};

// ==================== PLAYER (12x20) ====================
const PLAYER_RUN1 = [
  '....kkkk....',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '....bbbb....',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '....bbbb....',
  '....bbbb....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
];

const PLAYER_RUN2 = [
  '....kkkk....',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '....bbbb....',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '....bbbb....',
  '....bbbb....',
  '....kk......',
  '....kkk.....',
  '....kk......',
  '...kkk......',
  '...kkk......',
];

const PLAYER_RUN3 = [
  '....kkkk....',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '....bbbb....',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '....bbbb....',
  '....bbbb....',
  '......kk....',
  '.....kkk....',
  '......kk....',
  '......kkk...',
  '......kkk...',
];

const PLAYER_RUN4 = [
  '....kkkk....',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '....bbbb....',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '....bbbb....',
  '....bbbb....',
  '...kkkk.....',
  '...kkkk.....',
  '...kkkk.....',
  '...kkkk.....',
  '...kkkk.....',
];

const PLAYER_JUMP = [
  '....kkkk....',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '....bbbb....',
  '...bbbbbb...',
  '...bbbbbb...',
  '....bbbb....',
  '....bbbb....',
  '....bbbb....',
  '...bbbbbb...',
  '...kkkkk....',
  '...kkkkk....',
  '...kkkkk....',
  '...kkkkk....',
  '...kkkkk....',
];

const PLAYER_DEAD = [
  '....kkkk....',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '...kkkkkk...',
  '...kwwwwk...',
  '...kwwwwk...',
  '...kkkkkk...',
  '....bbbb....',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '....bbbb....',
  '....bbbb....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
];

// ==================== GOPNIK (12x20) — красная кепка ====================
const GOPNIK_RUN1 = [
  '....llll....',
  '...llllll...',
  '...llllll...',
  '...llllll...',
  '...llllll...',
  '...llllll...',
  '...llllll...',
  '...llllll...',
  '....bbbb....',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '....bbbb....',
  '....bbbb....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
];

const GOPNIK_RUN2 = [
  '....llll....',
  '...llllll...',
  '...llllll...',
  '...llllll...',
  '...llllll...',
  '...llllll...',
  '...llllll...',
  '...llllll...',
  '....bbbb....',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '...bbbbbb...',
  '....bbbb....',
  '....bbbb....',
  '....kk......',
  '....kkk.....',
  '....kk......',
  '...kkk......',
  '...kkk......',
];

// ==================== COIN (16x16) ====================
const COIN = [
  '.....yyyyy.....',
  '...yyyyyyyyy...',
  '..yyyyyyyyyyy..',
  '.yyyyyyyyyyyyy.',
  '.yyWWWWWWWWyyy.',
  '.yyWyyWWyyWyyy.',
  'yyyyWyyWWyyWyyy',
  'yyyyWyyWWyyWyyy',
  'yyyyWyyWWyyWyyy',
  'yyyyWyyWWyyWyyy',
  'yyyyWyyyyyyWyyy',
  '.yyWyyyyyyyyWyy',
  '.yyyyyyyyyyyyy.',
  '..yyyyyyyyyyy..',
  '...yyyyyyyyy...',
  '.....yyyyy.....',
];

// ==================== PUDDLE (24x8) ====================
const PUDDLE = [
  '..cccccccccccccccccc..',
  '.cccccccccccccccccccc.',
  'ccccccCCCcccccccCCCccc',
  'cccccCCCCCcccccCCCCCcc',
  'cccccCCCCCcccccCCCCCcc',
  'ccccccCCCcccccccCCCccc',
  '.cccccccccccccccccccc.',
  '..cccccccccccccccccc..',
];

// ==================== BOX (20x20) ====================
const BOX = [
  'rrrrrrrrrrrrrrrrrrrr',
  'rrRRRRRRRRRRRRRRRRrr',
  'rrRrrrrrrrrrrrrrrRrr',
  'rrRrRRRRRRRRRRRRrRrr',
  'rrRrRrrrrrrrrrrRrRrr',
  'rrRrRrrrrrrrrrrRrRrr',
  'rrRrRrrrrrrrrrrRrRrr',
  'rrRrRrrrrrrrrrrRrRrr',
  'rrRrRrrrrrrrrrrRrRrr',
  'rrRrRRRRRRRRRRRRrRrr',
  'rrRrRrrrrrrrrrrRrRrr',
  'rrRrRrrrrrrrrrrRrRrr',
  'rrRrRrrrrrrrrrrRrRrr',
  'rrRrRrrrrrrrrrrRrRrr',
  'rrRrRrrrrrrrrrrRrRrr',
  'rrRrRRRRRRRRRRRRrRrr',
  'rrRrrrrrrrrrrrrrrRrr',
  'rrRRRRRRRRRRRRRRRRrr',
  'rrrrrrrrrrrrrrrrrrrr',
  'rrrrrrrrrrrrrrrrrrrr',
];

// ==================== BARREL (16x24) ====================
const BARREL = [
  '....ssssssss....',
  '...ssSSSSSSss...',
  '..ssSSSSSSSSss..',
  '.ssSSSSSSSSSSss.',
  '.ssSSSSSSSSSSss.',
  'ssSSSSSSSSSSSSss',
  'ssSSSSSSSSSSSSss',
  'ssSSSSSSSSSSSSss',
  'ssSSSSSSSSSSSSss',
  '.ssSSSSSSSSSSss.',
  '.ssSSSSSSSSSSss.',
  '..ssSSSSSSSSss..',
  '..ssSSSSSSSSss..',
  '..ssSSSSSSSSss..',
  '..ssSSSSSSSSss..',
  '.ssSSSSSSSSSSss.',
  '.ssSSSSSSSSSSss.',
  'ssSSSSSSSSSSSSss',
  'ssSSSSSSSSSSSSss',
  'ssSSSSSSSSSSSSss',
  'ssSSSSSSSSSSSSss',
  '.ssSSSSSSSSSSss.',
  '.ssSSSSSSSSSSss.',
  '...ssssssssss...',
];

// ==================== WALL/CRATE (20x28) ====================
const WALL = [
  'hhhhhhhhhhhhhhhhhhhh',
  'hHHHHHHHHHHHHHHHHHhh',
  'hHhhhhhhhhhhhhhhhHhh',
  'hHhHHHHHHHHHHHHHhHhh',
  'hHhHhhhhhhhhhhhHhHhh',
  'hHhHhHHHHHHHHHhHhHhh',
  'hHhHhHhhhhhhhHhHhHhh',
  'hHhHhHhhhhhhhHhHhHhh',
  'hHhHhHHHHHHHHHhHhHhh',
  'hHhHhhhhhhhhhhhHhHhh',
  'hHhHHHHHHHHHHHHHhHhh',
  'hHhhhhhhhhhhhhhhhHhh',
  'hHHHHHHHHHHHHHHHHHhh',
  'hhhhhhhhhhhhhhhhhhhh',
  'hhhhhhhhhhhhhhhhhhhh',
  'hHHHHHHHHHHHHHHHHHhh',
  'hHhhhhhhhhhhhhhhhHhh',
  'hHhHHHHHHHHHHHHHhHhh',
  'hHhHhhhhhhhhhhhHhHhh',
  'hHhHhhhhhhhhhhhHhHhh',
  'hHhHHHHHHHHHHHHHhHhh',
  'hHhhhhhhhhhhhhhhhHhh',
  'hHHHHHHHHHHHHHHHHHhh',
  'hhhhhhhhhhhhhhhhhhhh',
  'hhhhhhhhhhhhhhhhhhhh',
  'hhhhhhhhhhhhhhhhhhhh',
  'hhhhhhhhhhhhhhhhhhhh',
  'hhhhhhhhhhhhhhhhhhhh',
];

// ==================== KEFIR (12x20) ====================
const KEFIR = [
  '....zzzzzz....',
  '...zzzzzzzz...',
  '..zzzzzzzzzz..',
  '..zzzzzzzzzz..',
  '.zzzzzzzzzzzz.',
  '.zzzzzzzzzzzz.',
  '.zzzzzzzzzzzz.',
  '.zzxxxxxxxxz.',
  '.zzxxxxxxxxz.',
  '.zzzzzzzzzzzz.',
  '.zzzzzzzzzzzz.',
  '.zzzzzzzzzzzz.',
  '.zzzzzzzzzzzz.',
  '..zzzzzzzzzz..',
  '..zzzzzzzzzz..',
  '..zzzzzzzzzz..',
  '...zzzzzzzz...',
  '...zzzzzzzz...',
  '....zzzzzz....',
  '......zz......',
];

// ==================== NOKIA 3310 (12x20) ====================
const NOKIA = [
  '..............',
  '.....nnnnn....',
  '....nnnnnnn...',
  '...nnnnnnnnn..',
  '...nnnnnnnnn..',
  '...nneeeeeen..',
  '...nneeeeeen..',
  '...nneeeeeen..',
  '...nneeeeeen..',
  '...nneeeeeen..',
  '...nneeeeeen..',
  '...nneeeeeen..',
  '...nneeeeeen..',
  '...nneeeeeen..',
  '...nnnnnnnnn..',
  '...nnnnnnnnn..',
  '...nnnnnnnnn..',
  '....nnnnnnn...',
  '.....nnnnn....',
  '..............',
];

// ==================== MAMA WITH BROOM (16x24) ====================
const MAMA = [
  '......pppp......',
  '.....pppppp.....',
  '.....pppppp.....',
  '......pppp......',
  '......ffff......',
  '.....ffffff.....',
  '....ffffffffff..',
  '...fffffffffff..',
  '...fffffffffff..',
  '....ffffffffff..',
  '.....ffffff.....',
  '......ffff......',
  '......hhhh......',
  '.....hhhhhh.....',
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '..hhhhhhhhhhhh..',
  '.......hh.......',
  '.......hh.......',
  '.......hh.......',
  '.......hh.......',
  '.......hh.......',
  '.......hh.......',
  '.......hh.......',
];

// ==================== MAGNET (16x20) ====================
const MAGNET = [
  '................',
  '.....mmmmmm.....',
  '....mmmmmmmm....',
  '...mmmmmmmmmm...',
  '...mm......mm...',
  '...mm......mm...',
  '...mm......mm...',
  '...mmmmmmmmmm...',
  '....mmmmmmmm....',
  '.....mmmmmm.....',
  '......mmmm......',
  '......mmmm......',
  '......mmmm......',
  '......mmmm......',
  '......mmmm......',
  '......mmmm......',
  '......mmmm......',
  '......mmmm......',
  '......mmmm......',
  '................',
];

// ==================== GROUND TEXTURE (32x8 tile) ====================
const GROUND_TILE = [
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'aAaaAaaAaaAaaAaaAaaAaaAaaAaaAaaA',
  'aaAaaAaaAaaAaaAaaAaaAaaAaaAaaAa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  'aAaaAaaAaaAaaAaaAaaAaaAaaAaaAaaA',
  'aaAaaAaaAaaAaaAaaAaaAaaAaaAaaAa',
];

// ==================== BUILDING (32x48) ====================
const BUILDING = [
  '.................................',
  '.................................',
  '..........dddddddddd.............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........ddeddddedddd............',
  '.........ddeddddedddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........ddeddddedddd............',
  '.........ddeddddedddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........ddeddddedddd............',
  '.........ddeddddedddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '.........dddddddddddd............',
  '..........dddddddddd.............',
  '.................................',
];

// ==================== CLOUD (32x12) ====================
const CLOUD = [
  '................................',
  '..........dddddddddd............',
  '.......dddddddddddddddd.........',
  '.....dddddddddddddddddddd.......',
  '...dddddddddddddddddddddddd.....',
  '..dddddddddddddddddddddddddd....',
  '..dddddddddddddddddddddddddd....',
  '...dddddddddddddddddddddddd.....',
  '.....dddddddddddddddddddd.......',
  '.......dddddddddddddddd.........',
  '..........dddddddddd............',
  '................................',
];

// ==================== PHONE (16x20) ====================
const PHONE = [
  '.....nnnnnnn.....',
  '....nnnnnnnnn....',
  '...nnnnnnnnnnn...',
  '..nnnnnnnnnnnnn..',
  '..nnneeeeeeeenn..',
  '..nnneeeeeeeenn..',
  '..nnneeeeeeeenn..',
  '..nnneeeeeeeenn..',
  '..nnneeeeeeeenn..',
  '..nnneeeeeeeenn..',
  '..nnneeeeeeeenn..',
  '..nnneeeeeeeenn..',
  '..nnneeeeeeeenn..',
  '..nnnnnnnnnnnnn..',
  '..nnnnnnnnnnnnn..',
  '...nnnnnnnnnnn...',
  '....nnnnnnnnn....',
  '.....nnnnnnn.....',
  '......nnnnn......',
  '.......nnn.......',
];

// ==================== BALCONY (48x12) ====================
const BALCONY = [
  'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
  'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
  'hHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHhh',
  'hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh',
  'hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh',
  'hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh',
  'hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh',
  'hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh',
  'hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh',
  'hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh',
  'hHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHhh',
  'hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh',
];

/**
 * Рендерит пиксельный спрайт в Phaser текстуру
 * Использует Phaser.CanvasTexture API
 */
function renderPixels(scene, key, pixelArray, palette = PALETTE) {
  const height = pixelArray.length;
  const width = pixelArray[0].length;

  // Пропускаем если текстура уже существует
  if (scene.textures.exists(key)) {
    return;
  }

  // Создаём CanvasTexture через Phaser API
  const texture = scene.textures.createCanvas(key, width, height);
  const ctx = texture.getContext();

  for (let y = 0; y < height; y++) {
    const row = pixelArray[y];
    for (let x = 0; x < width; x++) {
      const ch = row[x];
      const color = palette[ch];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  texture.refresh();
  texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
}

/**
 * Генерирует все спрайты для игры
 */
export function generateAllSprites(scene) {
  // Player animation frames
  renderPixels(scene, 'player_run1', PLAYER_RUN1);
  renderPixels(scene, 'player_run2', PLAYER_RUN2);
  renderPixels(scene, 'player_run3', PLAYER_RUN3);
  renderPixels(scene, 'player_run4', PLAYER_RUN4);
  renderPixels(scene, 'player_jump', PLAYER_JUMP);
  renderPixels(scene, 'player_dead', PLAYER_DEAD);

  // Gopnik frames
  renderPixels(scene, 'gopnik_run1', GOPNIK_RUN1);
  renderPixels(scene, 'gopnik_run2', GOPNIK_RUN2);

  // Objects
  renderPixels(scene, 'puddle', PUDDLE);
  renderPixels(scene, 'box', BOX);
  renderPixels(scene, 'barrel', BARREL);
  renderPixels(scene, 'wall', WALL);

  // Coin
  renderPixels(scene, 'coin', COIN);

  // Boosters
  renderPixels(scene, 'kefir', KEFIR);
  renderPixels(scene, 'nokia3310', NOKIA);
  renderPixels(scene, 'mama', MAMA);
  renderPixels(scene, 'magnet', MAGNET);

  // Background
  renderPixels(scene, 'ground_tile', GROUND_TILE);
  renderPixels(scene, 'building', BUILDING);
  renderPixels(scene, 'cloud', CLOUD);

  // UI / Scenes
  renderPixels(scene, 'phone', PHONE);
  renderPixels(scene, 'balcony', BALCONY);

  // Player main texture (default = first run frame)
  if (!scene.textures.exists('player')) {
    const canvas = scene.textures.get('player_run1').getSourceImage();
    scene.textures.addCanvas('player', canvas);
  }

  // Gopnik main texture
  if (!scene.textures.exists('gopnik')) {
    const canvas = scene.textures.get('gopnik_run1').getSourceImage();
    scene.textures.addCanvas('gopnik', canvas);
  }
}

/**
 * Создаёт анимации после генерации спрайтов
 */
export function createAnimations(scene) {
  if (!scene.anims.exists('player_run')) {
    scene.anims.create({
      key: 'player_run',
      frames: [
        { key: 'player_run1' },
        { key: 'player_run2' },
        { key: 'player_run3' },
        { key: 'player_run4' },
      ],
      frameRate: 10,
      repeat: -1
    });
  }

  if (!scene.anims.exists('gopnik_run')) {
    scene.anims.create({
      key: 'gopnik_run',
      frames: [
        { key: 'gopnik_run1' },
        { key: 'gopnik_run2' },
      ],
      frameRate: 8,
      repeat: -1
    });
  }
}
