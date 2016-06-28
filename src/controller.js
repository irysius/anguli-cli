var h = require('./helpers');
var PATH = require('path');

function templateFile(filename) {
	return PATH.resolve(__dirname, './../templates', filename);
}

function ControllerTemplates(context) {
	var t = h.targetPathResolver(context.cwd);
	function prompt(_context) {
		return Promise.all([
			h.isNodeApplication(context.cwd),
			h.hasExistingInstall(context.cwd)
		]).then(({ isNode, isInstalled }) => {
			if (!isNode || !isInstalled) {
				
			}
		});
	}
	function writeSampleController() {
		return writeController({ controller: 'Home' });
	}
	function writeSampleView() {
		return writeView({ controller: 'home', action: 'index' });
	}
	function writeController(context) {
		var sourceFile = templateFile('Controller.js.template');
		var targetFile = t.controllerFile(context.controller + 'Controller.js');
		return h.templateWriter(sourceFile, targetFile, context);
	}
	function writeRestController(context) {
		var sourceFile = templateFile('RestController.js.template');
		var targetFile = t.controllerFile(context.controller + 'Controller.js');
		return h.templateWriter(sourceFile, targetFile, context);
	}
	function writeView(context) {
		var sourceFile = templateFile('view.ejs.template');
		var targetFile = t.viewFile(PATH.join(context.controller, context.action + '.ejs'));
		return h.templateWriter(sourceFile, targetFile, context);
	}

	return {
		prompt: prompt,
		writeSampleController: writeSampleController,
		writeSampleView: writeSampleView,
		writeController: writeController,
		writeRestController: writeRestController,
		writeView: writeView
	};
}

module.exports = ControllerTemplates;