let globalTL = 'en';
let globalShowTranslation = true;

// Called for each new caption node mounted to the DOM
function handleCaptionMount(node) {
	const text = node.innerText;
	// Handle translation request within service-worker to alleviate CORS/security conflicts
	const req = { action: 'translate', payload: { text, source_lang: 'no', target_lang: globalTL } };
	chrome.extension.sendRequest(req, ({ error, response }) => {
		if (!error) {
			node.setAttribute('hide-translation', !globalShowTranslation);
			node.setAttribute('data-translation', response);
		} else {
			console.error(error);
		}
	});
}

const CaptionObserver = (function (handler) {
	// Listen for captions elements mounting
	const captionsContainerQuery = '.ludo-captions';
	const captionsObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			if (!mutation.addedNodes) return;
			Array.from(mutation.addedNodes).forEach((node) => {
				const parent = node.parentElement;
				const isCaption = parent && parent.matches(captionsContainerQuery);
				if (isCaption) {
					handler(node);
				}
			});
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
				console.log('keydown');
				setTranslationVisibility(true);
				setVideoPlayState(false);
			} else {
				console.log('keyup');
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

function handleSettingsUpdate({ en, tl, learnMode }) {
	if (en) {
		CaptionObserver.enable();
		learnMode ? LearningMode.enable() : LearningMode.disable();
		globalTL = tl;
	} else {
		CaptionObserver.disable();
		LearningMode.disable();
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
			en: settings['settings-en'],
			tl: settings['settings-tl'],
			learnMode: settings['settings-learn-mode'],
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
