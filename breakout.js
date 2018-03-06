(() => {
	'use strict';

	let canvas;
	let ctx;

	let playing = false;

	let interval;
	let prevTime;
	let delta;

	// Objects
	let ball = {
		x: 0,
		Y: 0,
		dx: 0,
		dy: 0,
		radius: 6,
		color: 'white',
		outline: 'black',
		outlineWidth: 1,
		draw() {
			circle(this.x, this.y, this.radius, this.color, this.outline, this.outlineWidth);
		}
	};

	let paddle = {
		x: 0,
		y: 0,
		width: 72,
		height: 15,
		speed: 0.7,
		reboundModifier: 1.65,
		color: 'white',
		outline: 'black',
		outlineWidth: 1,
		draw() {
			rect(this.x, this.y, this.width, this.height, this.color, this.outline, this.outlineWidth);
		}
	};

	let board = {
		bricks: [],
		numCols: 7,
		numRows: 9,
		brickHeight: 20,
		brickWidth: 72,
		color: 'yellow',
		outline: 'black',
		outlineWidth: 1,
		draw() {
			for (let y = 0; y < this.numRows; y++) {
				for (let x = 0; x < this.numCols; x++) {
					if (this.bricks[y][x]) {
						rect(x * this.brickWidth, y * this.brickHeight, this.brickWidth, this.brickHeight, this.color, this.outline, this.outlineWidth);
					}
				}
			}
		}
	};

	// Game loop
	const loadGame = function() {
		canvas = document.querySelector('#game');
		ctx = canvas.getContext('2d');
		canvas.onmousemove = mouseMove;
		canvas.onmousedown = () => playing = true;
		init();
	};

	const init = function() {
		board.bricks = [];
		for (let y = 0; y < board.numRows; y++) {
			board.bricks.push([]);
			for (let x = 0; x < board.numCols; x++) {
				board.bricks[y].push(Math.random() > 0.5);
			}
		}

		paddle.y = canvas.height - paddle.height - 10;
		paddle.x = (canvas.width / 2) - (paddle.width / 2);
		ball.x = canvas.width / 2;
		ball.y = paddle.y - ball.radius - 5;
		ball.dx = Math.random() - 0.5; // random number between -0.5 and 0.5
		ball.dy = -0.3;

		let FPS = 60;
		setInterval(() => {
			if (!prevTime) {
				delta = 0;
			} else {
				delta = new Date() - prevTime;
			}
			prevTime = new Date();

			if (playing) {
				update();
				draw();
			} else if (keydown.Enter) {
				playing = true;
			}
		}, 1000 / FPS);

		draw();
	};

	const update = function() {
		if (playing) {
			if (keydown.ArrowLeft) {
				paddle.x -= paddle.speed * delta;
			}
			if (keydown.ArrowRight) {
				paddle.x += paddle.speed * delta;
			}
			if (paddle.x < 0) paddle.x = 0;
			if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;

			ball.x += ball.dx * delta;
			ball.y += ball.dy * delta;

			if (ball.x - ball.radius < 0) {
				ball.dx *= -1;
				ball.x = ball.radius;
			}
			if (ball.x > canvas.width - ball.radius) {
				ball.dx *= -1;
				ball.x = canvas.width - ball.radius;
			}
			if (ball.y - ball.radius < 0) {
				ball.dy *= -1;
				ball.y = ball.radius;
			}

			// if the ball was previously above the paddle (although, give a bit of leeway)
			if (ball.dy > 0 && ball.y - (ball.dy * delta) < paddle.y + (paddle.height / 2) && ballIntersects(paddle.x, paddle.y, paddle.width, paddle.height)) {
				ball.y = paddle.y - ball.radius;
				ball.dx = paddle.reboundModifier * ((ball.x - (paddle.x + (paddle.width / 2))) / paddle.width);
				ball.dy *= -1;
			}

			if (ball.y - ball.radius > canvas.height) {
				playing = false;
				clearInterval(interval);
				init();
			}

			// hit board
			let xReversed = false;
			let yReversed = false;
			for (let y = 0; y < board.numRows; y++) {
				for (let x = 0; x < board.numCols; x++) {
					if (!board.bricks[y][x]) {
						continue;
					}
					if (ballIntersects(x * board.brickWidth, y * board.brickHeight, board.brickWidth, board.brickHeight)) {
						if (ball.dy > 0) {
							if (ball.y > y * board.brickHeight && (ball.x < x * board.brickWidth || ball.x > (x * board.brickWidth) + board.brickWidth)) {
								if (ball.x < x * board.brickWidth) {
									ball.x = (x * board.brickWidth) - ball.radius;
								} else {
									ball.x = (x * board.brickWidth) + board.brickWidth + ball.radius;
								}
								xReversed = true;
							} else {
								ball.y = (y * board.brickHeight) - ball.radius;
								yReversed = true;
							}
						} else if (ball.y < (y * board.brickHeight) + board.brickHeight && (ball.x < x * board.brickWidth || ball.x > (x * board.brickWidth) + board.brickWidth)) {
							if (ball.x < x * board.brickWidth) {
								ball.x = (x * board.brickWidth) - ball.radius;
							} else {
								ball.x = (x * board.brickWidth) + board.brickWidth + ball.radius;
							}
							xReversed = true;
						} else {
							ball.y = (y * board.brickHeight) + board.brickHeight + ball.radius;
							yReversed = true;
						}
						board.bricks[y][x] = false;
					}
				}
			}
			if (xReversed) {
				ball.dx *= -1;
			}
			if (yReversed) {
				ball.dy *= -1;
			}
		}
	};

	const draw = function() {
		clear();

		board.draw();
		ball.draw();
		paddle.draw();
	};

	// draw functions
	const clear = function() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

	const rect = function(x, y, width, height, fill, outline, outlineWidth) {
		ctx.beginPath();
		ctx.rect(x, y, width, height);
		ctx.fillStyle = fill;
		ctx.fill();
		ctx.lineWidth = outlineWidth;
		ctx.strokeStyle = outline;
		ctx.stroke();
	};

	const circle = function(x, y, radius, fill, outline, outlineWidth) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = fill;
		ctx.fill();
		ctx.lineWidth = outlineWidth;
		ctx.strokeStyle = outline;
		ctx.stroke();
	};

	// other functions
	const mouseMove = function(ev) {
		if (playing) {
			let rect = canvas.getBoundingClientRect();
			paddle.x = ev.clientX - rect.left - (paddle.width / 2);
		}
	};

	const ballIntersects = function(x, y, width, height) {
		// Closest point in the rectangle to the center of circle
		let closestX, closestY;
		// Find the closest x point from center of circle
		if (ball.x < x) closestX = x;
		else if (ball.x > x + width) closestX = x + width;
		else closestX = ball.x;

		// Find the unrotated closest y point from center of unrotated circle
		if (ball.y < y) closestY = y;
		else if (ball.y > y + height) closestY = y + height;
		else closestY = ball.y;

		// Determine collision
		let distance = findDistance(ball.x, ball.y, closestX, closestY);
		return distance < ball.radius;
	};

	const findDistance = function(fromX, fromY, toX, toY) {
		let a = Math.abs(fromX - toX);
		let b = Math.abs(fromY - toY);

		return Math.sqrt((a * a) + (b * b));
	};

	loadGame();
})();
