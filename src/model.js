var h = require('./helpers');
var PATH = require('path');
var inquirer = require('inquirer');
var IgnoreError = require('@irysius/utils').IgnoreError;
var stackFilter = require('@irysius/utils').Logger.stackFilter;
var fs = require('@irysius/utils').fs;

var invalidDirectory = 'anguli controller is expected to run in the root of a node program that is setup with anguli.';
var invalidName = 'Model name must be alphanumeric, with no spaces, where the first character cannot be a number.';
var questionName = {
	type: 'input',
	name: 'name',
	message: 'What is the name of your model?'
};
var nameRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;

var CH_NONE = 'No';
var CH_CONTROLLER_ONLY = 'Controller Only';
var CH_CONTROLLER_AND_HUB = 'Controller and Hub';
var questionIncludeControllerHub = {
	type: 'list',
	choices: [CH_NONE],
	default: CH_NONE,
	name: 'includeControllerHub',
	message: 'Would you like a controller and/or a hub to be automatically created for your model?'
};

function templateFile(filename) {
	return PATH.resolve(__dirname, './../templates', filename);
}

function ModelTemplates(context) {
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
			return inquirer.prompt([questionName]).then(({ name }) => {
				if (!nameRegex.exec(name)) {
					console.error(invalidName);
					throw new IgnoreError();
				}
				return name[0].toUpperCase() + name.substring(1);
			}).then(name => {
				return writeModel({ model: name }).then(() => {
					return name;
				});
			});
		}).then(name => {
			return Promise.all([
				fs.stat(t.controllerFile(`${context.model}Controller.js`)),
				fs.stat(t.hubFile(`${context.model}Hub.js`))
			]).then(([hasController, hasHub]) => {
				if (!hasController) {
					questionIncludeControllerHub.choices.push(CH_CONTROLLER_ONLY);
				}
				if (!hasController && !hasHub) {
					questionIncludeControllerHub.choices.push(CH_CONTROLLER_AND_HUB);
				}
			}).then(() => {
				if (questionIncludeControllerHub.choices.length > 1) {
					return inquirer.prompt([questionIncludeControllerHub]).then(({ includeControllerHub }) => {
						switch (includeControllerHub) {
							case CH_CONTROLLER_ONLY:
								return writeModelController({ model: name });
							case CH_CONTROLLER_AND_HUB:
								return writeModelControllerHub({ model: name });
							case CH_NONE:
							default:
								break;
						}
					});
				}
			});
		}).catch(e => {
			if (!(e instanceof IgnoreError)) {
				console.log(e.message);
				console.log(stackFilter(e.stack));
			}
		});
	}
	function writeSampleModel() {
		return writeModel({ model: 'User' });
	}
	function writeModel(context) {
		var sourceFile = templateFile('Model.js.template');
		var targetFile = t.modelFile(`${context.model}.js`);
		return h.templateWriter(sourceFile, targetFile, context);
	}
	function writeModelController(context) {
		var sourceFile = templateFile('RestController.js.template');
		var targetFile = t.controllerFile(`${context.model}Controller.js`);
		return h.templateWriter(sourceFile, targetFile, context);
	}
	function writeModelControllerHub(context) {
		var sourceFile1 = templateFile('RestHub.js.template');
		var targetFile1 = t.hubFile(`${context.model}Hub.js`);
		var sourceFile2 = templateFile('RestHubController.js.template');
		var targetFile2 = t.controllerFile(`${context.model}Controller.js`);
		return Promise.all([
			h.templateWriter(sourceFile1, targetFile1, context),
			h.templateWriter(sourceFile2, targetFile2, context),
		]);
	}
	
	return {
		prompt: prompt,
		writeSampleModel: writeSampleModel,
		writeModel: writeModel
	};
}

module.exports = ModelTemplates;