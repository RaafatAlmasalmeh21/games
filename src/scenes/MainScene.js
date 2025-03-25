class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    init(data) {
        this.gameCompleted = data.gameCompleted || false;
    }

    preload() {
        // Gracefully handle missing assets
        this.load.setPath('src/assets/images/');
        this.load.image('background', 'background.png');
        this.load.image('title', 'title.png');
        this.load.image('button', 'button.png');
        this.load.image('particle', 'particle.png');
        
        // Handle file loading errors
        this.load.on('fileerror', (key, file) => {
            console.log(`Error loading: ${key}`);
            // Continue with game setup despite errors
        });
    }

    create() {
        // Set background color
        this.cameras.main.setBackgroundColor('#4488aa');
        
        // Title text
        const title = this.add.text(400, 100, 'PHYSICS PUZZLE CHALLENGE', {
            fontFamily: 'Arial',
            fontSize: 48,
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        
        // Add some decorative physics objects for visual appeal
        this.addDecorations();
        
        // Create level select buttons based on player progress
        this.createLevelButtons();
        
        // Show game completed message if applicable
        if (this.gameCompleted) {
            this.add.text(400, 500, 'Congratulations! You\'ve completed all levels!', {
                fontFamily: 'Arial',
                fontSize: 24,
                color: '#ffff00'
            }).setOrigin(0.5);
        }
    }
    
    createLevelButtons() {
        const levelsPerRow = 5;
        const buttonSize = 80;
        const spacing = 20;
        const startX = 400 - ((Math.min(GAME.TOTAL_LEVELS, levelsPerRow) * (buttonSize + spacing)) / 2) + buttonSize/2;
        const startY = 250;
        
        for (let i = 0; i < GAME.TOTAL_LEVELS; i++) {
            const level = i + 1;
            const row = Math.floor(i / levelsPerRow);
            const col = i % levelsPerRow;
            
            const x = startX + col * (buttonSize + spacing);
            const y = startY + row * (buttonSize + spacing);
            
            // Button background
            const button = this.add.rectangle(x, y, buttonSize, buttonSize, 0x666666, 0.8).setInteractive();
            const isCompleted = level <= GAME.levelsCompleted;
            const isLocked = level > GAME.levelsCompleted + 1;
            
            // Button color based on status
            if (isCompleted) {
                button.fillColor = 0x00aa00; // Green for completed
            } else if (!isLocked) {
                button.fillColor = 0x0088ff; // Blue for available
            }
            
            // Level number
            const text = this.add.text(x, y, level.toString(), {
                fontFamily: 'Arial',
                fontSize: 32,
                color: '#ffffff'
            }).setOrigin(0.5);
            
            // Lock icon for locked levels
            if (isLocked) {
                this.add.text(x, y + 20, '🔒', {
                    fontSize: 20
                }).setOrigin(0.5);
            }
            
            // Add click handler if level is available
            if (!isLocked) {
                button.on('pointerdown', () => {
                    GAME.currentLevel = level;
                    this.scene.start('LevelScene', { level: level });
                });
                
                // Hover effect
                button.on('pointerover', () => {
                    button.setScale(1.05);
                });
                
                button.on('pointerout', () => {
                    button.setScale(1);
                });
            }
        }
    }
    
    addDecorations() {
        // Add some floating physics elements as decoration
        // These would normally use actual physics but for simplicity, we're just animating them
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xff00ff, 0xffff00];
        
        for (let i = 0; i < 10; i++) {
            const x = Phaser.Math.Between(100, 700);
            const y = Phaser.Math.Between(400, 550);
            const size = Phaser.Math.Between(20, 50);
            const color = Phaser.Utils.Array.GetRandom(colors);
            
            const shape = Math.random() > 0.5 
                ? this.add.circle(x, y, size, color, 0.7)
                : this.add.rectangle(x, y, size, size, color, 0.7);
                
            // Add simple animation
            this.tweens.add({
                targets: shape,
                y: y - Phaser.Math.Between(50, 150),
                x: x + Phaser.Math.Between(-100, 100),
                duration: Phaser.Math.Between(2000, 5000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
}