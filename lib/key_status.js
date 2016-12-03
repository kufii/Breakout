(function() {
	'use strict';

	window.keydown = {};

	window.onkeydown = function(e) {
		keydown[e.code] = true;
	};

	window.onkeyup = function(e) {
		keydown[e.code] = false;
	};
}());
