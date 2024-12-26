let player1, player2;
let projectiles = [];
let backgroundImg;
let player1Sprites = {
    default: { sheet: null, w: 56, h: 51, frames: 5 },
    attack: { sheet: null, w: 62, h: 62, frames: 5 },
    jump: { sheet: null, w: 73, h: 51, frames: 3 }
};
let player2Sprites = {
    default: { sheet: null, w: 33, h: 28, frames: 5},
    attack: { sheet: null, w: 38, h: 26, frames: 6 },
    jump: { sheet: null, w: 41, h: 28, frames: 5 }
};
let explosionImg;
let bgX = 0;
let gameStarted = false;
let winner = null;
let gameOver = false;

function preload() {
    // 載入所有圖片
    backgroundImg = loadImage('background.png');
    explosionImg = loadImage('boom.png');
    
    // 載入玩家1的三個動作精靈圖
    player1Sprites.default.sheet = loadImage('player1_default_sprite.png');
    player1Sprites.attack.sheet = loadImage('player1_attack_sprite.png');
    player1Sprites.jump.sheet = loadImage('player1_jump_sprite.png');
    
    // 載入玩家2的三個動作精靈圖
    player2Sprites.default.sheet = loadImage('player2_default_sprite.png');
    player2Sprites.attack.sheet = loadImage('player2_attack_sprite.png');
    player2Sprites.jump.sheet = loadImage('player2_jump_sprite.png');
}

function setup() {
    // 創建畫布並設定正確的尺寸
    let canvas = createCanvas(800, 600);
    canvas.parent('game-container');
    
    // 設定畫布的像素密度為 1，避免高 DPI 顯示器的縮放問題
    pixelDensity(1);
    
    // 創建兩個玩家
    player1 = new Player(100, 400, player1Sprites, true);
    player2 = new Player(600, 400, player2Sprites, false);
}

function draw() {
    // 檢查遊戲是否結束
    if (gameOver) {
        drawGameOver();
        return; // 如果遊戲結束，不執行其他更新
    }

    // 繪製背景
    drawBackground();
    
    // 更新和繪製玩家
    player1.update();
    player2.update();
    player1.display();
    player2.display();
    
    // 更新和繪製子彈
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let projectile = projectiles[i];
        projectile.update();
        projectile.display();
        
        // 分別檢查與兩個玩家的碰撞
        let hitPlayer1 = projectile.checkCollision(player1);
        let hitPlayer2 = projectile.checkCollision(player2);
        
        // 如果發生碰撞，移除子彈
        if (hitPlayer1 || hitPlayer2) {
            projectiles.splice(i, 1);
        }
    }
    
    // 繪製 UI
    drawUI();
    
    // 檢查遊戲結束條件
    checkGameOver();
}

class Player {
    constructor(x, y, sprites, isPlayer1) {
        this.x = x;
        this.y = y;
        this.sprites = sprites;
        this.isPlayer1 = isPlayer1;
        this.health = 100;
        this.speed = 5;
        this.currentAction = 'default';  // 目前動作
        this.frameIndex = 0;  // 當前幀索引
        this.frameDelay = 5;  // 動畫速度控制
        this.frameCount = 0;  // 幀計數器
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.name = isPlayer1 ? "Player 1" : "Player 2";
        this.surrendered = false;  // 新增投降狀態
    }
    
    update() {
        if (gameOver) return; // 如果遊戲結束，不更新玩家狀態
        
        // 更新動畫幀
        this.frameCount++;
        if (this.frameCount >= this.frameDelay) {
            this.frameCount = 0;
            this.frameIndex = (this.frameIndex + 1) % this.sprites[this.currentAction].frames;
        }

        if (this.isPlayer1) {
            // 玩家1控制 (WASD)
            if (keyIsDown(65)) this.x -= this.speed; // A
            if (keyIsDown(68)) this.x += this.speed; // D
            if (keyIsDown(87)) {
                this.currentAction = 'jump';
            } else if (keyIsDown(83)) {
                this.currentAction = 'attack';
            } else {
                this.currentAction = 'default';
            }
        } else {
            // 玩家2控制 (方向鍵)
            if (keyIsDown(LEFT_ARROW)) this.x -= this.speed;
            if (keyIsDown(RIGHT_ARROW)) this.x += this.speed;
            if (keyIsDown(UP_ARROW)) {
                this.currentAction = 'jump';
            } else if (keyIsDown(DOWN_ARROW)) {
                this.currentAction = 'attack';
            } else {
                this.currentAction = 'default';
            }
        }
    }
    
    display() {
        let sprite = this.sprites[this.currentAction];
        let sx = this.frameIndex * sprite.w;  // 精靈圖中的源X座標
        
        // 從精靈圖中裁切並顯示幀
        image(sprite.sheet, 
              this.x, this.y,           // 目標位置
              sprite.w, sprite.h,       // 目標大小
              sx, 0,                    // 源位置
              sprite.w, sprite.h);      // 源大小
    }

    surrender() {
        this.surrendered = true;
        this.health = 0;  // 投降時血量歸零
    }
}

class Projectile {
    constructor(x, y, isGoingRight) {
        this.x = x;
        this.y = y;
        this.direction = isGoingRight ? 1 : -1;
        this.size = 20;
        this.isFromPlayer1 = isGoingRight; // 記錄子彈來源
        
        if (isGoingRight) { // player1
            this.speed = 8;
            this.maxDistance = 400;
            this.distanceTraveled = 0;
        } else { // player2
            this.speed = 7;
            this.maxDistance = 400;
            this.distanceTraveled = 0;
        }
    }
    
    update() {
        // 更新位置
        let moveAmount = this.speed * this.direction;
        this.x += moveAmount;
        
        // 計算已移動距離
        this.distanceTraveled += Math.abs(moveAmount);
        
        // 在控制台輸出距離資訊（用於除錯）
        // console.log("Distance traveled:", this.distanceTraveled, "Max:", this.maxDistance);
        
        // 檢查是否超過最大射程
        if (this.distanceTraveled >= this.maxDistance || 
            this.x < 0 || this.x > width) {
            let index = projectiles.indexOf(this);
            if (index > -1) {
                projectiles.splice(index, 1);
            }
        }
    }
    
    display() {
        push();
        // 根據已移動距離計算透明度
        let alpha = map(this.distanceTraveled, 
                       0, 
                       this.maxDistance,
                       255, 
                       50); // 最小透明度設為 50，讓子彈更容易看見
        
        if (explosionImg) {
            tint(255, alpha);
            image(explosionImg, this.x, this.y, this.size, this.size);
        } else {
            fill(this.direction > 0 ? color(255, 0, 0, alpha) : color(0, 0, 255, alpha));
            stroke(255, alpha);
            strokeWeight(2);
            ellipse(this.x, this.y, this.size);
            
            // 移動方向指示
            line(this.x, this.y, 
                 this.x + (10 * this.direction), this.y);
        }
        pop();
    }
    
    checkCollision(player) {
        // 確保子彈不會傷害發射的玩家
        if ((this.isFromPlayer1 && player === player1) || 
            (!this.isFromPlayer1 && player === player2)) {
            return false;
        }
        
        // 碰撞檢測
        let hit = collideRectRect(
            this.x - this.size/2, 
            this.y - this.size/2, 
            this.size, 
            this.size,
            player.x, 
            player.y,
            player.sprites[player.currentAction].w,
            player.sprites[player.currentAction].h
        );
        
        if (hit) {
            console.log(`Hit detected! Damage dealt to ${player === player1 ? "Player 1" : "Player 2"}`);
            player.health -= 10;
            return true;
        }
        return false;
    }
}

function keyPressed() {
    if (gameOver) {
        if (keyCode === 82) { // R key
            resetGame();
        }
        return false;
    }
    
    // 投降功能
    if (keyCode === 83) { // S key for Player 1 surrender
        player1.surrender();
    }
    if (keyCode === DOWN_ARROW) { // 下鍵 for Player 2 surrender
        player2.surrender();
    }
    
    // 發射子彈
    if (keyCode === 70) { // F key for player1
        let projectile = new Projectile(
            player1.x + player1.sprites[player1.currentAction].w,
            player1.y + player1.sprites[player1.currentAction].h/2,
            true
        );
        projectiles.push(projectile);
    }
    
    if (keyCode === 76) { // L key for player2
        let projectile = new Projectile(
            player2.x,
            player2.y + player2.sprites[player2.currentAction].h/2,
            false
        );
        projectiles.push(projectile);
    }
    
    return false;
}

function drawBackground() {
    // 繪製捲動背景
    image(backgroundImg, bgX, 0, width, height);
    image(backgroundImg, bgX + width, 0, width, height);
    
    // 背景捲動
    bgX -= 1;
    if (bgX <= -width) {
        bgX = 0;
    }
    
    // 添加文字
    textSize(32);
    fill(255, 0, 0);  // 紅色文字
    text('淡江教科', width/2 - 60, 50);
}

function displayHealth() {
    textSize(20);
    fill(255, 0, 0);  // 紅色文字
    text(`Player 1 HP: ${player1.health}`, 20, 30);
    text(`Player 2 HP: ${player2.health}`, width - 150, 30);
}

// 新增繪製 UI 的函數
function drawUI() {
    push();
    
    // 設定文字式
    textSize(16);
    
    // Player 1 & 2 文字和血條
    textAlign(LEFT, TOP);
    fill(0);
    text("Player 1", 20, 20);
    drawHealthBar(20, 40, player1.health, player1.maxHealth);
    
    textAlign(RIGHT, TOP);
    fill(0);
    text("Player 2", width - 20, 20);
    drawHealthBar(width - 220, 40, player2.health, player2.maxHealth);
    
    // 遊戲規則說明
    drawGameRules();
    
    // 遊戲結束訊息
    if (winner) {
        textAlign(CENTER, CENTER);
        textSize(32);
        fill(0);
        text(winner + " Wins!", width/2, height/2);
        textSize(20);
        text("Press R to restart", width/2, height/2 + 40);
    }
    
    pop();
}

// 繪製血條
function drawHealthBar(x, y, health, maxHealth) {
    const barWidth = 200;
    const barHeight = 20;
    
    // 血條背景
    fill(100);
    rect(x, y, barWidth, barHeight);
    
    // 計算血量百分比
    let healthPercent = health / maxHealth;
    
    // 血條顏色根據血量變化
    let barColor = lerpColor(
        color(255, 0, 0),   // 低血量顏色
        color(0, 255, 0),   // 滿血顏色
        healthPercent
    );
    
    // 繪製當前血量
    fill(barColor);
    rect(x, y, barWidth * healthPercent, barHeight);
    
    // 血量數字
    fill(255);
    textAlign(CENTER, CENTER);
    text(Math.ceil(health) + "/" + maxHealth, x + barWidth/2, y + barHeight/2);
}

// 檢查遊戲結束條件
function checkGameOver() {
    if (player1.health <= 0 || player2.health <= 0) {
        gameOver = true;
        if (player1.surrendered) {
            winner = "Player 2 (Player 1 已投降)";
        } else if (player2.surrendered) {
            winner = "Player 1 (Player 2 已投降)";
        } else {
            winner = player1.health <= 0 ? "Player 2" : "Player 1";
        }
    }
}

function drawGameOver() {
    // 繪製半透明黑色背景
    push();
    fill(0, 0, 0, 127);
    rect(0, 0, width, height);
    
    // 繪製遊戲結束訊息
    textAlign(CENTER, CENTER);
    textSize(48);
    fill(255);
    text("GAME OVER", width/2, height/2 - 50);
    
    textSize(32);
    fill(255, 255, 0);
    text(winner + " Wins!", width/2, height/2 + 20);
    
    textSize(24);
    fill(255);
    text("Press R to Restart", width/2, height/2 + 80);
    pop();
}

// 重置遊戲
function resetGame() {
    gameOver = false;
    winner = null;
    player1.health = player1.maxHealth;
    player2.health = player2.maxHealth;
    player1.surrendered = false;  // 重置投降狀態
    player2.surrendered = false;
    projectiles = [];
    player1.x = 100;
    player2.x = 600;
}

function drawGameRules() {
    push();
    textSize(14);
    
    // Player 1 控制 (左上角)
    let p1X = 20;
    let p1Y = 80;
    let lineHeight = 20;
    
    // 左上角 Player 1 控制背景
    noStroke();
    fill(0, 150);
    rect(p1X - 10, p1Y - 25, 160, lineHeight * 6);
    
    // Player 1 控制文字
    fill(255);
    textAlign(LEFT, TOP);
    textStyle(BOLD);
    text("Player 1 控制：", p1X, p1Y);
    textStyle(NORMAL);
    text("- A/D：左右移動", p1X, p1Y + lineHeight);
    text("- W：跳躍動作", p1X, p1Y + lineHeight * 2);
    text("- S：投降", p1X, p1Y + lineHeight * 3);
    text("- F：發射子彈", p1X, p1Y + lineHeight * 4);
    
    // 遊戲規則 (中上方，往下移)
    let rulesX = width / 2;
    let rulesY = 80; // 改為與玩家控制說明同高
    
    // 中上方遊戲規則背景
    fill(0, 150);
    rect(rulesX - 150, rulesY - 10, 300, lineHeight * 4);
    
    // 遊戲規則文字
    fill(255);
    textAlign(CENTER, TOP);
    textStyle(BOLD);
    text("遊戲規則：", rulesX, rulesY);
    textStyle(NORMAL);
    text("- 血量歸零即輸", rulesX, rulesY + lineHeight);
    text("- 任一方可投降結束遊戲", rulesX, rulesY + lineHeight * 2);
    text("- 按 R 鍵重新開始", rulesX, rulesY + lineHeight * 3);
    
    // Player 2 控制 (右上角)
    let p2X = width - 20;
    let p2Y = 80;
    
    // 右上角 Player 2 控制背景
    fill(0, 150);
    rect(p2X - 150, p2Y - 25, 160, lineHeight * 6);
    
    // Player 2 控制文字
    fill(255);
    textAlign(RIGHT, TOP);
    textStyle(BOLD);
    text("Player 2 控制：", p2X, p2Y);
    textStyle(NORMAL);
    text("- ←/→：左右移動", p2X, p2Y + lineHeight);
    text("- ↑：跳躍動作", p2X, p2Y + lineHeight * 2);
    text("- ↓：投降", p2X, p2Y + lineHeight * 3);
    text("- L：發射子彈", p2X, p2Y + lineHeight * 4);
    
    pop();
} 