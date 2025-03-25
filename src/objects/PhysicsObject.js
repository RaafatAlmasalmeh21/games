class PhysicsObject {
    constructor(scene, x, y, options = {}) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        
        // Default options
        this.options = Object.assign({
            shape: 'rectangle',
            width: 50,
            height: 50,
            radius: 25,
            color: 0xffffff,
            alpha: 1,
            texture: null,
            frame: null,
            isStatic: false,
            friction: 0.1,
            frictionAir: 0.01,
            restitution: 0.8,
            density: 0.001,
            isSensor: false,
            label: 'physicsObject',
            collisionCategory: 1,
            collidesWith: 0xFFFFFFFF,
            chamfer: null
        }, options);
        
        this.init();
    }
    
    init() {
        // Configure physics body options
        const bodyOptions = {
            isStatic: this.options.isStatic,
            friction: this.options.friction,
            frictionAir: this.options.frictionAir,
            restitution: this.options.restitution,
            density: this.options.density,
            isSensor: this.options.isSensor,
            label: this.options.label,
            collisionFilter: {
                category: this.options.collisionCategory,
                mask: this.options.collidesWith
            }
        };
        
        if (this.options.chamfer) {
            bodyOptions.chamfer = this.options.chamfer;
        }
        
        // Create body based on shape
        let body;
        
        switch(this.options.shape) {
            case 'circle':
                body = this.scene.matter.add.circle(
                    this.x, 
                    this.y, 
                    this.options.radius,
                    bodyOptions
                );
                break;
                
            case 'rectangle':
            default:
                body = this.scene.matter.add.rectangle(
                    this.x,
                    this.y,
                    this.options.width,
                    this.options.height,
                    bodyOptions
                );
                break;
                
            case 'polygon':
                body = this.scene.matter.add.fromVertices(
                    this.x,
                    this.y,
                    this.options.vertices,
                    bodyOptions
                );
                break;
        }
        
        // Create the visual representation
        if (this.options.texture) {
            // Sprite-based object
            this.sprite = this.scene.matter.add.sprite(0, 0, this.options.texture, this.options.frame);
            this.sprite.setExistingBody(body);
            this.sprite.setScale(this.options.width / this.sprite.width, this.options.height / this.sprite.height);
            this.sprite.setTint(this.options.color);
            this.sprite.setAlpha(this.options.alpha);
            this.gameObject = this.sprite;
        } else {
            // Graphics-based object
            const graphics = this.scene.add.graphics();
            graphics.fillStyle(this.options.color, this.options.alpha);
            
            if (this.options.shape === 'circle') {
                graphics.fillCircle(0, 0, this.options.radius);
            } else {
                graphics.fillRect(
                    -this.options.width / 2, 
                    -this.options.height / 2, 
                    this.options.width, 
                    this.options.height
                );
            }
            
            this.gameObject = this.scene.matter.add.gameObject(graphics, body);
        }
        
        // Store body reference
        this.body = body;
        
        // Add object reference to the body for easier identification
        body.gameObject = this.gameObject;
        body.physicsObject = this;
    }
    
    setPosition(x, y) {
        try {
            if (this.body && this.scene && this.scene.matter && this.scene.matter.body) {
                this.scene.matter.body.setPosition(this.body, { x, y });
            }
        } catch (e) {
            console.error("Error setting position:", e);
        }
    }
    
    setVelocity(x, y) {
        try {
            if (this.body && this.scene && this.scene.matter && this.scene.matter.body) {
                this.scene.matter.body.setVelocity(this.body, { x, y });
            }
        } catch (e) {
            console.error("Error setting velocity:", e);
        }
    }
    
    setAngularVelocity(velocity) {
        try {
            if (this.body && this.scene && this.scene.matter && this.scene.matter.body) {
                this.scene.matter.body.setAngularVelocity(this.body, velocity);
            }
        } catch (e) {
            console.error("Error setting angular velocity:", e);
        }
    }
    
    applyForce(force) {
        try {
            if (this.body && this.body.position && this.scene && this.scene.matter && this.scene.matter.body) {
                this.scene.matter.body.applyForce(this.body, this.body.position, force);
            }
        } catch (e) {
            console.error("Error applying force:", e);
        }
    }
    
    setStatic(isStatic) {
        try {
            if (this.body && this.scene && this.scene.matter && this.scene.matter.body) {
                this.scene.matter.body.setStatic(this.body, isStatic);
            }
        } catch (e) {
            console.error("Error setting static:", e);
        }
    }
    
    destroy() {
        this.scene.matter.world.remove(this.scene.matter.world, this.body);
        this.gameObject.destroy();
    }
}