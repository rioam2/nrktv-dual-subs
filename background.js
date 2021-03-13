// Handle actions sent from content script running within browser context
chrome.extension.onRequest.addListener(async function (req, _, reply) {
	try {
		switch (req.action) {
			case 'translate':
				const { text, source_lang, target_lang } = req.payload;
				const translation = await getTranslation(text, source_lang, target_lang);
				reply({
					error: null,
					response: translation,
				});
				return;
			default:
				reply({
					error: new Error(`Unknown action: ${req.action}`),
					response: null,
				});
				return;
		}
	} catch (error) {
		reply({ error, response: null });
	}
});

// Helper function to retrieve a translation from Google Translate API
function getTranslation(text, source_lang, target_lang) {
	// Build translation query
	const baseURL = `https://clients5.google.com/translate_a/t`;
	let reqURL = baseURL;
	reqURL += `?client=dict-chrome-ex`;
	reqURL += `&q=${encodeURI(text)}`;
	reqURL += `&sl=${source_lang}&tl=${target_lang}&ie=UTF8&oe=UTF8`;

	// Return request response as a promise
	const requestTimeoutMs = 3000;
	return new Promise((resolve, reject) => {
		// Don't leave promise dangling if request fails
		const timeoutRejection = setTimeout(() => {
			reject(new Error('Translation request timed out'));
		}, requestTimeoutMs);

		// Send off the request and resolve once complete
		const xhr = new XMLHttpRequest();
		xhr.open('GET', reqURL, true);
		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4 && xhr.status === 200) {
				const res = JSON.parse(xhr.responseText);
				if (res.sentences && Array.isArray(res.sentences)) {
					// Undocumented API response schema until March 2021
					resolve(res.sentences.map((sentence) => sentence.trans).join(''));
				} else if (Array.isArray(res)) {
					// Undocumented API response schema as of March 2021+
					resolve(res.flat(1e9)[0]);
				}
				clearTimeout(timeoutRejection);
			}
		};
		xhr.send();
	});
}
