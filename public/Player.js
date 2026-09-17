class Player {
  constructor(scene, x, y, key) {
    if (new.target === Player) {
      throw new Error('Não é possível instanciar a classe Player diretamente.');
    }

    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, key);
    this.sprite.setScale(3);
    this.sprite.setBounce(0.1);
    this.sprite.setCollideWorldBounds(true);

    this.sprite.setMass(1);
    this.sprite.setDrag(0, 0);

    this.lastDirection = 'right';
    this.currentTexture = 'stop';
    this.isJumping = false;
    this.isDashing = false;
    this.isAttacking = false;
    this.dashCooldownTimer = 0;

    this.SPEED = 200;
    this.JUMP_FORCE = -500;

    this.cursors = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE,
      enter: Phaser.Input.Keyboard.KeyCodes.ENTER
    });
  }

  poder(direction) {
    throw new Error('Método poder() deve ser implementado pela subclasse.');
  }

  combo() {
    // Método base vazio
  }
  update(time, delta, platforms) {
    if (this.dashCooldownTimer > 0) {
      this.dashCooldownTimer -= delta;
    }

    const isOnGround = this.sprite.body.touching.down;

    let moving = false;
    let directionHeld = null;

    // Combina input do teclado E do celular
    const isLeft = this.cursors.left.isDown || (window.celularButtons && window.celularButtons.left);
    const isRight = this.cursors.right.isDown || (window.celularButtons && window.celularButtons.right);
    const isUp = this.cursors.up.isDown || (window.celularButtons && window.celularButtons.up);
    const isDown = this.cursors.down.isDown || (window.celularButtons && window.celularButtons.down);

    if (isLeft) {
      directionHeld = 'left';
    } else if (isRight) {
      directionHeld = 'right';
    } else if (isUp) {
      directionHeld = 'up';
    } else if (isDown) {
      directionHeld = 'down';
    }

    // Ativação do poder via TECLADO (Shift + direção)
    // Nota: O botão 'B' do celular já é tratado diretamente no game.js chamando player.poder()
    if (Phaser.Input.Keyboard.JustDown(this.cursors.shift) && directionHeld) {
      if (directionHeld === 'down' && isOnGround) {
        console.log('❌ Poder bloqueado: precisa estar no ar');
      } else {
        this.poder(directionHeld);
      }
    }

    // Movimento normal
    if (!this.isDashing && !this.isAttacking) {
      if (isLeft) {
        this.sprite.setVelocityX(-this.SPEED);
        this.sprite.setFlipX(true);
        this.lastDirection = 'left'; // ✅ Atualiza direção
        moving = true;
      } else if (isRight) {
        this.sprite.setVelocityX(this.SPEED);
        this.sprite.setFlipX(false);
        this.lastDirection = 'right'; // ✅ Atualiza direção
        moving = true;
      } else {
        this.sprite.setVelocityX(0);
      }

      // ✅ CORREÇÃO PRINCIPAL: Atualizar lastDirection para CIMA e BAIXO também
      if (isUp) {
        this.lastDirection = 'up';
      } else if (isDown) {
        this.lastDirection = 'down';
      }

      if (isUp && isOnGround && !this.isJumping) {
        this.sprite.setVelocityY(this.JUMP_FORCE);
        this.isJumping = true;
        this.onJump();
      }
    } else if (this.isDashing || this.isAttacking) {
      this.sprite.setVelocityX(0);
    }

    this.updateAnimation(moving, isOnGround);
  }

  onJump() {
    // Default: sem ação especial
  }

  updateAnimation(moving, isOnGround) {
    if (this.isAttacking) return;

    if (!isOnGround) {
      if (!this.isJumping) {
        if (this.currentTexture !== 'run') {
          this.sprite.setTexture('run');
          this.currentTexture = 'run';
        }
        this.sprite.play('running', true);
        this.sprite.setFlipX(this.lastDirection === 'left');
      }
    } else {
      this.isJumping = false;
      if (moving) {
        if (this.currentTexture !== 'run') {
          this.sprite.setTexture('run');
          this.currentTexture = 'run';
        }
        this.sprite.play('running', true);
      } else {
        if (this.currentTexture !== 'stop') {
          this.sprite.setTexture('stop', 0);
          this.currentTexture = 'stop';
          this.sprite.anims.stop();
        }
        this.sprite.setFlipX(this.lastDirection === 'left');
      }
    }
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }
}