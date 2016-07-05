var h = require('./helpers');
var PATH = require('path');
var inquirer = require('inquirer');
var IgnoreError = require('@irysius/utils').IgnoreError;
var stackFilter = require('@irysius/utils').Logger.stackFilter;
var fs = require('@irysius/utils').fs;

var invalidDirectory = 'anguli controller is expected to run in the root of a node program that is setup with anguli.';
var questionControllerName = {
	type: 'input',
	name: 'controllerName',
	message: 'What is the name of your controller?'
};
var controllerNameRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;

var CONTROLLER_BASIC = 'basic';
var CONTROLLER_REST = 'REST';
var questionControllerType = {
	type: 'list',
	choices: [CONTROLLER_BASIC, CONTROLLER_REST],
	default: CONTROLLER_BASIC,
	name: 'controllerType',
	message: 'What type of controller is this?'
};

var questionCreateModel = {
	type: 'prompt',
	name: 'createModel',
	message: 'Would you like to create the model for your RESTController as well?'
};

function templateFile(filename) {
	return PATH.resolve(__dirname, './../templates', filename);
}

function ControllerTemplates(context) {
	var t = h.targetPathResolver(context.cwd);
	function prompt() {
		return Promise.all([
			h.isNodeApplication(context.cwd),
			h.hasExistingInstall(context.cwd)
		]).then(([ isNode, isInstalled ]) => {
			if (!isNode || !isInstalled) {
				console.error(invalidDirectory);
				throw new IgnoreError();
			}
		}).then(() => {
			return inquirer.prompt([questionControllerName]).then(({ controllerName }) => {
				if (!controllerNameRegex.exec(controllerName)) {
					console.error('Controller name must be alphanumeric, with no spaces, where the first character cannot be a number.');
					throw new IgnoreError();
				}
				return controllerName[0].toUpperCase() + controllerName.substring(1);
			}).then((controllerName) => {
				return inquirer.prompt([questionControllerType]).then(({ controllerType }) => {
					switch (controllerType) {
						case CONTROLLER_REST:
							return writeRestController({ controller: controllerName });
						case CONTROLLER_BASIC:
						default:
							return Promise.all([
								writeController({ controller: controllerName }),
								writeView({ controller: controllerName, action: 'index' })
							]);
					}
				});
			});
		}).catch(e => {
			if (!e instanceof IgnoreError) {
				console.log(e.message);
				console.log(stackFilter(e.stack));
			}
		});
	}
	function writeSampleController() {
		var sourceFile = templateFile('HomeController.js');
		var targetFile = t.controllerFile('HomeController.js');
		return h.templateCopier(sourceFile, targetFile);
	}
	function writeSampleView() {
		return writeView({ controller: 'home', action: 'index' });
	}
	function writeController(context) {
		var sourceFile = templateFile('Controller.js.template');
		var targetFile = t.controllerFile(`${context.controller}Controller.js`);
		return h.templateWriter(sourceFile, targetFile, context);
	}
	function writeRestController(context) {
		var sourceFile = templateFile('RestController.js.template');
		var targetFile = t.controllerFile(`${context.controller}Controller.js`);
		return h.templateWriter(sourceFile, targetFile, context).then(() => {
			var targetModelFile = t.modelFile(`${context.controller}.js`);
			return fs.stat(targetModelFile).then(stat => {
				if (!stat) {
					return inquirer.prompt([questionCreateModel]).then(({ createModel }) => {
						var modelTemplates = require('./model');
						if (createModel) {
							var sourceModelFile = templateFile('Model.js.template');
							var targetModelFile = t.modelFile(`${context.controller}.js`);
							return h.templateWriter(sourceModelFile, targetModelFile, { model: context.controller });
						}
					});
				} else {
					console.log(`Model for the RESTController ${context.controller} already exists.`);
				}
			});
		});
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