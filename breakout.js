(function() {
	'use strict';

	var canvas;
	var ctx;

	var playing = false;

	var interval;
	var prevTime;
	var delta;

	// Objects
	var ball = {
		x: 0,
		Y: 0,
		dx: 0,
		dy: 0,
		radius: 6,
		color: 'white',
		outline: 'black',
		outlineWidth: 1,
		draw: function() {
			circle(this.x, this.y, this.radius, this.color, this.outline, this.outlineWidth);
		}
	};

	var paddle = {
		x: 0,
		y: 0,
		width: 72,
		height: 15,
		speed: 0.7,
		color: 'white',
		outline: 'black',
		outlineWidth: 1,
		draw: function() {
			rect(this.x, this.y, this.width, this.height, this.color, this.outline, this.outlineWidth);
		}
	};

	var board = {
		bricks: [],
		numCols: 7,
		numRows: 9,
		brickHeight: 20,
		brickWidth: 72,
		color: 'yellow',
		outline: 'black',
		outlineWidth: 1,
		draw: function() {
			for (var y = 0; y < this.numRows; y++) {
				for (var x = 0; x < this.numCols; x++) {
					if (this.bricks[y][x]) {
						rect(x * this.brickWidth, y * this.brickHeight, this.brickWidth, this.brickHeight, this.color, this.outline, this.outlineWidth);
					}
				}
			}
		}
	};

	// Game loop
	var loadGame = function() {
		canvas = document.querySelector('#game');
		ctx = canvas.getContext('2d');
		canvas.onmousemove = mouseMove;
		canvas.onmousedown = function() {
			playing = true;
		};
		init();
	};

	var init = function() {
		board.bricks = [];
		for (var y = 0; y < board.numRows; y++) {
			board.bricks.push([]);
			for (var x = 0; x < board.numCols; x++) {
				board.bricks[y].push(Math.random() > 0.5);
			}
		}

		paddle.y = canvas.height - paddle.height - 10;
		paddle.x = (canvas.width / 2) - (paddle.width / 2);
		ball.x = canvas.width / 2;
		ball.y = paddle.y - ball.radius - 5;
		ball.dx = Math.random() - 0.5; // random number between -0.5 and 0.5
		ball.dy = -0.3;

		var FPS = 60;
		setInterval(function() {
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

	var update = function() {
		if (playing) {
			if (keydown.ArrowLeft) {
				paddle.x -= paddle.speed * delta;
			}
			if (keydown.ArrowRight) {
				paddle.x += paddle.speed * delta;
			}
			if (paddle.x < 0)
				paddle.x = 0;
			if (paddle.x + paddle.width > canvas.width)
				paddle.x = canvas.width - paddle.width;

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
			if (ball.dy > 0 && ball.y - ball.dy * delta < paddle.y + paddle.height / 2 && ballIntersects(paddle.x, paddle.y, paddle.width, paddle.height)) {
				ball.y = paddle.y - ball.radius;
				ball.dx = 1.65 * ((ball.x - (paddle.x + paddle.width / 2)) / paddle.width);
				ball.dy *= -1;
			}

			if (ball.y - ball.radius > canvas.height) {
				playing = false;
				clearInterval(interval);
				init();
			}

			// hit board
			var xReversed = false;
			var yReversed = false;
			for (var y = 0; y < board.numRows; y++) {
				for (var x = 0; x < board.numCols; x++) {
					if (!board.bricks[y][x]) {
						continue;
					}
					if (ballIntersects(x * board.brickWidth, y * board.brickHeight, board.brickWidth, board.brickHeight)) {
						if (ball.dy > 0) {
							if (ball.y > y * board.brickHeight && ((ball.x < x * board.brickWidth) || (ball.x > x * board.brickWidth + board.brickWidth))) {
								if (ball.x < x * board.brickWidth) {
									ball.x = x * board.brickWidth - ball.radius;
								} else {
									ball.x = x * board.brickWidth + board.brickWidth + ball.radius;
								}
								xReversed = true;
							} else {
								ball.y = y * board.brickHeight - ball.radius;
								yReversed = true;
							}
						} else {
							if (ball.y < y * board.brickHeight + board.brickHeight && ((ball.x < x * board.brickWidth) || (ball.x > x * board.brickWidth + board.brickWidth))) {
								if (ball.x < x * board.brickWidth) {
									ball.x = x * board.brickWidth - ball.radius;
								} else {
									ball.x = x * board.brickWidth + board.brickWidth + ball.radius;
								}
								xReversed = true;
							} else {
								ball.y = y * board.brickHeight + board.brickHeight + ball.radius;
								yReversed = true;
							}
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

	var draw = function() {
		clear();

		board.draw();
		ball.draw();
		paddle.draw();
	};

	// draw functions
	var clear = function() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	};

	var rect = function(x, y, width, height, fill, outline, outlineWidth) {
		ctx.beginPath();
		ctx.rect(x, y, width, height);
		ctx.fillStyle = fill;
		ctx.fill();
		ctx.lineWidth = outlineWidth;
		ctx.strokeStyle = outline;
		ctx.stroke();
	};

	var circle = function(x, y, radius, fill, outline, outlineWidth) {
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		ctx.fillStyle = fill;
		ctx.fill();
		ctx.lineWidth = outlineWidth;
		ctx.strokeStyle = outline;
		ctx.stroke();
	};

	// other functions
	var mouseMove = function(ev) {
		if (playing) {
			var rect = canvas.getBoundingClientRect();
			paddle.x = ev.clientX - rect.left - (paddle.width / 2);
		}
	};

	var ballIntersects = function(x, y, width, height) {
		// Closest point in the rectangle to the center of circle
		var closestX, closestY;
		// Find the closest x point from center of circle
		if (ball.x < x)
			closestX = x;
		else if (ball.x > x + width)
			closestX = x + width;
		else
			closestX = ball.x;

		// Find the unrotated closest y point from center of unrotated circle
		if (ball.y < y)
			closestY = y;
		else if (ball.y > y + height)
			closestY = y + height;
		else
			closestY = ball.y;

		// Determine collision
		var distance = findDistance(ball.x, ball.y, closestX, closestY);
		return distance < ball.radius;
	};

	var findDistance = function(fromX, fromY, toX, toY) {
		var a = Math.abs(fromX - toX);
		var b = Math.abs(fromY - toY);

		return Math.sqrt((a * a) + (b * b));
	};

	loadGame();
})();
