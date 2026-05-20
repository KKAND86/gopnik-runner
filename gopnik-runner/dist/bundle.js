var GameApp = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // src/utils/SpriteGenerator.js
  var SpriteGenerator_exports = {};
  __export(SpriteGenerator_exports, {
    createAnimations: () => createAnimations,
    generateAllSprites: () => generateAllSprites2
  });
  function renderPixels(scene, key, pixelArray, palette = PALETTE) {
    const height = pixelArray.length;
    const width = pixelArray[0].length;
    if (scene.textures.exists(key)) {
      scene.textures.remove(key);
    }
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
  }
  function generateAllSprites2(scene) {
    renderPixels(scene, "player_run1", PLAYER_RUN1);
    renderPixels(scene, "player_run2", PLAYER_RUN2);
    renderPixels(scene, "player_run3", PLAYER_RUN3);
    renderPixels(scene, "player_run4", PLAYER_RUN4);
    renderPixels(scene, "player_jump", PLAYER_JUMP);
    renderPixels(scene, "player_dead", PLAYER_DEAD);
    renderPixels(scene, "gopnik_run1", GOPNIK_RUN1);
    renderPixels(scene, "gopnik_run2", GOPNIK_RUN2);
    renderPixels(scene, "puddle", PUDDLE);
    renderPixels(scene, "box", BOX);
    renderPixels(scene, "barrel", BARREL);
    renderPixels(scene, "wall", WALL);
    renderPixels(scene, "coin", COIN);
    renderPixels(scene, "kefir", KEFIR);
    renderPixels(scene, "nokia3310", NOKIA);
    renderPixels(scene, "mama", MAMA);
    renderPixels(scene, "ground_tile", GROUND_TILE);
    renderPixels(scene, "building", BUILDING);
    renderPixels(scene, "cloud", CLOUD);
    renderPixels(scene, "phone", PHONE);
    renderPixels(scene, "balcony", BALCONY);
    if (!scene.textures.exists("player")) {
      scene.textures.addImage("player", scene.textures.get("player_run1").getSourceImage());
    }
    if (!scene.textures.exists("gopnik")) {
      scene.textures.addImage("gopnik", scene.textures.get("gopnik_run1").getSourceImage());
    }
  }
  function createAnimations(scene) {
    scene.anims.create({
      key: "player_run",
      frames: [
        { key: "player_run1" },
        { key: "player_run2" },
        { key: "player_run3" },
        { key: "player_run4" }
      ],
      frameRate: 10,
      repeat: -1
    });
    scene.anims.create({
      key: "gopnik_run",
      frames: [
        { key: "gopnik_run1" },
        { key: "gopnik_run2" }
      ],
      frameRate: 8,
      repeat: -1
    });
  }
  var PALETTE, PLAYER_RUN1, PLAYER_RUN2, PLAYER_RUN3, PLAYER_RUN4, PLAYER_JUMP, PLAYER_DEAD, GOPNIK_RUN1, GOPNIK_RUN2, COIN, PUDDLE, BOX, BARREL, WALL, KEFIR, NOKIA, MAMA, GROUND_TILE, BUILDING, CLOUD, PHONE, BALCONY;
  var init_SpriteGenerator = __esm({
    "src/utils/SpriteGenerator.js"() {
      PALETTE = {
        ".": null,
        // transparent
        "k": "#0a0a0a",
        // black (куртка, кепка)
        "w": "#ffffff",
        // white (полоски)
        "b": "#2d4a8a",
        // blue (джинсы)
        "B": "#1a3a7a",
        // dark blue (тень джинс)
        "s": "#555555",
        // grey (бочка)
        "S": "#888888",
        // light grey
        "r": "#8b4513",
        // brown (ящик)
        "R": "#a0522d",
        // light brown
        "g": "#2ecc71",
        // green
        "y": "#f1c40f",
        // yellow (монетка)
        "Y": "#ffdd00",
        // bright yellow
        "o": "#e67e22",
        // orange
        "c": "#3498db",
        // cyan (лужа)
        "C": "#5dade2",
        // light cyan
        "p": "#ff69b4",
        // pink
        "m": "#8b0000",
        // dark red
        "d": "#dddddd",
        // light grey
        "D": "#aaaaaa",
        // mid grey
        "h": "#5d4037",
        // dark brown
        "f": "#f5deb3",
        // skin
        "F": "#eec090",
        // darker skin
        "a": "#aaaaaa",
        // asphalt grey
        "A": "#999999",
        // asphalt dark
        "l": "#cc0000",
        // red (кепка гопника)
        "e": "#eeeeee",
        // phone screen
        "n": "#2c3e50",
        // nokia body
        "N": "#34495e",
        // nokia dark
        "v": "#8e44ad",
        // violet (балалайка)
        "z": "#95a5a6",
        // bottle (кефир)
        "Z": "#7f8c8d",
        // bottle shadow
        "x": "#e74c3c"
        // label red
      };
      PLAYER_RUN1 = [
        "....kkkk....",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "....bbbb....",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "....bbbb....",
        "....bbbb....",
        "....kkkk....",
        "....kkkk....",
        "....kkkk....",
        "....kkkk....",
        "....kkkk...."
      ];
      PLAYER_RUN2 = [
        "....kkkk....",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "....bbbb....",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "....bbbb....",
        "....bbbb....",
        "....kk......",
        "....kkk.....",
        "....kk......",
        "...kkk......",
        "...kkk......"
      ];
      PLAYER_RUN3 = [
        "....kkkk....",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "....bbbb....",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "....bbbb....",
        "....bbbb....",
        "......kk....",
        ".....kkk....",
        "......kk....",
        "......kkk...",
        "......kkk..."
      ];
      PLAYER_RUN4 = [
        "....kkkk....",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "....bbbb....",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "....bbbb....",
        "....bbbb....",
        "...kkkk.....",
        "...kkkk.....",
        "...kkkk.....",
        "...kkkk.....",
        "...kkkk....."
      ];
      PLAYER_JUMP = [
        "....kkkk....",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "....bbbb....",
        "...bbbbbb...",
        "...bbbbbb...",
        "....bbbb....",
        "....bbbb....",
        "....bbbb....",
        "...bbbbbb...",
        "...kkkkk....",
        "...kkkkk....",
        "...kkkkk....",
        "...kkkkk....",
        "...kkkkk...."
      ];
      PLAYER_DEAD = [
        "....kkkk....",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "...kkkkkk...",
        "...kwwwwk...",
        "...kwwwwk...",
        "...kkkkkk...",
        "....bbbb....",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "....bbbb....",
        "....bbbb....",
        "....kkkk....",
        "....kkkk....",
        "....kkkk....",
        "....kkkk....",
        "....kkkk...."
      ];
      GOPNIK_RUN1 = [
        "....llll....",
        "...llllll...",
        "...llllll...",
        "...llllll...",
        "...llllll...",
        "...llllll...",
        "...llllll...",
        "...llllll...",
        "....bbbb....",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "....bbbb....",
        "....bbbb....",
        "....kkkk....",
        "....kkkk....",
        "....kkkk....",
        "....kkkk....",
        "....kkkk...."
      ];
      GOPNIK_RUN2 = [
        "....llll....",
        "...llllll...",
        "...llllll...",
        "...llllll...",
        "...llllll...",
        "...llllll...",
        "...llllll...",
        "...llllll...",
        "....bbbb....",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "...bbbbbb...",
        "....bbbb....",
        "....bbbb....",
        "....kk......",
        "....kkk.....",
        "....kk......",
        "...kkk......",
        "...kkk......"
      ];
      COIN = [
        ".....yyyyy.....",
        "...yyyyyyyyy...",
        "..yyyyyyyyyyy..",
        ".yyyyyyyyyyyyy.",
        ".yyWWWWWWWWyyy.",
        ".yyWyyWWyyWyyy.",
        "yyyyWyyWWyyWyyy",
        "yyyyWyyWWyyWyyy",
        "yyyyWyyWWyyWyyy",
        "yyyyWyyWWyyWyyy",
        "yyyyWyyyyyyWyyy",
        ".yyWyyyyyyyyWyy",
        ".yyyyyyyyyyyyy.",
        "..yyyyyyyyyyy..",
        "...yyyyyyyyy...",
        ".....yyyyy....."
      ];
      PUDDLE = [
        "..cccccccccccccccccc..",
        ".cccccccccccccccccccc.",
        "ccccccCCCcccccccCCCccc",
        "cccccCCCCCcccccCCCCCcc",
        "cccccCCCCCcccccCCCCCcc",
        "ccccccCCCcccccccCCCccc",
        ".cccccccccccccccccccc.",
        "..cccccccccccccccccc.."
      ];
      BOX = [
        "rrrrrrrrrrrrrrrrrrrr",
        "rrRRRRRRRRRRRRRRRRrr",
        "rrRrrrrrrrrrrrrrrRrr",
        "rrRrRRRRRRRRRRRRrRrr",
        "rrRrRrrrrrrrrrrRrRrr",
        "rrRrRrrrrrrrrrrRrRrr",
        "rrRrRrrrrrrrrrrRrRrr",
        "rrRrRrrrrrrrrrrRrRrr",
        "rrRrRrrrrrrrrrrRrRrr",
        "rrRrRRRRRRRRRRRRrRrr",
        "rrRrRrrrrrrrrrrRrRrr",
        "rrRrRrrrrrrrrrrRrRrr",
        "rrRrRrrrrrrrrrrRrRrr",
        "rrRrRrrrrrrrrrrRrRrr",
        "rrRrRrrrrrrrrrrRrRrr",
        "rrRrRRRRRRRRRRRRrRrr",
        "rrRrrrrrrrrrrrrrrRrr",
        "rrRRRRRRRRRRRRRRRRrr",
        "rrrrrrrrrrrrrrrrrrrr",
        "rrrrrrrrrrrrrrrrrrrr"
      ];
      BARREL = [
        "....ssssssss....",
        "...ssSSSSSSss...",
        "..ssSSSSSSSSss..",
        ".ssSSSSSSSSSSss.",
        ".ssSSSSSSSSSSss.",
        "ssSSSSSSSSSSSSss",
        "ssSSSSSSSSSSSSss",
        "ssSSSSSSSSSSSSss",
        "ssSSSSSSSSSSSSss",
        ".ssSSSSSSSSSSss.",
        ".ssSSSSSSSSSSss.",
        "..ssSSSSSSSSss..",
        "..ssSSSSSSSSss..",
        "..ssSSSSSSSSss..",
        "..ssSSSSSSSSss..",
        ".ssSSSSSSSSSSss.",
        ".ssSSSSSSSSSSss.",
        "ssSSSSSSSSSSSSss",
        "ssSSSSSSSSSSSSss",
        "ssSSSSSSSSSSSSss",
        "ssSSSSSSSSSSSSss",
        ".ssSSSSSSSSSSss.",
        ".ssSSSSSSSSSSss.",
        "...ssssssssss..."
      ];
      WALL = [
        "hhhhhhhhhhhhhhhhhhhh",
        "hHHHHHHHHHHHHHHHHHhh",
        "hHhhhhhhhhhhhhhhhHhh",
        "hHhHHHHHHHHHHHHHhHhh",
        "hHhHhhhhhhhhhhhHhHhh",
        "hHhHhHHHHHHHHHhHhHhh",
        "hHhHhHhhhhhhhHhHhHhh",
        "hHhHhHhhhhhhhHhHhHhh",
        "hHhHhHHHHHHHHHhHhHhh",
        "hHhHhhhhhhhhhhhHhHhh",
        "hHhHHHHHHHHHHHHHhHhh",
        "hHhhhhhhhhhhhhhhhHhh",
        "hHHHHHHHHHHHHHHHHHhh",
        "hhhhhhhhhhhhhhhhhhhh",
        "hhhhhhhhhhhhhhhhhhhh",
        "hHHHHHHHHHHHHHHHHHhh",
        "hHhhhhhhhhhhhhhhhHhh",
        "hHhHHHHHHHHHHHHHhHhh",
        "hHhHhhhhhhhhhhhHhHhh",
        "hHhHhhhhhhhhhhhHhHhh",
        "hHhHHHHHHHHHHHHHhHhh",
        "hHhhhhhhhhhhhhhhhHhh",
        "hHHHHHHHHHHHHHHHHHhh",
        "hhhhhhhhhhhhhhhhhhhh",
        "hhhhhhhhhhhhhhhhhhhh",
        "hhhhhhhhhhhhhhhhhhhh",
        "hhhhhhhhhhhhhhhhhhhh",
        "hhhhhhhhhhhhhhhhhhhh"
      ];
      KEFIR = [
        "....zzzzzz....",
        "...zzzzzzzz...",
        "..zzzzzzzzzz..",
        "..zzzzzzzzzz..",
        ".zzzzzzzzzzzz.",
        ".zzzzzzzzzzzz.",
        ".zzzzzzzzzzzz.",
        ".zzxxxxxxxxz.",
        ".zzxxxxxxxxz.",
        ".zzzzzzzzzzzz.",
        ".zzzzzzzzzzzz.",
        ".zzzzzzzzzzzz.",
        ".zzzzzzzzzzzz.",
        "..zzzzzzzzzz..",
        "..zzzzzzzzzz..",
        "..zzzzzzzzzz..",
        "...zzzzzzzz...",
        "...zzzzzzzz...",
        "....zzzzzz....",
        "......zz......"
      ];
      NOKIA = [
        "..............",
        ".....nnnnn....",
        "....nnnnnnn...",
        "...nnnnnnnnn..",
        "...nnnnnnnnn..",
        "...nneeeeeen..",
        "...nneeeeeen..",
        "...nneeeeeen..",
        "...nneeeeeen..",
        "...nneeeeeen..",
        "...nneeeeeen..",
        "...nneeeeeen..",
        "...nneeeeeen..",
        "...nneeeeeen..",
        "...nnnnnnnnn..",
        "...nnnnnnnnn..",
        "...nnnnnnnnn..",
        "....nnnnnnn...",
        ".....nnnnn....",
        ".............."
      ];
      MAMA = [
        "......pppp......",
        ".....pppppp.....",
        ".....pppppp.....",
        "......pppp......",
        "......ffff......",
        ".....ffffff.....",
        "....ffffffffff..",
        "...fffffffffff..",
        "...fffffffffff..",
        "....ffffffffff..",
        ".....ffffff.....",
        "......ffff......",
        "......hhhh......",
        ".....hhhhhh.....",
        "....hhhhhhhh....",
        "...hhhhhhhhhh...",
        "..hhhhhhhhhhhh..",
        ".......hh.......",
        ".......hh.......",
        ".......hh.......",
        ".......hh.......",
        ".......hh.......",
        ".......hh.......",
        ".......hh......."
      ];
      GROUND_TILE = [
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "aAaaAaaAaaAaaAaaAaaAaaAaaAaaAaaA",
        "aaAaaAaaAaaAaaAaaAaaAaaAaaAaaAa",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "aAaaAaaAaaAaaAaaAaaAaaAaaAaaAaaA",
        "aaAaaAaaAaaAaaAaaAaaAaaAaaAaaAa"
      ];
      BUILDING = [
        ".................................",
        ".................................",
        "..........dddddddddd.............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........ddeddddedddd............",
        ".........ddeddddedddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........ddeddddedddd............",
        ".........ddeddddedddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........ddeddddedddd............",
        ".........ddeddddedddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        ".........dddddddddddd............",
        "..........dddddddddd.............",
        "................................."
      ];
      CLOUD = [
        "................................",
        "..........dddddddddd............",
        ".......dddddddddddddddd.........",
        ".....dddddddddddddddddddd.......",
        "...dddddddddddddddddddddddd.....",
        "..dddddddddddddddddddddddddd....",
        "..dddddddddddddddddddddddddd....",
        "...dddddddddddddddddddddddd.....",
        ".....dddddddddddddddddddd.......",
        ".......dddddddddddddddd.........",
        "..........dddddddddd............",
        "................................"
      ];
      PHONE = [
        ".....nnnnnnn.....",
        "....nnnnnnnnn....",
        "...nnnnnnnnnnn...",
        "..nnnnnnnnnnnnn..",
        "..nnneeeeeeeenn..",
        "..nnneeeeeeeenn..",
        "..nnneeeeeeeenn..",
        "..nnneeeeeeeenn..",
        "..nnneeeeeeeenn..",
        "..nnneeeeeeeenn..",
        "..nnneeeeeeeenn..",
        "..nnneeeeeeeenn..",
        "..nnneeeeeeeenn..",
        "..nnnnnnnnnnnnn..",
        "..nnnnnnnnnnnnn..",
        "...nnnnnnnnnnn...",
        "....nnnnnnnnn....",
        ".....nnnnnnn.....",
        "......nnnnn......",
        ".......nnn......."
      ];
      BALCONY = [
        "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
        "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh",
        "hHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHhh",
        "hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh",
        "hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh",
        "hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh",
        "hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh",
        "hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh",
        "hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh",
        "hHhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhHhh",
        "hHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHhh",
        "hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh"
      ];
    }
  });

  // src/config.js
  var GAME = {
    width: 1280,
    height: 720,
    gravity: 1200,
    groundY: 600,
    // Высота земли от верха
    player: {
      startX: 200,
      width: 48,
      height: 64,
      jumpVelocity: -400,
      // Короткий прыжок: ~67px высоты
      longJumpVelocity: -600,
      // Длинный прыжок: ~150px высоты
      runSpeedMin: 300,
      runSpeedMax: 600,
      speedIncrement: 5,
      // скорость растёт быстрее (60 сек до макс)
      coinBoost: 15
      // монетка = +15 к скорости
    },
    controls: {
      tapThreshold: 150
      // Короче = отзывчивее
    },
    spawn: {
      obstacleMinTime: 2e3,
      // БЫЛО 1500 — больше времени
      obstacleMaxTime: 4e3,
      // БЫЛО 3000
      coinChance: 0.4,
      gopnikDelay: 8e3
      // Первый гопник через 8 сек (было 5)
    }
  };

  // src/scenes/IntroScene.js
  var IntroScene = class extends Phaser.Scene {
    constructor() {
      super({ key: "IntroScene" });
    }
    create() {
      const w = this.scale.width;
      const h = this.scale.height;
      Promise.resolve().then(() => (init_SpriteGenerator(), SpriteGenerator_exports)).then(({ generateAllSprites: generateAllSprites3, createAnimations: createAnimations2 }) => {
        generateAllSprites3(this);
        createAnimations2(this);
      });
      this.cameras.main.setBackgroundColor("#1a1a2e");
      const sky = this.add.tileSprite(w / 2, h / 2, w, h, "cloud");
      sky.setAlpha(0.1);
      this.tweens.add({
        targets: sky,
        tilePositionX: 200,
        duration: 2e4,
        repeat: -1
      });
      const phone = this.add.sprite(w / 2, h / 2 - 60, "phone");
      phone.setDisplaySize(48, 60);
      this.tweens.add({
        targets: phone,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      const player = this.add.sprite(w / 2, h - 60, "player_run1");
      player.setDisplaySize(32, 48);
      this.add.text(w / 2, h / 2 + 20, "\u041C\u0438\u043B\u044B\u0439, \u0437\u0430 \u043A\u0435\u0444\u0438\u0440\u043E\u043C \u0441\u0445\u043E\u0434\u0438!", {
        font: "bold 20px monospace",
        fill: "#ff69b4",
        stroke: "#000",
        strokeThickness: 3
      }).setOrigin(0.5);
      const hint = this.add.text(w / 2, h - 30, "\u0422\u0410\u041F\u041D\u0418 \u0427\u0422\u041E\u0411\u042B \u0411\u0415\u0416\u0410\u0422\u042C", {
        font: "16px monospace",
        fill: "#2ecc71",
        stroke: "#000",
        strokeThickness: 2
      }).setOrigin(0.5);
      this.tweens.add({
        targets: hint,
        alpha: 0.3,
        duration: 800,
        yoyo: true,
        repeat: -1
      });
      const lbBtn = this.add.text(w - 20, 20, "\u{1F3C6}", { font: "24px monospace" }).setOrigin(1, 0).setInteractive();
      lbBtn.on("pointerdown", () => this.scene.start("LeaderboardScene"));
      this.input.once("pointerdown", () => {
        this.scene.start("GameScene");
      });
      this.input.keyboard.once("keydown-SPACE", () => {
        this.scene.start("GameScene");
      });
    }
  };

  // src/audio/SoundManager.js
  var SoundManager = class {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.muted = false;
    }
    init() {
      if (this.ctx) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
    }
    ensureContext() {
      if (!this.ctx) this.init();
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
    }
    play(type, opts = {}) {
      if (!this.enabled || this.muted) return;
      this.ensureContext();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      switch (type) {
        case "jump":
          this._tone(now, 300, 0.08, "square", 0.12, 0.8);
          break;
        case "coin":
          this._tone(now, 880, 0.05, "sine", 0.08, 0.6);
          this._tone(now + 0.06, 1100, 0.05, "sine", 0.08, 0.5);
          break;
        case "danger":
          this._tone(now, 200, 0.15, "sawtooth", 0.2, 0.5);
          break;
        case "booster":
          this._tone(now, 523, 0.06, "square", 0.1, 0.5);
          this._tone(now + 0.08, 659, 0.06, "square", 0.1, 0.5);
          this._tone(now + 0.16, 784, 0.1, "square", 0.15, 0.5);
          break;
        case "gameover":
          this._tone(now, 400, 0.2, "sawtooth", 0.25, 0.7);
          this._tone(now + 0.25, 350, 0.2, "sawtooth", 0.3, 0.6);
          this._tone(now + 0.5, 300, 0.3, "sawtooth", 0.4, 0.5);
          break;
        case "step":
          if (Math.random() > 0.7) {
            this._tone(now, 100 + Math.random() * 40, 0.02, "square", 0.03, 0.15);
          }
          break;
      }
    }
    _tone(time, freq, dur, wave, fade, vol) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(1e-3, time + fade);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + dur);
    }
    toggleMute() {
      this.muted = !this.muted;
      return this.muted;
    }
  };
  var soundManager = new SoundManager();
  var SoundManager_default = soundManager;

  // src/entities/Player.js
  var Player = class extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
      super(scene, x, y, "player");
      scene.add.existing(this);
      scene.physics.add.existing(this);
      this.setDisplaySize(GAME.player.width, GAME.player.height);
      this.body.setSize(GAME.player.width * 0.5, GAME.player.height * 0.8);
      this.body.setOffset(0, 0);
      this.body.setCollideWorldBounds(true);
      this.body.setGravityY(GAME.gravity);
      this.body.setAllowGravity(true);
      this.scene = scene;
      this.isGrounded = false;
      this.isDead = false;
      this.speed = GAME.player.runSpeedMin;
    }
    update(time, dt) {
      if (this.isDead) return;
      this.speed = Math.min(
        GAME.player.runSpeedMax,
        GAME.player.runSpeedMin + this.x * GAME.player.speedScale
      );
      this.body.setVelocityX(this.speed);
      this.setFlipX(this.body.velocity.x < 0);
      if (!this.isGrounded) {
        this.setRotation(this.body.velocity.y < 0 ? -0.1 : 0.1);
      } else {
        this.setRotation(0);
      }
    }
    jump(isLong = false) {
      if (!this.isGrounded || this.isDead) return;
      const impulse = isLong ? GAME.player.longJumpVelocity : GAME.player.jumpVelocity;
      this.body.setVelocityY(impulse);
      this.isGrounded = false;
    }
    die() {
      if (this.isDead) return;
      this.isDead = true;
      this.setTint(5592405);
      this.body.setVelocity(0);
    }
  };

  // src/entities/Obstacle.js
  var Obstacle = class extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, obsType) {
      const texKey = obsType?.key || "box";
      super(scene, x, y, texKey);
      scene.add.existing(this);
      scene.physics.add.existing(this, true);
      this.obsType = obsType;
      this.passed = false;
      const w = obsType?.w || 40;
      const h = obsType?.h || 25;
      this.setDisplaySize(w, h);
      this.body.setSize(w * 0.7, h * 0.7);
      this.body.setOffset(0, 0);
    }
    preUpdate(time, delta) {
      super.preUpdate(time, delta);
    }
  };

  // src/entities/Gopnik.js
  var Gopnik = class extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
      super(scene, x, y, "gopnik");
      scene.add.existing(this);
      scene.physics.add.existing(this, false);
      this.setDisplaySize(40, 60);
      this.body.setSize(32, 50);
      this.speed = 7;
      this.passed = false;
    }
    preUpdate(time, delta) {
      super.preUpdate(time, delta);
    }
  };

  // src/entities/Booster.js
  var BOOSTER_TYPES = [
    { key: "kefir", effect: "speed", label: "\u041A\u0415\u0424\u0418\u0420!" },
    { key: "nokia3310", effect: "shield", label: "NOKIA 3310" },
    { key: "mama", effect: "repel", label: "\u041C\u0410\u041C\u0410 \u0421 \u041C\u0415\u0422\u041B\u041E\u0419!" }
  ];
  function getRandomBoosterType() {
    return Phaser.Utils.Array.GetRandom(BOOSTER_TYPES);
  }
  var Booster = class extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, type) {
      super(scene, x, y, type.key);
      scene.add.existing(this);
      scene.physics.add.existing(this);
      this.body.allowGravity = false;
      this.boosterType = type;
      this.setDisplaySize(36, 36);
      this.body.setSize(28, 28);
    }
  };

  // src/scenes/GameScene.js
  var OBSTACLES = [
    { key: "puddle", w: 50, h: 12, color: 3447003 },
    // Лужа — любой прыжок
    { key: "box", w: 40, h: 25, color: 15105570 },
    // Ящик — короткий прыжок
    { key: "barrel", w: 30, h: 35, color: 9807270 },
    // Бочка — короткий прыжок
    { key: "crate", w: 35, h: 55, color: 9127187 },
    // Ящик-гигант — только длинный
    { key: "wall", w: 25, h: 70, color: 2899536 }
    // Стена — только длинный
  ];
  var LEVEL_PALETTES = [
    { name: "\u0414\u0415\u041D\u042C", top: "#87ceeb", bottom: "#e0f6ff", buildings: [3426654, 2899536, 8359053] },
    { name: "\u0417\u0410\u041A\u0410\u0422", top: "#ff9966", bottom: "#ffecd2", buildings: [9127187, 10506797, 13468991] },
    { name: "\u0412\u0415\u0427\u0415\u0420", top: "#2c3e50", bottom: "#4a6fa5", buildings: [1710638, 1450302, 996448] },
    { name: "\u041D\u041E\u0427\u042C", top: "#1a1a2e", bottom: "#16213e", buildings: [657946, 1710638, 2960708] }
  ];
  var GameScene = class extends Phaser.Scene {
    constructor() {
      super({ key: "GameScene" });
    }
    create() {
      this.distance = 0;
      this.coins = 0;
      this.isGameOver = false;
      this.startTime = this.time.now;
      this.level = 1;
      this.currentPaletteIdx = -1;
      generateAllSprites(this);
      const gfx = this.make.graphics({ x: 0, y: 0, add: false });
      gfx.fillStyle(16777215);
      gfx.fillRect(0, 0, 1, 1);
      gfx.generateTexture("pixel", 1, 1);
      gfx.destroy();
      this.createSky();
      const groundY = GAME.groundY;
      const groundH = 120;
      this.groundTile = this.add.tileSprite(GAME.width / 2, groundY + groundH / 2, GAME.width + 200, groundH, "pixel");
      this.groundTile.setTint(7829367);
      this.groundTile.setDepth(0);
      this.grassTile = this.add.tileSprite(GAME.width / 2, groundY + 4, GAME.width + 200, 8, "pixel");
      this.grassTile.setTint(3066993);
      this.grassTile.setDepth(1);
      this.edgeLine = this.add.tileSprite(GAME.width / 2, groundY, GAME.width + 200, 2, "pixel");
      this.edgeLine.setTint(1118481);
      this.edgeLine.setDepth(2);
      const groundBody = this.add.rectangle(25e3, groundY + 2, 5e4, 8, 65280, 0);
      this.physics.add.existing(groundBody, true);
      groundBody.setVisible(false);
      this.player = new Player(this, GAME.player.startX, groundY - 33);
      this.physics.add.collider(this.player, groundBody);
      this.gopniki = [];
      this.obstacles = [];
      this.coinsList = [];
      this.boosters = [];
      this.setupControls();
      this.createUI();
      this.cameras.main.startFollow(this.player, true, 1, 1);
      this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, GAME.height);
      this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, GAME.height);
      this.scheduleNextCoin();
      this.time.delayedCall(2e3, () => this.scheduleNextObstacle());
      this.time.delayedCall(5e3, () => this.scheduleNextBooster());
    }
    createSky() {
      this.updateSkyGradient("#87ceeb", "#e0f6ff");
      this.sky = this.add.tileSprite(GAME.width / 2, GAME.height / 2, GAME.width, GAME.height, "skyGradient");
      this.sky.setScrollFactor(0);
      this.sky.setDepth(-10);
      this.buildings = [];
      const colors = LEVEL_PALETTES[0].buildings;
      let bx = -100;
      while (bx < GAME.width + 200) {
        const w = Phaser.Math.Between(60, 140);
        const h = Phaser.Math.Between(50, 120);
        const b = this.add.rectangle(bx + w / 2, GAME.groundY - h / 2, w, h, Phaser.Utils.Array.GetRandom(colors));
        b.setAlpha(0.4);
        b.setDepth(-5);
        this.buildings.push({ sprite: b, w });
        bx += w + Phaser.Math.Between(10, 40);
      }
    }
    updateSkyGradient(top, bottom) {
      if (this.textures.exists("skyGradient")) {
        this.textures.remove("skyGradient");
      }
      const canvas = document.createElement("canvas");
      canvas.width = 1;
      canvas.height = GAME.height;
      const ctx = canvas.getContext("2d");
      const grd = ctx.createLinearGradient(0, 0, 0, GAME.height);
      grd.addColorStop(0, top);
      grd.addColorStop(1, bottom);
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, 1, GAME.height);
      this.textures.addCanvas("skyGradient", canvas);
    }
    setupControls() {
      const startHold = () => {
        if (this.isGameOver) {
          this.restart();
          return;
        }
        if (!this.player.isGrounded || this.player.isDead) return;
        this.holdStartTime = this.time.now;
        this.isHolding = true;
      };
      const endHold = () => {
        if (!this.isHolding) return;
        this.isHolding = false;
        if (!this.player.isGrounded || this.player.isDead) return;
        const holdDuration = this.time.now - this.holdStartTime;
        const isLongJump = holdDuration > GAME.controls.tapThreshold;
        SoundManager_default.play("jump");
        this.player.jump(isLongJump);
      };
      this.input.on("pointerdown", startHold);
      this.input.on("pointerup", endHold);
      this.input.keyboard.on("keydown-SPACE", startHold);
      this.input.keyboard.on("keyup-SPACE", endHold);
    }
    createUI() {
      const style = { font: "bold 24px monospace", fill: "#ffffff", stroke: "#000", strokeThickness: 4 };
      this.distanceText = this.add.text(20, 20, "0 \u043C", style).setScrollFactor(0);
      this.coinsText = this.add.text(20, 55, "0 \u20BD", style).setScrollFactor(0);
      this.muteBtn = this.add.text(GAME.width - 20, 55, "\u{1F50A}", {
        font: "20px monospace"
      }).setOrigin(1, 0).setScrollFactor(0).setInteractive();
      this.muteBtn.on("pointerdown", () => {
        const muted = SoundManager_default.toggleMute();
        this.muteBtn.setText(muted ? "\u{1F507}" : "\u{1F50A}");
      });
      this.speedText = this.add.text(GAME.width - 20, 20, "0 \u043A\u043C/\u0447", {
        font: "bold 22px monospace",
        fill: "#f1c40f",
        stroke: "#000",
        strokeThickness: 3
      }).setOrigin(1, 0).setScrollFactor(0);
      this.levelText = this.add.text(GAME.width / 2, 20, "\u0423\u0420\u041E\u0412\u0415\u041D\u042C 1", {
        font: "bold 26px monospace",
        fill: "#ffffff",
        stroke: "#000",
        strokeThickness: 4
      }).setOrigin(0.5, 0).setScrollFactor(0);
      this.dangerText = this.add.text(GAME.width / 2, 80, "", {
        font: "bold 20px monospace",
        fill: "#e74c3c",
        stroke: "#000",
        strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setVisible(false);
      this.hintText = this.add.text(GAME.width / 2, GAME.height - 50, "\u0422\u0410\u041F = \u043F\u0440\u044B\u0436\u043E\u043A | \u0414\u0415\u0420\u0416\u0418 = \u0434\u043B\u0438\u043D\u043D\u044B\u0439 | \u0421\u041E\u0411\u0418\u0420\u0410\u0419 \u041C\u041E\u041D\u0415\u0422\u041A\u0418!", {
        font: "16px monospace",
        fill: "#ffffff",
        stroke: "#000",
        strokeThickness: 3
      }).setOrigin(0.5).setScrollFactor(0).setAlpha(0.7);
      this.jumpPowerBg = this.add.rectangle(GAME.width / 2, GAME.height - 80, 200, 10, 3355443);
      this.jumpPowerBg.setOrigin(0.5).setScrollFactor(0).setDepth(49).setVisible(false);
      this.jumpPowerBar = this.add.rectangle(GAME.width / 2 - 100, GAME.height - 80, 0, 10, 15844367);
      this.jumpPowerBar.setOrigin(0, 0.5).setScrollFactor(0).setDepth(50).setVisible(false);
      this.jumpPowerLabel = this.add.text(GAME.width / 2, GAME.height - 100, "", {
        font: "bold 14px monospace",
        fill: "#f1c40f",
        stroke: "#000",
        strokeThickness: 2
      }).setOrigin(0.5).setScrollFactor(0).setDepth(51).setVisible(false);
      this.gameOverContainer = this.add.container(GAME.width / 2, GAME.height / 2).setScrollFactor(0).setDepth(100).setVisible(false);
      const bg = this.add.rectangle(0, 0, 400, 250, 0, 0.8).setStrokeStyle(2, 16777215);
      const title = this.add.text(0, -70, "\u0413\u041E\u041F\u041D\u0418\u041A\u0418 \u0414\u041E\u0413\u041D\u0410\u041B\u0418", { font: "bold 28px monospace", fill: "#e74c3c" }).setOrigin(0.5);
      this.finalScoreText = this.add.text(0, -20, "", { font: "22px monospace", fill: "#fff" }).setOrigin(0.5);
      this.finalCoinsText = this.add.text(0, 20, "", { font: "22px monospace", fill: "#f1c40f" }).setOrigin(0.5);
      this.bestScoreText = this.add.text(0, 50, "", { font: "16px monospace", fill: "#888" }).setOrigin(0.5);
      const restartText = this.add.text(0, 90, "\u0422\u0410\u041F\u041D\u0418 \u0414\u041B\u042F \u0420\u0415\u0421\u0422\u0410\u0420\u0422\u0410", { font: "18px monospace", fill: "#2ecc71" }).setOrigin(0.5);
      this.gameOverContainer.add([bg, title, this.finalScoreText, this.finalCoinsText, this.bestScoreText, restartText]);
    }
    scheduleNextObstacle() {
      if (this.isGameOver) return;
      const delay = Phaser.Math.Between(GAME.spawn.obstacleMinTime, GAME.spawn.obstacleMaxTime);
      this.time.delayedCall(delay, () => this.spawnObstacle());
    }
    spawnObstacle() {
      if (this.isGameOver) return;
      const type = Phaser.Utils.Array.GetRandom(OBSTACLES);
      const spawnX = this.player.x + GAME.width + Phaser.Math.Between(80, 250);
      const spawnY = GAME.groundY - type.h / 2;
      const obs = new Obstacle(this, spawnX, spawnY, type);
      this.obstacles.push(obs);
      this.scheduleNextObstacle();
    }
    spawnGopnik() {
      if (this.isGameOver) return;
      const spawnX = this.player.x - Phaser.Math.Between(800, 1200);
      const spawnY = GAME.groundY - 30;
      const gop = new Gopnik(this, spawnX, spawnY);
      gop.gopnikSpeed = GAME.player.runSpeedMin - 30;
      this.gopniki.push(gop);
    }
    scheduleNextCoin() {
      if (this.isGameOver) return;
      const delay = Phaser.Math.Between(1e3, 2500);
      this.time.delayedCall(delay, () => this.spawnCoin());
    }
    spawnCoin() {
      if (this.isGameOver || Math.random() > GAME.spawn.coinChance) {
        this.scheduleNextCoin();
        return;
      }
      const spawnX = this.player.x + GAME.width + Phaser.Math.Between(30, 150);
      const spawnY = Phaser.Math.Between(GAME.groundY - 130, GAME.groundY - 50);
      const coin = this.add.sprite(spawnX, spawnY, "coin");
      coin.setDisplaySize(32, 32);
      this.physics.add.existing(coin);
      coin.body.setSize(24, 24);
      coin.body.allowGravity = false;
      this.coinsList.push(coin);
      this.tweens.add({
        targets: coin,
        y: spawnY - 10,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      this.scheduleNextCoin();
    }
    scheduleNextBooster() {
      if (this.isGameOver) return;
      const delay = Phaser.Math.Between(4e3, 8e3);
      this.time.delayedCall(delay, () => this.spawnBooster());
    }
    spawnBooster() {
      if (this.isGameOver || Math.random() > 0.6) {
        this.scheduleNextBooster();
        return;
      }
      const type = getRandomBoosterType();
      const spawnX = this.player.x + GAME.width + Phaser.Math.Between(50, 200);
      const spawnY = Phaser.Math.Between(GAME.groundY - 140, GAME.groundY - 60);
      const booster = new Booster(this, spawnX, spawnY, type);
      this.boosters.push(booster);
      this.tweens.add({
        targets: booster,
        y: spawnY - 8,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      this.scheduleNextBooster();
    }
    checkCollisions() {
      if (this.isGameOver) return;
      const playerLeft = this.player.x - this.player.displayWidth / 2 + 4;
      const playerRight = this.player.x + this.player.displayWidth / 2 - 4;
      const playerTop = this.player.y - this.player.displayHeight / 2 + 2;
      const playerBottom = this.player.y + this.player.displayHeight / 2;
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        if (!obs || !obs.active) {
          this.obstacles.splice(i, 1);
          continue;
        }
        const obsLeft = obs.x - obs.width / 2;
        const obsRight = obs.x + obs.width / 2;
        const obsTop = obs.y - obs.height / 2;
        const obsBottom = obs.y + obs.height / 2;
        if (playerRight > obsLeft && playerLeft < obsRight && playerBottom > obsTop && playerTop < obsBottom) {
          if (playerBottom > obsTop + 5) {
            this.player.die();
            this.triggerGameOver();
            return;
          }
        }
        if (obs.x < this.player.x - GAME.width - 200) {
          obs.destroy();
          this.obstacles.splice(i, 1);
        }
      }
      for (let i = this.gopniki.length - 1; i >= 0; i--) {
        const gop = this.gopniki[i];
        if (!gop || !gop.active) {
          this.gopniki.splice(i, 1);
          continue;
        }
        const dist = this.player.x - gop.x;
        if (dist < 40) {
          if (this.player.shieldActive) {
            gop.x -= 300;
            gop.body.x = gop.x;
            continue;
          }
          this.player.die();
          this.triggerGameOver();
          return;
        }
        if (gop.x < this.player.x - GAME.width * 2) {
          gop.destroy();
          this.gopniki.splice(i, 1);
        }
      }
      for (let i = this.coinsList.length - 1; i >= 0; i--) {
        const coin = this.coinsList[i];
        if (!coin || !coin.active) {
          this.coinsList.splice(i, 1);
          continue;
        }
        const dx = this.player.x - coin.x;
        const dy = this.player.y - coin.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 35) {
          coin.destroy();
          this.coinsList.splice(i, 1);
          this.coins++;
          SoundManager_default.play("coin");
          this.coinsText.setText(this.coins + " \u20BD");
          this.player.speed = Math.min(this.player.speed + GAME.player.coinBoost, GAME.player.runSpeedMax);
          this.tweens.add({
            targets: this.speedText,
            scaleX: 1.5,
            scaleY: 1.5,
            duration: 100,
            yoyo: true
          });
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred("light");
          }
        }
        if (coin.x < this.player.x - GAME.width) {
          coin.destroy();
          this.coinsList.splice(i, 1);
        }
      }
      for (let i = this.boosters.length - 1; i >= 0; i--) {
        const b = this.boosters[i];
        if (!b || !b.active) {
          this.boosters.splice(i, 1);
          continue;
        }
        const dx = this.player.x - b.x;
        const dy = this.player.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40) {
          const type = b.boosterType;
          b.destroy();
          this.boosters.splice(i, 1);
          if (type.effect === "speed") {
            this.player.speed = Math.min(this.player.speed + 150, GAME.player.runSpeedMax + 100);
            this.showFloatingText(b.x, b.y, "\u26A1 \u041A\u0415\u0424\u0418\u0420!", "#fff");
          } else if (type.effect === "shield") {
            this.player.shieldActive = true;
            this.player.setTint(65535);
            this.time.delayedCall(3e3, () => {
              if (this.player && !this.player.isDead) {
                this.player.shieldActive = false;
                this.player.clearTint();
              }
            });
            this.showFloatingText(b.x, b.y, "\u{1F6E1}\uFE0F NOKIA 3310", "#0ff");
          } else if (type.effect === "repel") {
            for (const gop of this.gopniki) {
              if (gop && gop.active) {
                gop.x -= 500;
                gop.body.x = gop.x;
              }
            }
            this.showFloatingText(b.x, b.y, "\u{1F44B} \u041C\u0410\u041C\u0410 \u0421 \u041C\u0415\u0422\u041B\u041E\u0419!", "#f0f");
          }
          SoundManager_default.play("booster");
          if (window.Telegram?.WebApp?.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
          }
        }
        if (b.x < this.player.x - GAME.width) {
          b.destroy();
          this.boosters.splice(i, 1);
        }
      }
    }
    showFloatingText(x, y, text, color) {
      const label = this.add.text(x, y, text, {
        font: "bold 16px monospace",
        fill: color || "#fff",
        stroke: "#000",
        strokeThickness: 3
      }).setOrigin(0.5);
      this.tweens.add({
        targets: label,
        y: y - 60,
        alpha: 0,
        duration: 1200,
        onComplete: () => label.destroy()
      });
    }
    triggerGameOver() {
      if (this.isGameOver) return;
      this.isGameOver = true;
      SoundManager_default.play("gameover");
      this.physics.pause();
      const best = parseInt(localStorage.getItem("bestDistance") || "0");
      const isNewBest = this.distance > best;
      if (isNewBest) {
        localStorage.setItem("bestDistance", Math.floor(this.distance));
      }
      this.time.delayedCall(1500, () => {
        this.scene.start("OutroScene", {
          distance: this.distance,
          coins: this.coins,
          isNewBest
        });
      });
    }
    restart() {
      this.scene.restart();
    }
    update(time, delta) {
      if (this.isGameOver) return;
      const dt = delta / 1e3;
      this.distance = Math.max(this.distance, this.player.x - GAME.player.startX);
      this.distanceText.setText(Math.floor(this.distance) + " \u043C");
      const kmh = Math.floor(this.player.speed * 0.12);
      this.speedText.setText(kmh + " \u043A\u043C/\u0447");
      const newLevel = Math.floor(this.distance / 500) + 1;
      if (newLevel !== this.level) {
        this.level = newLevel;
        this.levelText.setText("\u0423\u0420\u041E\u0412\u0415\u041D\u042C " + this.level + " \u2014 " + LEVEL_PALETTES[Math.min(Math.floor((this.level - 1) / 2), LEVEL_PALETTES.length - 1)].name);
        this.tweens.add({
          targets: this.levelText,
          scaleX: 1.3,
          scaleY: 1.3,
          duration: 200,
          yoyo: true
        });
        const paletteIdx = Math.min(Math.floor((this.level - 1) / 2), LEVEL_PALETTES.length - 1);
        if (paletteIdx !== this.currentPaletteIdx) {
          this.currentPaletteIdx = paletteIdx;
          const p = LEVEL_PALETTES[paletteIdx];
          this.updateSkyGradient(p.top, p.bottom);
          this.sky.setTexture("skyGradient");
          for (const b of this.buildings) {
            b.sprite.setFillStyle(Phaser.Utils.Array.GetRandom(p.buildings));
          }
        }
      }
      this.player.speed = Math.min(
        this.player.speed + GAME.player.speedIncrement * dt,
        GAME.player.runSpeedMax
      );
      this.player.body.setVelocityX(this.player.speed);
      if (this.isHolding && this.player.isGrounded) {
        const holdDuration = this.time.now - this.holdStartTime;
        const progress = Math.min(holdDuration / GAME.controls.tapThreshold, 1);
        this.jumpPowerBg.setVisible(true);
        this.jumpPowerBar.setVisible(true);
        this.jumpPowerLabel.setVisible(true);
        this.jumpPowerBar.width = progress * 200;
        if (progress >= 1) {
          this.jumpPowerBar.setFillStyle(15158332);
          this.jumpPowerLabel.setText("\u041E\u0422\u041F\u0423\u0421\u0422\u0418!");
          this.jumpPowerLabel.setColor("#e74c3c");
        } else {
          this.jumpPowerBar.setFillStyle(15844367);
          this.jumpPowerLabel.setText("\u0417\u0410\u0420\u042F\u0414\u041A\u0410...");
          this.jumpPowerLabel.setColor("#f1c40f");
        }
      } else {
        this.jumpPowerBg.setVisible(false);
        this.jumpPowerBar.setVisible(false);
        this.jumpPowerLabel.setVisible(false);
      }
      let nearestDist = Infinity;
      let nearestGopnik = null;
      for (let i = this.gopniki.length - 1; i >= 0; i--) {
        const gop = this.gopniki[i];
        if (!gop || !gop.active) {
          this.gopniki.splice(i, 1);
          continue;
        }
        const distToPlayer = this.player.x - gop.x;
        const targetSpeed = this.player.speed + Math.max(0, (distToPlayer - 300) * 0.1);
        gop.gopnikSpeed = Phaser.Math.Linear(gop.gopnikSpeed, targetSpeed, 0.01);
        gop.body.setVelocityX(gop.gopnikSpeed);
        if (distToPlayer < nearestDist && distToPlayer > 0) {
          nearestDist = distToPlayer;
          nearestGopnik = gop;
        }
      }
      if (nearestGopnik && nearestDist < 400) {
        this.dangerText.setText("\u26A0\uFE0F \u0413\u041E\u041F\u041D\u0418\u041A\u0418 \u0421\u0417\u0410\u0414\u0418! " + Math.floor(nearestDist) + "\u043C");
        this.dangerText.setVisible(true);
        if (!this._dangerSoundPlayed) {
          SoundManager_default.play("danger");
          this._dangerSoundPlayed = true;
        }
      } else {
        this.dangerText.setVisible(false);
        this._dangerSoundPlayed = false;
      }
      this.checkCollisions();
      this.sky.tilePositionX = this.cameras.main.scrollX * 0.1;
      const camX = this.cameras.main.scrollX;
      this.groundTile.x = camX + GAME.width / 2;
      this.groundTile.tilePositionX = camX;
      this.grassTile.x = camX + GAME.width / 2;
      this.grassTile.tilePositionX = camX;
      this.edgeLine.x = camX + GAME.width / 2;
      this.edgeLine.tilePositionX = camX;
      for (const b of this.buildings) {
        if (b.sprite.x + b.w / 2 < camX - 50) {
          const rightmost = Math.max(...this.buildings.map((b2) => b2.sprite.x + b2.w / 2));
          b.sprite.x = rightmost + Phaser.Math.Between(10, 40) + b.w / 2;
        }
      }
      if (time - this.startTime > GAME.spawn.gopnikDelay && this.gopniki.length === 0) {
        this.spawnGopnik();
      }
      if (this.player.y > GAME.groundY + 150) {
        this.player.die();
        this.triggerGameOver();
      }
    }
  };

  // src/scenes/OutroScene.js
  var OutroScene = class extends Phaser.Scene {
    constructor() {
      super({ key: "OutroScene" });
    }
    init(data) {
      this.finalDistance = data.distance || 0;
      this.finalCoins = data.coins || 0;
      this.isNewBest = data.isNewBest || false;
    }
    create() {
      const w = this.scale.width;
      const h = this.scale.height;
      this.cameras.main.setBackgroundColor("#1a1a2e");
      const lbBtn = this.add.text(20, 20, "\u{1F3C6} \u041B\u0438\u0434\u0435\u0440\u044B", {
        font: "14px monospace",
        fill: "#888"
      }).setInteractive();
      lbBtn.on("pointerdown", () => {
        this.scene.start("LeaderboardScene");
      });
      const balcony = this.add.sprite(w / 2, 80, "balcony");
      balcony.setDisplaySize(w * 0.8, 60);
      const mama = this.add.sprite(w / 2 - 20, 70, "mama");
      mama.setDisplaySize(36, 54);
      const gopY = h - 80;
      const gopniks = [];
      for (let i = -1; i <= 1; i++) {
        const g = this.add.sprite(w / 2 + i * 50, gopY, "gopnik_run1");
        g.setDisplaySize(30, 45);
        g.setFlipX(true);
        g.play("gopnik_run");
        gopniks.push(g);
      }
      for (const g of gopniks) {
        this.tweens.add({
          targets: g,
          x: w + 100,
          duration: 2e3,
          ease: "Power2"
        });
      }
      const savedText = this.add.text(w / 2, h / 2 - 40, "\u041C\u0410\u041C\u0410 \u0421\u041F\u0410\u0421\u041B\u0410!", {
        font: "bold 28px monospace",
        fill: "#2ecc71",
        stroke: "#000",
        strokeThickness: 4
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: savedText,
        alpha: 1,
        y: h / 2 - 60,
        duration: 800,
        delay: 500,
        ease: "Back.out"
      });
      const resultText = this.add.text(
        w / 2,
        h / 2 + 20,
        `\u0414\u0438\u0441\u0442\u0430\u043D\u0446\u0438\u044F: ${Math.floor(this.finalDistance)} \u043C
\u041C\u043E\u043D\u0435\u0442: ${this.finalCoins} \u20BD`,
        { font: "18px monospace", fill: "#fff", align: "center", stroke: "#000", strokeThickness: 2 }
      ).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: resultText,
        alpha: 1,
        duration: 600,
        delay: 1200
      });
      if (this.isNewBest) {
        const bestText = this.add.text(w / 2, h / 2 + 70, "\u{1F525} \u041D\u041E\u0412\u042B\u0419 \u0420\u0415\u041A\u041E\u0420\u0414! \u{1F525}", {
          font: "bold 20px monospace",
          fill: "#f1c40f",
          stroke: "#000",
          strokeThickness: 3
        }).setOrigin(0.5).setAlpha(0);
        this.tweens.add({
          targets: bestText,
          alpha: 1,
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 400,
          delay: 1500,
          yoyo: true,
          repeat: 2
        });
      }
      const btnBg = this.add.rectangle(w / 2, h - 60, 180, 44, 3066993).setInteractive();
      btnBg.setStrokeStyle(2, 2600544);
      const btnText = this.add.text(w / 2, h - 60, "\u0415\u0429\u0401 \u0420\u0410\u0417", {
        font: "bold 18px monospace",
        fill: "#fff"
      }).setOrigin(0.5);
      this.tweens.add({
        targets: [btnBg, btnText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
      btnBg.on("pointerdown", () => {
        this.scene.start("GameScene");
      });
      this.input.once("pointerdown", () => {
        this.scene.start("GameScene");
      });
    }
  };

  // src/scenes/LeaderboardScene.js
  var LeaderboardScene = class extends Phaser.Scene {
    constructor() {
      super({ key: "LeaderboardScene" });
    }
    create() {
      const w = this.scale.width;
      const h = this.scale.height;
      this.cameras.main.setBackgroundColor("#1a1a2e");
      this.add.text(w / 2, 40, "\u{1F3C6} \u041B\u0418\u0414\u0415\u0420\u0411\u041E\u0420\u0414", {
        font: "bold 28px monospace",
        fill: "#f1c40f",
        stroke: "#000",
        strokeThickness: 4
      }).setOrigin(0.5);
      const best = parseInt(localStorage.getItem("bestDistance") || "0");
      this.add.text(w / 2, 80, `\u0422\u0432\u043E\u0439 \u0440\u0435\u043A\u043E\u0440\u0434: ${best} \u043C`, {
        font: "18px monospace",
        fill: "#2ecc71"
      }).setOrigin(0.5);
      const mockData = [
        { name: "\u0413\u043E\u043F\u043D\u0438\u043A_99", dist: 4520 },
        { name: "\u0411\u0430\u043B\u0430\u043B\u0430\u0439\u043A\u0430", dist: 3890 },
        { name: "\u041A\u0435\u0444\u0438\u0440\u0447\u0438\u043A", dist: 3150 },
        { name: "\u0422\u0430\u043F\u043E\u0447\u043A\u0438", dist: 2780 },
        { name: "\u0412\u043E\u0432\u0430\u043D", dist: 2450 },
        { name: "\u0410\u0434\u0438\u0434\u0430\u0441", dist: 2100 },
        { name: "\u041C\u0430\u043C\u043A\u0438\u043D\u0421\u044B\u043D", dist: 1850 },
        { name: "\u0411\u043E\u0440\u0449", dist: 1520 },
        { name: "\u0421\u0435\u043C\u043A\u0438", dist: 1200 },
        { name: "\u041F\u0435\u043B\u044C\u043C\u0435\u043D\u044C", dist: 980 }
      ];
      const isInTop = best > mockData[mockData.length - 1].dist;
      let startY = 120;
      mockData.forEach((row, i) => {
        const y = startY + i * 36;
        const isMe = best === row.dist;
        if (isMe) {
          this.add.rectangle(w / 2, y, w * 0.85, 32, 3066993).setAlpha(0.2);
        } else if (i % 2 === 0) {
          this.add.rectangle(w / 2, y, w * 0.85, 32, 2236962).setAlpha(0.3);
        }
        const medal = i < 3 ? ["\u{1F947}", "\u{1F948}", "\u{1F949}"][i] : `${i + 1}.`;
        this.add.text(50, y, medal, { font: "18px monospace" }).setOrigin(0, 0.5);
        this.add.text(90, y, row.name, {
          font: "16px monospace",
          fill: isMe ? "#2ecc71" : "#fff"
        }).setOrigin(0, 0.5);
        this.add.text(w - 50, y, `${row.dist} \u043C`, {
          font: "16px monospace",
          fill: isMe ? "#2ecc71" : "#aaa"
        }).setOrigin(1, 0.5);
      });
      if (isInTop && !mockData.some((r) => r.dist === best)) {
        const y = startY + mockData.length * 36 + 10;
        this.add.rectangle(w / 2, y, w * 0.85, 32, 3066993).setAlpha(0.2);
        this.add.text(50, y, "\u{1F464}", { font: "18px monospace" }).setOrigin(0, 0.5);
        this.add.text(90, y, "\u0422\u042B", { font: "bold 16px monospace", fill: "#2ecc71" }).setOrigin(0, 0.5);
        this.add.text(w - 50, y, `${best} \u043C`, { font: "16px monospace", fill: "#2ecc71" }).setOrigin(1, 0.5);
      }
      const btnBg = this.add.rectangle(w / 2, h - 50, 160, 44, 15158332).setInteractive();
      btnBg.setStrokeStyle(2, 12597547);
      this.add.text(w / 2, h - 50, "\u25B6\uFE0F \u0418\u0413\u0420\u0410\u0422\u042C", {
        font: "bold 20px monospace",
        fill: "#fff"
      }).setOrigin(0.5);
      btnBg.on("pointerdown", () => {
        this.scene.start("GameScene");
      });
      const menuBtn = this.add.text(20, h - 20, "\u2190 \u041C\u0435\u043D\u044E", {
        font: "14px monospace",
        fill: "#888"
      }).setOrigin(0, 1).setInteractive();
      menuBtn.on("pointerdown", () => {
        this.scene.start("IntroScene");
      });
    }
  };

  // src/utils/supabase.js
  var SUPABASE_URL = "";
  var SUPABASE_KEY = "";
  var supabase = null;
  async function initSupabase() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.warn("[Supabase] \u041D\u0435\u0442 \u043A\u043B\u044E\u0447\u0435\u0439. \u041B\u0438\u0434\u0435\u0440\u0431\u043E\u0440\u0434 \u043E\u0442\u043A\u043B\u044E\u0447\u0451\u043D.");
      return null;
    }
    try {
      const { createClient } = await import("./supabase-stub.js");
      supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
      return supabase;
    } catch (e) {
      console.warn("[Supabase] \u041C\u043E\u0434\u0443\u043B\u044C \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D:", e.message);
      return null;
    }
  }

  // src/main.js
  var Phaser2 = window.Phaser;
  if (!Phaser2) {
    document.body.innerHTML = '<div style="color:red;padding:20px;font:18px monospace">\u041E\u0448\u0438\u0431\u043A\u0430: Phaser \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D.</div>';
    throw new Error("Phaser not loaded");
  }
  if (window.location.href.includes("t.me") || window.Telegram?.WebApp) {
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.onload = () => {
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready?.();
        tg.expand?.();
        tg.requestFullscreen?.();
        tg.setBackgroundColor?.("#1a1a1a");
      }
    };
    document.head.appendChild(script);
  }
  var config = {
    type: Phaser2.AUTO,
    width: GAME.width,
    height: GAME.height,
    parent: "game-container",
    backgroundColor: "#1a1a1a",
    scale: {
      mode: Phaser2.Scale.FIT,
      autoCenter: Phaser2.Scale.CENTER_BOTH
    },
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: GAME.gravity },
        debug: false
      }
    },
    scene: [IntroScene, GameScene, OutroScene, LeaderboardScene]
  };
  var game = new Phaser2.Game(config);
  window.game = game;
  window.addEventListener("resize", () => game.scale.refresh());
  initSupabase().then((client) => {
    if (client) console.log("[Supabase] \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D");
  });
})();
