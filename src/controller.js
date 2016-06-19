var h = require('./helpers');
function controller(context) {
	return Promise.all([
		h.isNodeApplication(context.cwd),
		h.hasExistingInstall(context.cwd)
	]).then(({ isNode, isInstalled }) => {
		if (!isNode || !isInstalled) {
			
		}
	});
}

module.exports = controller;