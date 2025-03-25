class Player extends PhysicsObject {
    constructor(scene, x, y, options = {}) {
        // Set player-specific default options
        const playerOptions = Object.assign({
            shape: 'circle',
            radius: 25,
            color: 0x00aaff,
            label: 'player',
            friction: 0.05,
            frictionAir: 0.01,
            restitution: 0.7,
            density: 0.002,
            collisionCategory: 2,
            maxSpeed: 10,
            moveForce: 0.005
        }, options);
        
        super(scene, x, y, playerOptions);
        
        // Player-specific properties
        this.isMoving = false;
        this.moveDirection = { x: 0, y: 0 };
        this.createControls();
        
        // Track whether player has reached the goal
        this.hasReachedGoal = false;
    }
    
    createControls() {
        // Create cursor keys
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        
        // Add WASD controls - FIX: use lowercase key properties
        this.wasd = this.scene.input.keyboard.addKeys({
            w: Phaser.Input.Keyboard.KeyCodes.W,
            a: Phaser.Input.Keyboard.KeyCodes.A,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            d: Phaser.Input.Keyboard.KeyCodes.D,
            space: Phaser.Input.Keyboard.KeyCodes.SPACE
        });
    }
    
    update() {
        try {
            // Make sure we have valid inputs
            if (!this.cursors || !this.wasd) {
                this.createControls();
            }
            
            this.handleInput();
            this.handleMovement();
            this.checkVelocity();
        } catch (e) {
            console.error("Error in player update:", e);
        }
    }
    
    handleInput() {
        // Reset movement direction
        this.moveDirection = { x: 0, y: 0 };
        
        // Check arrow keys - FIX: use lowercase properties for WASD
        if (this.cursors.left.isDown || this.wasd.a.isDown) {
            this.moveDirection.x = -1;
        }
        
        if (this.cursors.right.isDown || this.wasd.d.isDown) {
            this.moveDirection.x = 1;
        }
        
        if (this.cursors.up.isDown || this.wasd.w.isDown) {
            this.moveDirection.y = -1;
        }
        
        if (this.cursors.down.isDown || this.wasd.s.isDown) {
            this.moveDirection.y = 1;
        }
        
        // Is the player trying to move?
        this.isMoving = this.moveDirection.x !== 0 || this.moveDirection.y !== 0;
        
        // Check for space (special action) - FIX: use lowercase for space
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space) || 
            Phaser.Input.Keyboard.JustDown(this.wasd.space)) {
            this.specialAction();
        }
    }
    
    handleMovement() {
        if (!this.isMoving) return;
        
        // Normalize the direction vector to avoid diagonal movement being faster
        const normalizedDirection = Phaser.Math.Vector2.Normalize(
            new Phaser.Math.Vector2(this.moveDirection.x, this.moveDirection.y)
        );
        
        // Apply force in the direction of movement
        this.applyForce({
            x: normalizedDirection.x * this.options.moveForce,
            y: normalizedDirection.y * this.options.moveForce
        });
    }
    
    checkVelocity() {
        // Enforce maximum speed
        const velocity = this.body.velocity;
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed > this.options.maxSpeed) {
            const ratio = this.options.maxSpeed / speed;
            this.setVelocity(velocity.x * ratio, velocity.y * ratio);
        }
    }
    
    specialAction() {
        // This can be customized per level
        // Default implementation: small bounce/jump
        this.applyForce({ x: 0, y: -0.05 });
    }
    
    reachedGoal() {
        if (this.hasReachedGoal) return;
        
        this.hasReachedGoal = true;
        
        // Create a success effect
        const celebrateEffect = () => {
            try {
                const particles = this.scene.add.particles(this.body.position.x, this.body.position.y, 'particle', {
                    speed: { min: 100, max: 200 },
                    scale: { start: 1, end: 0 },
                    blendMode: 'ADD',
                    lifespan: 1000
                });
                
                // Stop emitting after 500ms
                this.scene.time.delayedCall(500, () => {
                    particles.stop();
                });
                
                // Complete level after animation
                this.scene.time.delayedCall(1500, () => {
                    GAME.completeLevel();
                });
            } catch (e) {
                console.error("Error creating particles:", e);
                // Complete level immediately if there's an error
                GAME.completeLevel();
            }
        };
        
        // If particles aren't loaded yet, skip the effect
        if (this.scene.textures.exists('particle')) {
            celebrateEffect();
        } else {
            console.log("Particle texture not found - skipping effect");
            this.scene.time.delayedCall(1000, () => {
                GAME.completeLevel();
            });
        }
    }
}