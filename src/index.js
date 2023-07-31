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
        scene: [MainMenu, LevelMenu, Level1, Level2, GameOver],
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

        //Audios:
        this.load.audio("blastSound", "../sounds/explosion.mp3");
        this.load.audio("scoreSound", "../sounds/pickupCoin.mp3");

        //Images:
        this.load.image("spaceJunk", "../images/spaceJunk.png");
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
        this.player = this.physics.add
            .sprite(game.config.width / 2, game.config.height / 1.5, "player")
            .setScale(0.8);
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

        //Create spaceJunk group:
        this.spaceJunkGroup = this.physics.add.group({
            immovable: false,
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
        this.physics.add.collider(this.spaceJunkGroup, this.player);

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

        this.physics.add.overlap(
            this.spaceJunkGroup,
            this.asteroidGroup,
            this.removeObject,
            null,
            this
        );

        this.physics.add.overlap(
            this.healthUpGroup,
            this.asteroidGroup,
            this.removeObject,
            null,
            this
        );

        this.physics.add.overlap(
            this.starsGroup,
            this.asteroidGroup,
            this.removeObject,
            null,
            this
        );

        this.physics.add.overlap(
            this.starsGroup,
            this.healthUpGroup,
            this.removeObject,
            null,
            this
        );

        this.physics.add.overlap(
            this.asteroidGroup,
            this.asteroidGroup,
            this.removeObject,
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

        //Way to remove objects after they get out of bounds:
        this.asteroidGroup.children.iterate(function (asteroid) {
            if (asteroid && asteroid.y > game.config.height + asteroid.height) {
                asteroid.destroy();
            }
        });

        this.healthUpGroup.children.iterate(function (healthUp) {
            if (healthUp && healthUp.y > game.config.height + healthUp.height) {
                healthUp.destroy();
            }
        });

        this.starsGroup.children.iterate(function (star) {
            if (star && game.config.height + star.healthUp) {
                star.destroy();
            }
        });

        this.spaceJunkGroup.children.iterate(function (spaceJunk) {
            if (
                (spaceJunk &&
                    spaceJunk.y > game.config.height + spaceJunk.height) ||
                (spaceJunk && spaceJunk.y < -100) ||
                (spaceJunk && spaceJunk.x > game.config.width + 100) ||
                (spaceJunk && spaceJunk.x < -250)
            ) {
                spaceJunk.destroy();
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
                .create(Phaser.Math.Between(0, game.config.width), -100, "star")
                .setScale(0.06);
            this.starsGroup.setVelocityY(gameOptions.asteroidSpeed);
        }

        //Create potential healthUps;
        if (Phaser.Math.Between(0, 40) === 5) {
            this.healthUpGroup
                .create(
                    Phaser.Math.Between(0, game.config.width),
                    -100,
                    "heart"
                )
                .setScale(0.6);
            this.healthUpGroup.setVelocityY(gameOptions.asteroidSpeed);
        }

        //Create potential spaceJunk;
        if (Phaser.Math.Between(0, 4) === 2) {
            this.spaceJunkGroup
                .create(
                    Phaser.Math.Between(0, game.config.width),
                    -100,
                    "spaceJunk"
                )
                .setScale(0.3);
            this.spaceJunkGroup.setVelocityY(gameOptions.asteroidSpeed);
        }

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
            this.scene.start("GameOver", {
                score: this.score,
                previousScene: "Level1",
            });
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

    //Functio for removing objects when they get to of eachother:
    removeObject(object1, object2) {
        object1.destroy();
        object2.destroy();
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
        this.previousScene = data.previousScene;
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
                game.config.height / 2 + 150,
                "Restart",
                { fontSize: "52px", fill: "#fff" }
            )
            .setOrigin(0.5);
        restartButton.setInteractive();
        restartButton.on("pointerdown", () => {
            this.scene.start(this.previousScene);
        });

        //LevelMenuBtn:
        const levelMenuButton = this.add
            .text(
                game.config.width / 2,
                game.config.height / 2 + 100,
                "Level Menu",
                { fontSize: "52px", fill: "#fff" }
            )
            .setOrigin(0.5);
        levelMenuButton.setInteractive();
        levelMenuButton.on("pointerdown", () => {
            this.scene.start("LevelMenu");
        });
    }
}

//MainMenu scene----------------------------------------------------------------------------------------------------------------
class MainMenu extends Phaser.Scene {
    constructor() {
        super("MainMenu");
    }

    preload() {
        //Music:
        this.load.audio("music", "../sounds/music.mp3");
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
            this.scene.start("LevelMenu");
        });

        //Game music
        if (!this.music) {
            this.music = this.sound.add("music", {
                loop: true,
                volume: 0.2,
            });

            this.music.play();
        }
    }
}

//LevelMenu scene----------------------------------------------------------------------------------------------------------------
class LevelMenu extends Phaser.Scene {
    constructor() {
        super("LevelMenu");
    }

    create() {
        //Choose level text:
        this.add
            .text(
                game.config.width / 2,
                game.config.height / 2,
                "Choose level:",
                {
                    fontSize: "70px",
                    fill: "#fff",
                }
            )
            .setOrigin(0.5);

        // Level1 button:
        const level1Button = this.add
            .text(
                game.config.width / 2,
                game.config.height / 2 + 60,
                "Level 1",
                {
                    fontSize: "36px",
                    fill: "#fff",
                }
            )
            .setOrigin(0.5);
        level1Button.setInteractive();
        level1Button.on("pointerdown", () => {
            this.scene.start("Level1");
        });

        // Level2 button:
        const level2Button = this.add
            .text(
                game.config.width / 2,
                game.config.height / 2 + 110,
                "Level 2",
                {
                    fontSize: "36px",
                    fill: "#fff",
                }
            )
            .setOrigin(0.5);
        level2Button.setInteractive();
        level2Button.on("pointerdown", () => {
            this.scene.start("Level2");
        });

        const mainMenu = this.add
            .text(
                game.config.width / 2,
                game.config.height / 2 + 170,
                "Main Menu",
                {
                    fontSize: "36px",
                    fill: "#fff",
                }
            )
            .setOrigin(0.5);
        mainMenu.setInteractive();
        mainMenu.on("pointerdown", () => {
            this.scene.start("MainMenu");
        });
    }
}

//Level2 scene----------------------------------------------------------------------------------------------------------------
class Level2 extends Phaser.Scene {
    constructor() {
        super("Level2");
        this.score = 0;
        this.playerHealth = gameOptions.playerHealth;
    }

    preload() {
        //Preload all used assets:

        //Sounds
        this.load.audio("blastSound", "../sounds/explosion.mp3");
        this.load.audio("scoreSound", "../sounds/pickupCoin.mp3");

        //Images
        this.load.image("player", "../images/player.png");
        this.load.image("asteroid", "../images/asteroid.png");
        this.load.image("heart", "../images/heart.png");
        this.load.image("star", "../images/star.png", {
            frameWidth: 32,
            frameHeight: 32,
        });
    }

    create() {
        //Switch background color:
        this.cameras.main.setBackgroundColor("#242424");

        //Reset starCount:
        this.score = 0;

        //Reset playerHealth:
        this.playerHealth = gameOptions.playerHealth;

        //Reset asteroidSpeed:
        this.asteroidSpeed = gameOptions.asteroidSpeed;

        //Create player:
        this.player = this.physics.add
            .sprite(game.config.width / 2, game.config.height / 1.5, "player")
            .setScale(0.8);
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
            callback: this.createAsteroidRow,
            callbackScope: this,
            delay: 2000,
            loop: true,
        });

        //Create stargroup:
        this.starsGroup = this.physics.add.group({
            immovable: true,
            allowGravity: false,
        });

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

        //Way to remove things after they get out of bounds:
        this.asteroidGroup.children.iterate(function (asteroid) {
            if (asteroid && asteroid.y > game.config.height + asteroid.height) {
                asteroid.destroy();
            }
        });

        this.healthUpGroup.children.iterate(function (healthUp) {
            if (healthUp && healthUp.y > game.config.height + healthUp.height) {
                healthUp.destroy();
            }
        });
    }

    //Function for creating asteroids:
    createAsteroidRow() {
        //Calculate postion for the hole:
        var rowHole = Math.floor(Math.random() * 7) + 1;

        //Add asteroid to the row:
        for (let i = 0; i < 9; i++) {
            if (i != rowHole && i != rowHole + 1) {
                let asteroid = this.asteroidGroup.create(
                    i * 70 + 20,
                    -game.config.height - 50,
                    "asteroid"
                );
                asteroid.setVelocityY(gameOptions.asteroidSpeed);
            } else if (i === rowHole) {
                this.starsGroup
                    .create(i * 70 + 55, -game.config.height - 50, "star")
                    .setScale(0.06);
                this.starsGroup.setVelocityY(gameOptions.asteroidSpeed);
            }
        }

        //Lower the delay:
        if (this.triggerTimer.delay > 400) {
            this.triggerTimer.delay -= 10;
            //console.log("kissa");
        }
    }

    //Function for killing player:
    endGame() {
        this.playerHealth--;
        this.healthText.setText(this.playerHealth);
        if (this.playerHealth == 0) {
            console.log("Player died!");
            this.scene.start("GameOver", {
                score: this.score,
                previousScene: "Level2",
            });
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
