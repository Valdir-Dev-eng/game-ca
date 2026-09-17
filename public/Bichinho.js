class Bichinho extends Player {
  constructor(scene, x, y) {
    super(scene, x, y, 'stop');
    this.DASH_DISTANCE = 150;
    this.DASH_COOLDOWN = 800;
  }

  poder(direction) {
    console.log(`🌀 [PODER] Direção recebida: ${direction}`);
    console.log(`🌀 [PODER] No chão: ${this.sprite.body.touching.down}`);
    
    if (direction === 'down' && this.sprite.body.touching.down) {
      console.log('🚫 [Bichinho] Bloqueado: está no chão!');
      return;
    }

    if (this.dashCooldownTimer > 0) {
      console.log('⏳ Hiraishin em cooldown...');
      return;
    }
    
    this.isDashing = true;
    this.dashCooldownTimer = this.DASH_COOLDOWN;

    let targetX = this.sprite.x;
    let targetY = this.sprite.y;

    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    const TILE_SIZE = 32;
    const floorY = H - (TILE_SIZE / 2);

    switch (direction) {
      case 'left':
        targetX = this.sprite.x - this.DASH_DISTANCE;
        this.sprite.setFlipX(true);
        this.lastDirection = 'left';
        break;
      case 'right':
        targetX = this.sprite.x + this.DASH_DISTANCE;
        this.sprite.setFlipX(false);
        this.lastDirection = 'right';
        break;
      case 'up':
        targetY = this.sprite.y - this.DASH_DISTANCE;
        break;
      case 'down':
        targetY = this.sprite.y + this.DASH_DISTANCE;
        const safeMaxY = floorY - 20;
        if (targetY > safeMaxY) {
          console.log('🚫 [Bichinho] Bloqueado: muito perto do chão!');
          this.isDashing = false;
          this.dashCooldownTimer = 0;
          return;
        }
        break;
    }

    targetX = Phaser.Math.Clamp(targetX, 16, W - 16);
    targetY = Phaser.Math.Clamp(targetY, 16, H - 16);

    this.createSmokeEffect(this.sprite.x, this.sprite.y);
    this.sprite.setVisible(false);
    this.sprite.body.enable = false;

    setTimeout(() => {
      this.sprite.setPosition(targetX, targetY);
      this.createSmokeEffect(targetX, targetY);
      this.sprite.setVisible(true);
      this.sprite.body.enable = true;

      if (this.currentTexture !== 'run') {
        this.sprite.setTexture('run');
        this.currentTexture = 'run';
      }
      this.sprite.play('running', true);
      this.isDashing = false;
    }, 150);
  }

    combo() {
    console.log('⚔️ Combo ativado!');
    
    this.isAttacking = true;
    this.sprite.setVelocity(0, 0);
    
    // Timer de emergência: se a animação travar, força o retorno em 500ms
    this.comboTimeout = this.scene.time.delayedCall(500, () => {
      this._finishCombo();
    });

    if (this.scene.anims.exists('combo_anim')) {
      try {
        this.sprite.play('combo_anim', true);
        
        this.sprite.once('animationcomplete', (sprite, animation) => {
          if (animation.key === 'combo_anim') {
            // Cancela o timer de emergência pois a animação terminou normalmente
            if (this.comboTimeout) this.comboTimeout.remove();
            this._finishCombo();
          }
        });
      } catch (error) {
        console.warn('⚠️ Erro na animação, usando fallback:', error);
        this._fallbackComboEffect();
      }
    } else {
      this._fallbackComboEffect();
    }
  }

  _fallbackComboEffect() {
    if (this.comboTimeout) this.comboTimeout.remove();
    this.sprite.setTint(0xffffff);
    this.scene.time.delayedCall(200, () => {
      this.sprite.clearTint();
      this._finishCombo();
    });
  }

  _finishCombo() {
    this.sprite.anims.stop();
    this.sprite.setTexture('stop', 0);
    this.currentTexture = 'stop';
    this.isAttacking = false;
    console.log('✨ Combo finalizado, voltando ao idle.');
  }

  // Efeito de segurança caso a imagem da animação falhe
  _fallbackComboEffect() {
    this.sprite.setTint(0xffffff); // Pisca branco
    this.scene.time.delayedCall(200, () => {
      this.sprite.clearTint();
      this._finishCombo();
    });
  }

  // Finaliza o combo e volta ao normal
  _finishCombo() {
    this.sprite.anims.stop();
    this.sprite.setTexture('stop', 0);
    this.currentTexture = 'stop';
    this.isAttacking = false;
    console.log('✨ Combo finalizado, voltando ao idle.');
  }

  onJump() {
    this.sprite.setTexture('jump');
    this.currentTexture = 'jump';
    this.sprite.play('jumping', true);
    this.sprite.setFlipX(this.lastDirection === 'left');
  }

  createSmokeEffect(x, y) {
    const smoke = this.scene.add.sprite(x, y, 'smoke_01');
    smoke.setScale(0.2);
    smoke.setOrigin(0.5, 0.5);
    smoke.play('smoke_puff');
    smoke.setDepth(100);
    smoke.on('animationcomplete', () => smoke.destroy());
  }
}