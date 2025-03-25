// Import Phaser
import Phaser from 'phaser';

// Import game classes
import './objects/PhysicsObject.js';
import './objects/Player.js';
import './scenes/MainScene.js';
import './scenes/LevelScene.js';

// Game configuration
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            debug: false
        }
    },
    scene: [MainScene, LevelScene]
};

// Initialize the game
const game = new Phaser.Game(config);

// Global game settings
const GAME = {
    // Number of levels in the game
    TOTAL_LEVELS: 10,
    
    // Current level the player is on
    currentLevel: 1,
    
    // Player progress
    levelsCompleted: 0,
    
    // Difficulty progression factors
    getDifficultyFactor: function() {
        return 1 + (this.currentLevel * 0.2);
    },
    
    // Level completion callback
    completeLevel: function() {
        this.levelsCompleted = Math.max(this.levelsCompleted, this.currentLevel);
        this.currentLevel++;
        if (this.currentLevel > this.TOTAL_LEVELS) {
            game.scene.start('MainScene', { gameCompleted: true });
        } else {
            game.scene.start('LevelScene', { level: this.currentLevel });
        }
    },
    
    // Reset the game
    resetGame: function() {
        this.currentLevel = 1;
        this.levelsCompleted = 0;
        game.scene.start('MainScene');
    }
};