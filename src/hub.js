var h = require('./helpers');
var PATH = require('path');
var inquirer = require('inquirer');
var IgnoreError = require('@irysius/utils').IgnoreError;
var stackFilter = require('@irysius/utils').Logger.stackFilter;

var invalidDirectory = 'anguli hub is expected to run in the root of a node program that is setup with anguli.';
var invalidName = 'Hub name must be alphanumeric, with no spaces, where the first character cannot be a number.';

var questionName = {
	type: 'input',
	name: 'name',
	message: 'What is the name of your hub?'
};
var nameRegex = /^[a-zA-Z][a-zA-Z0-9]*$/;

function templateFile(filename) {
	return PATH.resolve(__dirname, './../templates', filename);
}

function HubTemplates(context) {
	var t = h.targetPathResolver(context.cwd);
	function prompt() {
		return Promise.all([
			h.isNodeApplication(context.cwd),
			h.hasExistingInstall(context.cwd)
		]).then(([isNode, isInstalled]) => {
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
			});
		}).then(name => {
			return writeHub({ hub: name });
		}).catch(e => {
			if (!(e instanceof IgnoreError)) {
				console.log(e.message);
				console.log(stackFilter(e.stack));
			}
		});
	}
	
	function writeHub(context) {
		var sourceFile = templateFile('Hub.js.template');
		var targetFile = t.hubFile(`${context.hub}Hub.js`)
		return h.templateWriter(sourceFile, targetFile, context);
	}

	return {
		prompt: prompt,
		witeHub: writeHub
	};
}

module.exports = HubTemplates;