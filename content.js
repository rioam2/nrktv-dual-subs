// Called for each new caption node mounted to the DOM
function handleCaptionMount(node) {
	const text = node.innerText;

	// Handle translation request within service-worker to alleviate CORS/security conflicts
	const req = { action: 'translate', payload: { text, source_lang: 'no', target_lang: 'en' } };
	chrome.extension.sendRequest(req, ({ error, response }) => {
		if (!error) {
			node.setAttribute('data-translation', response);
		} else {
			console.error(error);
		}
	});
}

// Listen for captions elements mounting
const captionsContainerQuery = '.ludo-captions';
const containerObserver = new MutationObserver((mutations) => {
	mutations.forEach((mutation) => {
		if (!mutation.addedNodes) return;
		Array.from(mutation.addedNodes).forEach((node) => {
			const parent = node.parentElement;
			const isCaption = parent && parent.matches(captionsContainerQuery);
			if (isCaption) {
				handleCaptionMount(node);
			}
		});
	});
});
containerObserver.observe(document.body, {
	childList: true,
	subtree: true,
	attributes: false,
	characterData: false,
});
