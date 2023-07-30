let game;

const gameOptions = {
    //player options:
    playerMaxSpeed: 500,
    playerDrag: 2000,
    playerAcceleration: 1500,
    playerHealth: 2,

    //Asteroid options:
    asteroidSpeed: 200,
};

window.onload = function () {
    let gameConfig = {
        type: Phaser.AUTO,
        backgroundColor: "#113266",
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 600,
            height: 750,
        },
        pixelArt: true,
        physics: {
            default: "arcade",
            arcade: {
                gravity: {
                    y: 0,
                },
            },
        },
        parent: "game-container",
        scene: [MainMenu, Level1, GameOver],
    };

    game = new Phaser.Game(gameConfig);
    window.focus();
};

//Level 1 scene----------------------------------------------------------------------------------------------------------------
class Level1 extends Phaser.Scene {
    constructor() {
        super("Level1");
        this.score = 0;
        this.playerHealth = gameOptions.playerHealth;
    }

    preload() {
        //Preload all used assets:
        this.load.audio("blastSound", "../sounds/explosion.mp3");
        this.load.audio("scoreSound", "../sounds/pickupCoin.mp3");
        this.load.image("player", "../images/player.png");
        this.load.image("asteroid", "../images/asteroid.png");
        this.load.image("heart", "../images/heart.png");
        this.load.image("star", "../images/star.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
    }

    create() {
        //Reset starCount:
        this.score = 0;

        //Reset playerHealth:
        this.playerHealth = gameOptions.playerHealth;

        //Create player:
        this.player = this.physics.add.sprite(
            game.config.width / 2,
            game.config.height / 1.5,
            "player"
        );
        this.player.body.allowGravity = false;
        this.player.body.drag.set(gameOptions.playerDrag);
        this.player.body.maxVelocity.set(gameOptions.playerMaxSpeed);
        this.player.body.collideWorldBounds = true;

        //Setups cursors for player input:
        this.cursors = this.input.keyboard.createCursorKeys();

        //Create asteroid group:
        this.asteroidGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false,
        });

        //Add triggertimer for spawning asteroids and other game objects:
        this.triggerTimer = this.time.addEvent({
            callback: this.createAsteroids,
            callbackScope: this,
            delay: 2000,
            loop: true,
        });

        //Create stargroup:
        this.starsGroup = this.physics.add.group({});

        //Create healthUpGroup:
        this.healthUpGroup = this.physics.add.group({});

        //Physics colliders:
        this.physics.add.collider(this.starsGroup, this.asteroidGroup);
        this.physics.add.collider(this.healthUpGroup, this.asteroidGroup);

        //Physics overlaps:
        this.physics.add.overlap(
            this.player,
            this.asteroidGroup,
            (player, asteroid) => {
                this.explosionSound.play();
                asteroid.destroy();
                this.endGame();
            },
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.starsGroup,
            this.collectStar,
            null,
            this
        );

        this.physics.add.overlap(
            this.player,
            this.healthUpGroup,
            this.collectHealthUp,
            null,
            this
        );

        // Create audios:
        this.scoreSound = this.sound.add("scoreSound");
        this.explosionSound = this.sound.add("blastSound");

        //Add starIMG and text element top-left of screen for showing score to player:
        this.add.image(26, 26, "star").setScale(0.06);
        this.scoreText = this.add.text(50, 10, "0", {
            fontSize: "40px",
            fill: "#ffffff",
        });

        //Health icon and text:
        this.add.image(26, 70, "heart").setScale(0.6);
        this.healthText = this.add.text(50, 55, `${this.playerHealth}`, {
            fontSize: "40px",
            fill: "#fff",
        });
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.body.acceleration.x = -gameOptions.playerAcceleration;
        } else if (this.cursors.right.isDown) {
            this.player.body.acceleration.x = gameOptions.playerAcceleration;
        } else {
            this.player.body.acceleration.x = 0;
        }

        if (this.cursors.up.isDown) {
            this.player.body.acceleration.y = -gameOptions.playerAcceleration;
        } else if (this.cursors.down.isDown) {
            this.player.body.acceleration.y = gameOptions.playerAcceleration;
        } else {
            this.player.body.acceleration.y = 0;
        }

        //Way to remove asteroids after they get out of bounds:
        this.asteroidGroup.children.iterate(function (asteroid) {
            if (asteroid && asteroid.y > game.config.height + asteroid.height) {
                asteroid.destroy();
            }
        });
    }

    //Function for creating asteroids:
    createAsteroids() {
        //create 1-3 asteroids:
        let asteroids = Phaser.Math.Between(1, 3);
        for (let i = 0; i < asteroids; i++) {
            setTimeout(() => {
                let asteroid = this.asteroidGroup.create(
                    Phaser.Math.Between(0, game.config.width),
                    -game.config.height - 50,
                    "asteroid"
                );
                asteroid.setVelocityY(gameOptions.asteroidSpeed);
            }, i * 200);
        }

        this.asteroidGroup.setVelocityY(gameOptions.asteroidSpeed);

        //Create potential stars;
        if (Phaser.Math.Between(0, 1)) {
            this.starsGroup
                .create(Phaser.Math.Between(0, game.config.width), 0, "star")
                .setScale(0.06);
            this.starsGroup.setVelocityY(gameOptions.asteroidSpeed);
        }

        //Create potential healthUps;
        if (Phaser.Math.Between(0, 40) === 5) {
            this.healthUpGroup
                .create(Phaser.Math.Between(0, game.config.width), 0, "heart")
                .setScale(0.6);
            this.healthUpGroup.setVelocityY(gameOptions.asteroidSpeed);
        }

        //This function gets called every second, so we add 1 to time counter:
        this.passedTime++;

        //Lower the delay:
        if (this.triggerTimer.delay > 400) {
            this.triggerTimer.delay -= 20;
            console.log("kissa");
        }
    }

    //Function for killing player:
    endGame() {
        this.playerHealth--;
        this.healthText.setText(this.playerHealth);
        if (this.playerHealth == 0) {
            console.log("Player died!");
            this.scene.start("GameOver", { score: this.score });
        }
    }

    //Function for collecting stars:
    collectStar(player, star) {
        star.disableBody(true, true);
        this.score += 1;
        this.scoreText.setText(this.score);
        this.scoreSound.play();
    }

    //Function for collecting healthUps:
    collectHealthUp(player, healthUp) {
        healthUp.disableBody(true, true);
        this.playerHealth += 1;
        this.healthText.setText(this.playerHealth);
        this.scoreSound.play();
    }
}

//GameOver scene----------------------------------------------------------------------------------------------------------------
class GameOver extends Phaser.Scene {
    constructor() {
        super("GameOver");
    }

    //Get score from gameScene:
    init(data) {
        this.score = data.score;
    }

    create() {
        //GameOver Text
        this.add
            .text(game.config.width / 2, game.config.height / 3, "Game Over", {
                fontSize: "84px",
                fill: "#fff",
            })
            .setOrigin(0.5);

        // Score Text
        this.add
            .text(
                game.config.width / 2,
                game.config.height / 2 - 50,
                "Score: " + this.score,
                {
                    fontSize: "62px",
                    fill: "#fff",
                }
            )
            .setOrigin(0.5);

        // RestartBtn
        const restartButton = this.add
            .text(
                game.config.width / 2,
                game.config.height / 2 + 100,
                "Restart",
                { fontSize: "52px", fill: "#fff" }
            )
            .setOrigin(0.5);
        restartButton.setInteractive();
        restartButton.on("pointerdown", () => {
            this.scene.start("Level1");
        });
    }
}

//MainMenu scene----------------------------------------------------------------------------------------------------------------
class MainMenu extends Phaser.Scene {
    constructor() {
        super("MainMenu");
    }

    create() {
        //Main title
        this.add
            .text(
                game.config.width / 2,
                game.config.height / 2,
                "Rocket Rush",
                {
                    fontSize: "64px",
                    fill: "#fff",
                }
            )
            .setOrigin(0.5);

        // StartBtn
        const restartButton = this.add
            .text(game.config.width / 2, game.config.height / 2 + 50, "Start", {
                fontSize: "32px",
                fill: "#fff",
            })
            .setOrigin(0.5);
        restartButton.setInteractive();
        restartButton.on("pointerdown", () => {
            this.scene.start("Level1");
        });
    }
}
