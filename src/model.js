var h = require('./helpers');
var PATH = require('path');
var inquirer = require('inquirer');
var IgnoreError = require('@irysius/utils').IgnoreError;
var stackFilter = require('@irysius/utils').Logger.stackFilter;

var invalidDirectory = 'anguli controller is expected to run in the root of a node program that is setup with anguli.';
var questionModelName = {
	type: 'input',
	name: 'modelName',
	message: 'What is the name of your model?'
};
var modelNameRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;

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
			return inquirer.prompt([questionModelName]).then(({ modelName }) => {
				if (!modelNameRegex.exec(modelName)) {
					console.error('Model name must be alphanumeric, with no spaces, where the first character cannot be a number.');
					throw new IgnoreError();
				}
				return modelName[0].toUpperCase() + modelName.substring(1);
			}).then(modelName => {
				return writeModel({ model: modelName });
			});
		}).catch(e => {
			if (!e instanceof IgnoreError) {
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
	
	return {
		prompt: prompt,
		writeSampleModel: writeSampleModel,
		writeModel: writeModel
	};
}

module.exports = ModelTemplates;