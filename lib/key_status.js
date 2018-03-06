(() => {
	'use strict';

	window.keydown = {};

	window.onkeydown = e => {
		keydown[e.code] = true;
	};

	window.onkeyup = e => {
		keydown[e.code] = false;
	};
})();
