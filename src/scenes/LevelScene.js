class LevelScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LevelScene' });
        
        // Level objects
        this.player = null;
        this.goal = null;
        this.objects = [];
        this.levelData = null;
        
        // UI elements
        this.levelText = null;
        this.hintText = null;
        
        // Level time tracking
        this.startTime = 0;
        this.elapsedTime = 0;
        this.timeText = null;
    }
    
    init(data) {
        this.levelNumber = data.level || 1;
    }
    
    preload() {
        // Load assets
        this.load.setPath('src/assets/images/');
        this.load.image('background', 'background.png');
        this.load.image('particle', 'particle.png');
        
        // Handle file loading errors
        this.load.on('fileerror', (key, file) => {
            console.log(`Error loading: ${key}`);
            // Continue with game setup despite errors
        });
        
        // Audio (would add these files in a real implementation)
        // this.load.audio('bounce', 'bounce.mp3');
        // this.load.audio('success', 'success.mp3');
    }
    
    create() {
        // Set up the current level
        this.createLevel(this.levelNumber);
        
        // Add UI elements
        this.createUI();
        
        // Set up collision detection
        this.setupCollisions();
        
        // Start level timer
        this.startTime = this.time.now;
        
        // Add update timer for tracking elapsed time
        this.timeEvent = this.time.addEvent({
            delay: 100,
            callback: this.updateTime,
            callbackScope: this,
            loop: true
        });
    }
    
    update() {
        try {
            // Update player if it exists
            if (this.player && typeof this.player.update === 'function') {
                this.player.update();
            }
            
            // Check if player has fallen off the screen
            if (this.player && this.player.body && 
                this.player.body.position && 
                this.player.body.position.y > this.cameras.main.height + 100) {
                this.resetLevel();
            }
        } catch (e) {
            console.error("Error in level update:", e);
        }
    }
    
    updateTime() {
        this.elapsedTime = this.time.now - this.startTime;
        if (this.timeText) {
            this.timeText.setText(`Time: ${Math.floor(this.elapsedTime / 1000)}s`);
        }
    }
    
    createUI() {
        // Level text
        this.levelText = this.add.text(20, 20, `Level ${this.levelNumber}`, {
            fontFamily: 'Arial',
            fontSize: 24,
            color: '#ffffff'
        });
        
        // Timer text
        this.timeText = this.add.text(20, 50, 'Time: 0s', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ffffff'
        });
        
        // Hint text (different for each level)
        this.hintText = this.add.text(400, 20, this.getLevelHint(), {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ffff00',
            align: 'center'
        }).setOrigin(0.5, 0);
        
        // Reset button
        const resetButton = this.add.text(780, 20, 'Reset', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ffffff',
            backgroundColor: '#880000',
            padding: { x: 10, y: 5 }
        }).setInteractive();
        
        resetButton.on('pointerdown', () => {
            this.resetLevel();
        });
        
        // Menu button
        const menuButton = this.add.text(780, 60, 'Menu', {
            fontFamily: 'Arial',
            fontSize: 18,
            color: '#ffffff',
            backgroundColor: '#000088',
            padding: { x: 10, y: 5 }
        }).setInteractive();
        
        menuButton.on('pointerdown', () => {
            this.scene.start('MainScene');
        });
    }
    
    setupCollisions() {
        // Set up collision detection between player and goal
        this.matter.world.on('collisionstart', (event) => {
            const pairs = event.pairs;
            
            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;
                
                // Check for player-goal collision
                if ((bodyA.label === 'player' && bodyB.label === 'goal') ||
                    (bodyA.label === 'goal' && bodyB.label === 'player')) {
                    this.playerReachedGoal();
                }
            }
        });
    }
    
    playerReachedGoal() {
        if (this.player) {
            this.player.reachedGoal();
        }
    }
    
    resetLevel() {
        // Reset this level
        this.scene.restart({ level: this.levelNumber });
    }
    
    createLevel(levelNumber) {
        // Clear any existing objects
        this.objects = [];
        
        // Set level gravity based on difficulty
        this.matter.world.setGravity(0, 1 * GAME.getDifficultyFactor());
        
        // Create level data
        this.levelData = this.generateLevelData(levelNumber);
        
        // Create level boundaries
        this.createBoundaries();
        
        // Create level objects based on the level data
        this.createLevelObjects();
    }
    
    createBoundaries() {
        // Add floor
        this.objects.push(new PhysicsObject(this, 400, 590, {
            shape: 'rectangle',
            width: 800,
            height: 20,
            isStatic: true,
            color: 0x999999,
            label: 'floor'
        }));
        
        // Add left wall
        this.objects.push(new PhysicsObject(this, -10, 300, {
            shape: 'rectangle',
            width: 20,
            height: 600,
            isStatic: true,
            color: 0x999999,
            label: 'wall'
        }));
        
        // Add right wall
        this.objects.push(new PhysicsObject(this, 810, 300, {
            shape: 'rectangle',
            width: 20,
            height: 600,
            isStatic: true,
            color: 0x999999,
            label: 'wall'
        }));
    }
    
    createLevelObjects() {
        // Create all objects defined in the level data
        if (this.levelData && this.levelData.objects) {
            this.levelData.objects.forEach(obj => {
                if (obj.type === 'player') {
                    this.player = new Player(this, obj.x, obj.y, obj.options);
                } else if (obj.type === 'goal') {
                    this.goal = new PhysicsObject(this, obj.x, obj.y, {
                        shape: 'rectangle',
                        width: 50,
                        height: 50,
                        color: 0x00ff00,
                        isStatic: true,
                        isSensor: true,
                        label: 'goal',
                        ...obj.options
                    });
                    this.objects.push(this.goal);
                } else {
                    this.objects.push(new PhysicsObject(this, obj.x, obj.y, obj.options));
                }
            });
        }
    }
    
    getLevelHint() {
        // Return a hint specific to the current level
        const hints = [
            "Use the arrow keys or WASD to move. Reach the green goal!",
            "Objects with different weights and sizes behave differently!",
            "Try using momentum to reach higher places.",
            "Some objects can be used as platforms or bridges.",
            "Sometimes the direct path isn't the best one.",
            "You can use levers to your advantage!",
            "Balance is key to success!",
            "Create chain reactions to reach your goal.",
            "Timing is everything!",
            "Use all your skills to complete the final challenge!"
        ];
        
        return hints[this.levelNumber - 1] || "Good luck!";
    }
    
    generateLevelData(levelNumber) {
        // Generate level data based on level number
        switch(levelNumber) {
            case 1: return this.createLevel1();
            case 2: return this.createLevel2();
            case 3: return this.createLevel3();
            case 4: return this.createLevel4();
            case 5: return this.createLevel5();
            case 6: return this.createLevel6();
            case 7: return this.createLevel7();
            case 8: return this.createLevel8();
            case 9: return this.createLevel9();
            case 10: return this.createLevel10();
            default: return this.createDefaultLevel();
        }
    }
    
    createLevel1() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 500
                }
            ]
        };
    }
    
    createLevel2() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 300
                },
                {
                    type: 'platform',
                    x: 400,
                    y: 400,
                    options: {
                        shape: 'rectangle',
                        width: 200,
                        height: 20,
                        isStatic: true,
                        color: 0x999999
                    }
                },
                {
                    type: 'block',
                    x: 300,
                    y: 500,
                    options: {
                        shape: 'rectangle',
                        width: 50,
                        height: 50,
                        color: 0xaa8866
                    }
                }
            ]
        };
    }
    
    createLevel3() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 200
                },
                {
                    type: 'platform',
                    x: 300,
                    y: 350,
                    options: {
                        shape: 'rectangle',
                        width: 200,
                        height: 20,
                        isStatic: true,
                        color: 0x999999,
                        angle: 20
                    }
                },
                {
                    type: 'platform',
                    x: 500,
                    y: 250,
                    options: {
                        shape: 'rectangle',
                        width: 200,
                        height: 20,
                        isStatic: true,
                        color: 0x999999
                    }
                }
            ]
        };
    }
    
    createLevel4() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 500
                },
                {
                    type: 'gap',
                    x: 400,
                    y: 550,
                    options: {
                        shape: 'rectangle',
                        width: 200,
                        height: 100,
                        isStatic: true,
                        isSensor: true
                    }
                },
                {
                    type: 'block',
                    x: 200,
                    y: 450,
                    options: {
                        shape: 'rectangle',
                        width: 100,
                        height: 20,
                        color: 0xaa8866
                    }
                }
            ]
        };
    }
    
    createLevel5() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 100
                },
                {
                    type: 'platform',
                    x: 400,
                    y: 300,
                    options: {
                        shape: 'rectangle',
                        width: 400,
                        height: 20,
                        isStatic: true,
                        color: 0x999999
                    }
                },
                {
                    type: 'block',
                    x: 300,
                    y: 250,
                    options: {
                        shape: 'rectangle',
                        width: 50,
                        height: 50,
                        color: 0xaa8866
                    }
                },
                {
                    type: 'block',
                    x: 400,
                    y: 250,
                    options: {
                        shape: 'rectangle',
                        width: 50,
                        height: 50,
                        color: 0xaa8866
                    }
                }
            ]
        };
    }
    
    createLevel6() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 500
                },
                {
                    type: 'platform',
                    x: 400,
                    y: 300,
                    options: {
                        shape: 'rectangle',
                        width: 400,
                        height: 20,
                        isStatic: true,
                        color: 0x999999
                    }
                },
                {
                    type: 'lever',
                    x: 200,
                    y: 280,
                    options: {
                        shape: 'rectangle',
                        width: 100,
                        height: 10,
                        color: 0x8866aa,
                        density: 0.002
                    }
                },
                {
                    type: 'weight',
                    x: 150,
                    y: 200,
                    options: {
                        shape: 'circle',
                        radius: 25,
                        color: 0xaa6688,
                        density: 0.005
                    }
                }
            ]
        };
    }
    
    createLevel7() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 500
                },
                {
                    type: 'seesaw',
                    x: 400,
                    y: 400,
                    options: {
                        shape: 'rectangle',
                        width: 300,
                        height: 20,
                        color: 0x8866aa,
                        density: 0.001
                    }
                },
                {
                    type: 'pivot',
                    x: 400,
                    y: 410,
                    options: {
                        shape: 'circle',
                        radius: 10,
                        isStatic: true,
                        color: 0x666666
                    }
                },
                {
                    type: 'weight',
                    x: 300,
                    y: 300,
                    options: {
                        shape: 'circle',
                        radius: 25,
                        color: 0xaa6688,
                        density: 0.005
                    }
                }
            ]
        };
    }
    
    createLevel8() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 100
                },
                {
                    type: 'platform',
                    x: 200,
                    y: 400,
                    options: {
                        shape: 'rectangle',
                        width: 200,
                        height: 20,
                        isStatic: true,
                        color: 0x999999
                    }
                },
                {
                    type: 'platform',
                    x: 600,
                    y: 200,
                    options: {
                        shape: 'rectangle',
                        width: 200,
                        height: 20,
                        isStatic: true,
                        color: 0x999999
                    }
                },
                {
                    type: 'domino',
                    x: 300,
                    y: 350,
                    options: {
                        shape: 'rectangle',
                        width: 20,
                        height: 100,
                        color: 0x8866aa
                    }
                },
                {
                    type: 'domino',
                    x: 350,
                    y: 350,
                    options: {
                        shape: 'rectangle',
                        width: 20,
                        height: 100,
                        color: 0x8866aa
                    }
                },
                {
                    type: 'domino',
                    x: 400,
                    y: 350,
                    options: {
                        shape: 'rectangle',
                        width: 20,
                        height: 100,
                        color: 0x8866aa
                    }
                },
                {
                    type: 'ball',
                    x: 500,
                    y: 300,
                    options: {
                        shape: 'circle',
                        radius: 25,
                        color: 0xaa6688,
                        restitution: 0.8
                    }
                }
            ]
        };
    }
    
    createLevel9() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 500
                },
                {
                    type: 'movingPlatform',
                    x: 400,
                    y: 300,
                    options: {
                        shape: 'rectangle',
                        width: 200,
                        height: 20,
                        isStatic: true,
                        color: 0x999999,
                        movement: {
                            type: 'vertical',
                            distance: 200,
                            speed: 2
                        }
                    }
                },
                {
                    type: 'movingPlatform',
                    x: 200,
                    y: 400,
                    options: {
                        shape: 'rectangle',
                        width: 200,
                        height: 20,
                        isStatic: true,
                        color: 0x999999,
                        movement: {
                            type: 'horizontal',
                            distance: 200,
                            speed: 3
                        }
                    }
                },
                {
                    type: 'obstacle',
                    x: 500,
                    y: 400,
                    options: {
                        shape: 'circle',
                        radius: 30,
                        isStatic: true,
                        color: 0xff0000,
                        movement: {
                            type: 'circular',
                            radius: 100,
                            speed: 0.02
                        }
                    }
                }
            ]
        };
    }
    
    createLevel10() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 100
                },
                {
                    type: 'platform',
                    x: 200,
                    y: 400,
                    options: {
                        shape: 'rectangle',
                        width: 200,
                        height: 20,
                        isStatic: true,
                        color: 0x999999
                    }
                },
                {
                    type: 'movingPlatform',
                    x: 400,
                    y: 300,
                    options: {
                        shape: 'rectangle',
                        width: 200,
                        height: 20,
                        isStatic: true,
                        color: 0x999999,
                        movement: {
                            type: 'vertical',
                            distance: 200,
                            speed: 2
                        }
                    }
                },
                {
                    type: 'seesaw',
                    x: 600,
                    y: 400,
                    options: {
                        shape: 'rectangle',
                        width: 300,
                        height: 20,
                        color: 0x8866aa,
                        density: 0.001
                    }
                },
                {
                    type: 'pivot',
                    x: 600,
                    y: 410,
                    options: {
                        shape: 'circle',
                        radius: 10,
                        isStatic: true,
                        color: 0x666666
                    }
                },
                {
                    type: 'obstacle',
                    x: 400,
                    y: 200,
                    options: {
                        shape: 'circle',
                        radius: 30,
                        isStatic: true,
                        color: 0xff0000,
                        movement: {
                            type: 'circular',
                            radius: 100,
                            speed: 0.02
                        }
                    }
                },
                {
                    type: 'domino',
                    x: 500,
                    y: 350,
                    options: {
                        shape: 'rectangle',
                        width: 20,
                        height: 100,
                        color: 0x8866aa
                    }
                },
                {
                    type: 'weight',
                    x: 650,
                    y: 300,
                    options: {
                        shape: 'circle',
                        radius: 25,
                        color: 0xaa6688,
                        density: 0.005
                    }
                }
            ]
        };
    }
    
    createDefaultLevel() {
        return {
            objects: [
                {
                    type: 'player',
                    x: 100,
                    y: 500
                },
                {
                    type: 'goal',
                    x: 700,
                    y: 500
                }
            ]
        };
    }
}