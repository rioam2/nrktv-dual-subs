let globalTL = 'en';
let globalShowTranslation = true;

// Called for each new caption node mounted to the DOM
function handleCaptionMount(nodes) {
	const text = nodes.map((node) => node.innerText.trim()).join(' ');
	const lineSplits = nodes.reduce((acc, node) => [...acc, acc[acc.length - 1] + node.innerText.split(' ').length], [0]);

	// Handle translation request within service-worker to alleviate CORS/security conflicts
	const req = { action: 'translate', payload: { text, source_lang: 'no', target_lang: globalTL } };
	chrome.extension.sendRequest(req, ({ error, response }) => {
		if (!error) {
			const translatedLineSplits = lineSplits.map((orig) =>
				Math.floor(orig * (response.split(' ').length / text.split(' ').length))
			);
			Array.from(nodes).forEach((node, lineNum) => {
				const translatedLine = response
					.split(' ')
					.slice(translatedLineSplits[lineNum], translatedLineSplits[lineNum + 1])
					.join(' ');
				node.setAttribute('hide-translation', !globalShowTranslation);
				node.setAttribute('data-translation', translatedLine);
			});
		} else {
			console.error(error);
		}
	});
}

const CaptionObserver = (function (handler) {
	const throttle = (func, limit) => {
		let inThrottle;
		return function () {
			const args = arguments;
			const context = this;
			if (!inThrottle) {
				func.apply(context, args);
				inThrottle = true;
				setTimeout(() => (inThrottle = false), limit);
			}
		};
	};

	const throttledHandler = throttle(handler, 50);

	// Listen for captions elements mounting
	const captionsContainerQuery = '*[class^="ludo-captions"]';
	const captionsObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			Array.from(mutation.addedNodes || [])
				.filter((node) => node.matches && node.matches(captionsContainerQuery))
				.forEach((node) => {
					const parent = node.parentElement;
					throttledHandler(Array.from(parent.childNodes));
				});
		});
		mutations.forEach((mutation) => {
			Array.from(mutation.removedNodes || [])
				.filter((node) => node.matches && node.matches(captionsContainerQuery))
				.forEach((node) => {});
		});
	});
	// Return API interface
	return {
		enable() {
			captionsObserver.observe(document.body, {
				childList: true,
				subtree: true,
				attributes: false,
				characterData: false,
			});
		},
		disable() {
			captionsObserver.disconnect();
		},
	};
})(handleCaptionMount);

const LearningMode = (function () {
	function setVideoPlayState(play = true) {
		Array.from(document.querySelectorAll('video.ludo-player')).forEach((player) => {
			play ? player.play() : player.pause();
			player.focus();
		});
	}

	function setTranslationVisibility(show = true) {
		const lines = Array.from(document.querySelectorAll('.ludo-captions__line'));
		lines.forEach((line) => {
			line.setAttribute('hide-translation', !show);
		});
		globalShowTranslation = show;
	}

	function keyHandler(e) {
		if (e.key === 't' && !e.repeat) {
			if (e.type === 'keydown') {
				setTranslationVisibility(true);
				setVideoPlayState(false);
			} else {
				setTranslationVisibility(false);
				setVideoPlayState(true);
			}
		}
		e.target.focus();
	}

	return {
		enable() {
			document.addEventListener('keydown', keyHandler);
			document.addEventListener('keyup', keyHandler);
			setTranslationVisibility(false);
		},
		disable() {
			document.removeEventListener('keydown', keyHandler);
			document.removeEventListener('keyup', keyHandler);
			setTranslationVisibility(true);
		},
	};
})();

function handleSettingsUpdate({ tl, mode }) {
	// Disable by default
	CaptionObserver.disable();
	LearningMode.disable();
	globalTL = tl;

	// Activate specified mode(s)
	switch (mode) {
		case 'enabled':
			CaptionObserver.enable();
			break;
		case 'learning':
			CaptionObserver.enable();
			LearningMode.enable();
			break;
	}
}

function handleSettingsChanges(changes) {
	chrome.storage.sync.get((settings) => {
		// Merge changes with current settings
		Object.entries(changes).forEach(([setting, { newValue: value }]) => {
			settings[setting] = value;
		});
		// Handle changes
		handleSettingsUpdate({
			tl: settings['settings-tl'],
			mode: settings['settings-mode'],
		});
	});
}

// Load current settings on extension mount
handleSettingsChanges({});

// Listen for extension settings updates
chrome.storage.onChanged.addListener(function (changes, area) {
	if (area == 'sync') {
		handleSettingsChanges(changes);
	}
});
