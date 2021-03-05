const settingsForm = document.getElementById('settings-form');

function forEachSetting(cb) {
	Array.from(settingsForm.childNodes).forEach((fieldWrapper) => {
		const children = Array.from(fieldWrapper.childNodes).filter((n) => n.nodeName !== '#text');
		const field = children[1];
		if (field) cb(field);
	});
}

// Save settings
settingsForm.addEventListener('submit', function handleSaveSettings(e) {
	e.preventDefault();

	const newSettings = {};
	forEachSetting((node) => {
		console.log(node);
		if (node.type === 'checkbox') {
			newSettings[node.id] = node.checked;
		} else {
			newSettings[node.id] = node.value;
		}
	});
	chrome.storage.sync.set(newSettings, function () {});
});

// Restore settings
document.addEventListener('DOMContentLoaded', function () {
	chrome.storage.sync.get((settings) => {
		forEachSetting((node) => {
			const key = node.id;
			const value = settings[key];
			console.log({ key, value });
			if (value) {
				if (node.type === 'checkbox') {
					node.checked = value;
				} else {
					node.value = value;
				}
			}
		});
	});
});
