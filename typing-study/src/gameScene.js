import InputHandler from './inputHandler.js';

export default class GameScene extends Phaser.Scene {
  constructor(){ super('game'); }
  preload(){ this.load.json('vocab','/highschool_terms_1000.json'); }
  create(){
    this.vocab = this.cache.json.get('vocab') || [];
    // HUD
    this.score = 0;
    this.combo = 0;
    this.lives = 5;
    this.scoreText = this.add.text(10,10,'Score: 0',{font:'20px Arial',fill:'#fff'});
    this.comboText = this.add.text(10,40,'Combo: 0',{font:'16px Arial',fill:'#fff'});
    this.livesText = this.add.text(10,64,'Lives: 5',{font:'16px Arial',fill:'#fff'});

    // group for enemies
    this.enemies = this.physics.add.group();

    // input handler
    this.inputHandler = new InputHandler(this, {romajiMode:true});
    this.inputText = this.add.text(10,520,'Input: ',{font:'18px Arial',fill:'#0f0'});

    // spawn parameters
    this.spawnInterval = 2000; // ms
    this.spawnTimer = this.time.addEvent({ delay: this.spawnInterval, callback: this.spawnEnemy, callbackScope: this, loop:true });

    // listen to input updates
    this.events.on('input:update', (buf)=>{
      this.inputText.setText('Input: ' + buf);
      this.checkMatches(buf);
    });
  }

  spawnEnemy(){
    if(this.vocab.length === 0) return;
    const idx = Phaser.Math.Between(0, this.vocab.length - 1);
    const term = this.vocab[idx].term;
    const x = Phaser.Math.Between(60, this.scale.width - 60);
    const y = -50;

    // create text object with emoji and term
    const emoji = this.add.text(0,0,'🍜',{font:'28px Arial'});
    const label = this.add.text(32,0,term,{font:'20px Arial',fill:'#fff'});

    const container = this.add.container(x,y,[emoji,label]);
    // position label relative
    label.setOrigin(0,0.5);
    emoji.setOrigin(0,0.5);

    // enable physics on container by adding a invisible rectangle body
    this.physics.world.enable(container);
    container.body.setSize(200,40);
    container.body.setVelocity(0, 40 + Phaser.Math.Between(0,40)); // move down
    container.body.setCollideWorldBounds(false);
    container.term = term;

    this.enemies.add(container);
  }

  checkMatches(buffer){
    // iterate enemies and test match; favor closest to player (largest y)
    const children = this.enemies.getChildren().slice().sort((a,b)=>b.y - a.y);
    for(const e of children){
      if(this.inputHandler.matches(e.term)){
        this.onEnemyDefeated(e);
        break; // consume input for one enemy
      }
    }
  }

  onEnemyDefeated(enemy){
    // small effect
    const x = enemy.x, y = enemy.y;
    this.add.tween({ targets: enemy, alpha: 0, duration: 200, onComplete: ()=>{ enemy.destroy(); } });
    // score & combo
    this.combo += 1;
    this.score += 10 * this.combo;
    this.scoreText.setText('Score: ' + this.score);
    this.comboText.setText('Combo: ' + this.combo);
    // clear input
    this.inputHandler.clear();
  }

  update(time, delta){
    // check enemies reaching bottom
    const children = this.enemies.getChildren();
    for(const e of children){
      if(e.y > this.scale.height - 60){
        // enemy reached player
        this.onEnemyHit(e);
      }
    }
  }

  onEnemyHit(enemy){
    enemy.destroy();
    this.lives -= 1;
    this.combo = 0;
    this.livesText.setText('Lives: ' + this.lives);
    this.comboText.setText('Combo: ' + this.combo);
    if(this.lives <= 0){
      this.gameOver();
    }
  }

  gameOver(){
    // simple game over
    this.scene.pause();
    this.add.text(this.scale.width/2 - 80, this.scale.height/2, 'GAME OVER', {font:'40px Arial', fill:'#f00'});
  }
}
