(() => {
	'use strict';

	const Util = {
		findDistance(fromX, fromY, toX, toY) {
			let a = Math.abs(fromX - toX);
			let b = Math.abs(fromY - toY);

			return Math.sqrt((a * a) + (b * b));
		}
	};

	const Draw = {
		rect(ctx, x, y, width, height, fill, outline, outlineWidth) {
			ctx.beginPath();
			ctx.rect(x, y, width, height);
			ctx.fillStyle = fill;
			ctx.fill();
			ctx.lineWidth = outlineWidth;
			ctx.strokeStyle = outline;
			ctx.stroke();
		},
		circle(ctx, x, y, radius, fill, outline, outlineWidth) {
			ctx.beginPath();
			ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
			ctx.fillStyle = fill;
			ctx.fill();
			ctx.lineWidth = outlineWidth;
			ctx.strokeStyle = outline;
			ctx.stroke();
		}
	};

	class Game {
		constructor(canvas) {
			this.canvas = canvas;
			this.ctx = canvas.getContext('2d');
			this.rows = 7;
			this.cols = 9;
			this.brickHeight = 20;
			this.paddle = new Paddle();
			this.ball = new Ball();
			this.bricks = [];
			this.isPlaying = false;
			this.newGame();
		}

		init() {
			this.canvas.onmousemove = e => {
				if (this.isPlaying) {
					const rect = this.canvas.getBoundingClientRect();
					this.paddle.x = e.clientX - rect.left - (this.paddle.width / 2);
				}
			};
			this.canvas.onmousedown = () => this.isPlaying = true;

			let prevTime;
			let frame = () => {
				requestAnimationFrame(frame);

				let delta = 0;
				if (prevTime) {
					delta = Date.now() - prevTime;
				}
				prevTime = Date.now();

				if (keydown.Enter) this.isPlaying = true;

				if (this.isPlaying) {
					this.update(delta);
				}
				this.draw();
			};
			frame();
		}

		newGame() {
			this.generateBricks();
			this.paddle.y = this.canvas.height - this.paddle.height - 10;
			this.paddle.x = (this.canvas.width / 2) - (this.paddle.width / 2);
			this.ball.x = this.canvas.width / 2;
			this.ball.y = this.paddle.y - this.ball.radius - 5;
			this.ball.dx = Math.random() - 0.5; // random number between -0.5 and 0.5
			this.ball.dy = -this.ball.speed;
		}

		generateBricks() {
			this.bricks = [];
			let brickWidth = this.canvas.width / this.rows;
			let brickHeight = this.brickHeight;
			for (let x = 0; x < this.rows; x++) {
				for (let y = 0; y < this.cols; y++) {
					if (Math.random() > 0.5) {
						this.bricks.push(new Brick({
							x: x * brickWidth,
							y: y * brickHeight,
							width: brickWidth,
							height: brickHeight
						}));
					}
				}
			}
		}

		update(delta) {
			this.paddle.update(delta);
			this.ball.update(delta);
		}

		draw() {
			this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
			this.bricks.forEach(brick => brick.draw(this.ctx));
			this.ball.draw(this.ctx);
			this.paddle.draw(this.ctx);
		}

		lose() {
			this.isPlaying = false;
			this.newGame();
		}
	}

	class Ball {
		constructor({ radius=6, color='white', outline='black', outlineWidth=1, speed=0.3, reboundModifier=1.65 } = {}) {
			this.x = 0;
			this.y = 0;
			this.dx = 0;
			this.dy = 0;
			this.radius = radius;
			this.color = color;
			this.outline = outline;
			this.outlineWidth = outlineWidth;
			this.speed = speed;
			this.reboundModifier = reboundModifier;
		}

		intersects({ x, y, width, height }) {
			// Closest point in the rectangle to the center of circle
			let closestX, closestY;
			// Find the closest x point from center of circle
			if (this.x < x) closestX = x;
			else if (this.x > x + width) closestX = x + width;
			else closestX = this.x;

			// Find the unrotated closest y point from center of unrotated circle
			if (this.y < y) closestY = y;
			else if (this.y > y + height) closestY = y + height;
			else closestY = this.y;

			// Determine collision
			let distance = Util.findDistance(this.x, this.y, closestX, closestY);
			return distance < this.radius;
		}

		update(delta) {
			this.x += this.dx * delta;
			this.y += this.dy * delta;

			if (this.x - this.radius < 0) {
				this.dx *= -1;
				this.x = this.radius;
			}
			if (this.x > game.canvas.width - this.radius) {
				this.dx *= -1;
				this.x = game.canvas.width - this.radius;
			}
			if (this.y - this.radius < 0) {
				this.dy *= -1;
				this.y = this.radius;
			}

			// if the ball was previously above the paddle (although, give a bit of leeway)
			if (this.dy > 0 && this.y - (this.dy * delta) < game.paddle.origin.y && this.intersects(game.paddle)) {
				this.y = game.paddle.y - this.radius;
				this.dx = this.reboundModifier * ((this.x - game.paddle.origin.x) / game.paddle.width);
				this.dy *= -1;
			}

			// hit bricks
			let xReversed = false;
			let yReversed = false;
			game.bricks.filter(brick => !brick.isHit).forEach(brick => {
				if (this.intersects(brick)) {
					if (this.dy > 0) {
						if (this.y > brick.y && (this.x < brick.x || this.x > (brick.x) + brick.width)) {
							if (this.x < brick.x) {
								this.x = (brick.x) - this.radius;
							} else {
								this.x = (brick.x) + brick.width + this.radius;
							}
							xReversed = true;
						} else {
							this.y = (brick.y) - this.radius;
							yReversed = true;
						}
					} else if (this.y < (brick.y) + brick.height && (this.x < brick.x || this.x > (brick.x) + brick.width)) {
						if (this.x < brick.x) {
							this.x = (brick.x) - this.radius;
						} else {
							this.x = (brick.x) + brick.width + this.radius;
						}
						xReversed = true;
					} else {
						this.y = (brick.y) + brick.height + this.radius;
						yReversed = true;
					}
					brick.hit();
				}
			});

			if (xReversed) {
				this.dx *= -1;
			}
			if (yReversed) {
				this.dy *= -1;
			}

			if (this.y - this.radius > game.canvas.height) {
				game.lose();
			}
		}

		draw(ctx) {
			Draw.circle(ctx, this.x, this.y, this.radius, this.color, this.outline, this.outlineWidth);
		}
	}

	class Rectangle {
		constructor(x, y, width, height, color, outline, outlineWidth) {
			this.x = x;
			this.y = y;
			this.width = width;
			this.height = height;
			this.color = color;
			this.outline = outline;
			this.outlineWidth = outlineWidth;
		}

		get origin() {
			return {
				x: this.x + (this.width / 2),
				y: this.y + (this.height / 2)
			};
		}

		draw(ctx) {
			Draw.rect(ctx, this.x, this.y, this.width, this.height, this.color, this.outline, this.outlineWidth);
		}
	}

	class Paddle extends Rectangle {
		constructor({ width=72, height=15, speed=0.7, color='white', outline='black', outlineWidth=1 } = {}) {
			super(0, 0, width, height, color, outline, outlineWidth);
			this.speed = speed;
		}

		update(delta) {
			if (keydown.ArrowLeft) {
				this.x -= this.speed * delta;
			}
			if (keydown.ArrowRight) {
				this.x += this.speed * delta;
			}
			if (this.x < 0) this.x = 0;
			if (this.x + this.width > game.canvas.width) this.x = game.canvas.width - this.width;
		}
	}

	class Brick extends Rectangle {
		constructor({ x, y, width, height, color='yellow', outline='black', outlineWidth=1 } = {}) {
			super(x, y, width, height, color, outline, outlineWidth);
			this.isHit = false;
		}

		hit() {
			this.isHit = true;
		}

		draw(ctx) {
			if (!this.isHit) {
				super.draw(ctx);
			}
		}
	}

	let game = new Game(document.querySelector('#game'));
	game.init();
})();
