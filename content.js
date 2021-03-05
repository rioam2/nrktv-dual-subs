let globalTL = 'en';

// Called for each new caption node mounted to the DOM
function handleCaptionMount(node) {
	const text = node.innerText;
	// Handle translation request within service-worker to alleviate CORS/security conflicts
	const req = { action: 'translate', payload: { text, source_lang: 'no', target_lang: globalTL } };
	chrome.extension.sendRequest(req, ({ error, response }) => {
		if (!error) {
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

function handleSettingsUpdate({ en, tl }) {
	en ? CaptionObserver.enable() : CaptionObserver.disable();
	globalTL = tl;
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
