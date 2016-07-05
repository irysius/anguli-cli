var _ = require('lodash');
var inquirer = require('inquirer');
var h = require('./helpers');
var fs = require('@irysius/utils').fs;
var PATH = require('path');
var dependency = require('./dependency');
var IgnoreError = require('@irysius/utils').IgnoreError;
var stackFilter = require('@irysius/utils').Logger.stackFilter;

var invalidDirectory = 'anguli setup is expected to run in the root of a node project. Please re-run the command in a directory with a package.json.';
var existingInstallation = {
	type: 'confirm',
	name: 'proceed',
	message: 'anguli setup detects an existing installation in this project. anguli will not override existing files. Do you wish to continue?' 	
};

var optionHub = {
	type: 'confirm',
	name: 'hubs',
	message: 'Will your application need socket hubs?' 
};
var optionModels = {
	type: 'confirm',
	name: 'models',
	message: 'Will your application need an ORM?' 	
};
var optionSessions = {
	type: 'confirm',
	name: 'sessions',
	message: 'Will your application need sessions?'
};
var optionIdentity = {
	type: 'confirm',
	name: 'identities',
	message: 'Will your application need to track user identities?',
	when: ({sessions}) => {
		return !!sessions;
	}
};

var questionUserModel = {
	type: 'confirm',
	name: 'userModel',
	message: 'Would you like to create a User model for use with identities?'
};

var questionSampleController = {
	type: 'confirm',
	name: 'samplecontroller',
	message: 'Would you like to create a sample HomeController and its view?'
};

var setupComplete = 'anguli setup has completed installing project files. Please run npm install to finish installing external dependencies.';

var irysiusDependencies = [
	{ package: '@irysius/utils', version: '0.1.x' },
	{ package: '@irysius/anguli-components', version: '0.1.x' },
	{ package: '@irysius/schema-service', version: '0.1.x' },
	{ package: '@irysius/config-manager', version: '0.1.x' },
	{ package: '@irysius/file-config-service', version: '0.1.x' },
];

var utilityDependencies = [
	{ package: 'lodash', version: '4.13.x' },
	{ package: 'moment', version: '2.13.x' },
	{ package: 'chance', version: '1.0.x' }	
];

var baseDependencies = [
	{ package: 'express', version: '4.13.4' },
	{ package: 'body-parser', version: '1.14.2' },
	{ package: 'compression', version: '1.6.1' },
	{ package: 'cookie-parser', version: '1.4.1' },
	{ package: 'cors', version: '2.7.1' },
	{ package: 'errorhandler', version: '1.4.3' },
	{ package: 'method-override', version: '2.3.5' },
	{ package: 'multer', version: '1.1.0' },
	{ package: 'ejs', version: '2.4.1' },
	{ package: 'bluebird', version: '3.4.1' }
];

var devDependencies = [
	{ package: 'babel-preset-es2015', version: '^6.6.0' },
	{ package: 'grunt', version: '^0.4.5' },
	{ package: 'grunt-babel', version: '^6.0.0' },
	{ package: 'grunt-contrib-clean', version: '^1.0.0' },
	{ package: 'grunt-contrib-copy', version: '^1.0.0' },
	{ package: 'grunt-contrib-watch', version: '^0.6.1' },
	{ package: 'mocha', version: '^2.4.5' },
	{ package: 'chai', version: '^3.5.0' }
];

var dependencies = [];
var folderAsserts = [];

var t; // targetPathResolver

function templateFile(filename) {
	return PATH.resolve(__dirname, './../templates', filename);
}

function writeMain(context) {
	var sourceFile = templateFile('main.js');
	var targetFile = t.srcFile('main.js');
	return h.templateCopier(sourceFile, targetFile);	
}

function writeServer(context) {
	var sourceFile = templateFile('server.js.template');
	var targetFile = t.srcFile('server.js');
	return h.templateWriter(sourceFile, targetFile, context);
}

function writeContext(context) {
	var sourceFile = templateFile('context.js.template');
	var targetFile = t.srcFile('context.js');
	return h.templateWriter(sourceFile, targetFile, context);
}

function writeConfigSchema(context) {
	var sourceFile = templateFile('config.json');
	var targetFile = t.schemaFile('config.json');
	return h.templateCopier(sourceFile, targetFile);
}

function setup(context) {
	t = h.targetPathResolver(context.cwd);

	// Begin main logic
	return h.isNodeApplication(context.cwd).then(yes => {
		if (!yes) { 
			console.error(invalidDirectory);
			throw new IgnoreError(); 
		}
		return h.hasExistingInstall(context.cwd);
	}).then(yes => {
		if (yes) { 
			return inquirer.prompt([existingInstallation]).then(({ proceed }) => {
				if (!proceed) { throw new IgnoreError(); }
			});
		}
	}).then(() => {
		var options = [optionHub, optionSessions, optionIdentity, optionModels];
		console.log('Setting up the anguli framework...');
		return inquirer.prompt(options).then(({hubs, sessions, identities, models}) => {
			// Do stuff
			var base = {
				needsHub: !!hubs,
				needsSession: !!sessions,
				needsIdentity: !!identities,
				needsModel: !!models,
				userModelIdentity: false
			};

			folderAsserts.push(fs.assertFolder(t.controllerFile()));
			folderAsserts.push(fs.assertFolder(t.viewFile()));
			folderAsserts.push(fs.assertFolder(t.schemaFile()));

			if (hubs) { 
				dependencies.push({ package: 'socket.io', version: '1.4.6' });
				folderAsserts.push(fs.assertFolder(t.hubFile())); 
			}
			if (models) { 
				dependencies.push({ package: 'waterline', version: '0.12.2' });
				dependencies.push({ package: 'sails-disk', version: '0.10.10' });
				folderAsserts.push(fs.assertFolder(t.modelFile())); 
			}

			if (identities) {
				return fs.stat(t.modelFile('User.js')).then(stat => {
					if (!stat) {
						return inquirer.prompt([questionUserModel]).then(({ userModel }) => {
							return userModel;
						});
					} else {
						console.log('Automatically using User model for identity.');
						return true;
					}
				}).then(userModel => {
					var sourceFile = templateFile('User.js');
					var targetFile = t.modelFile('User.js');
					if (userModel) {
						base.userModelIdentity = true;
						return h.templateCopier(sourceFile, targetFile);
					}
				}).then(() => {
					return base;
				});
			}

			return base;
		}).then(base => {
			var renderContext = _.merge(base, context);
			console.log(renderContext);

			return Promise.all(folderAsserts).then(() => {
				return Promise.all([
					writeMain(renderContext),
					writeServer(renderContext),
					writeContext(renderContext),
					writeConfigSchema(renderContext)
				]);
			}).then(() => {
				return inquirer.prompt([questionSampleController]).then(({ samplecontroller }) => {
					var controllerTemplates = require('./controller')(context);
					if (samplecontroller) {
						return Promise.all([
							controllerTemplates.writeSampleController(),
							controllerTemplates.writeSampleView()
						]);
					}
				});
			});
		}).then(() => {
			var packageJson = PATH.resolve(context.cwd, 'package.json');
			dependency.assert(packageJson, 
				_.concat(baseDependencies, utilityDependencies, irysiusDependencies, dependencies));
			dependency.assert(packageJson, devDependencies, true);
			var sourceFile = templateFile('Gruntfile.js.file');
			var targetFile = t.rootFile('Gruntfile.js');
			return h.templateCopier(sourceFile, targetFile);
		});
	}).catch(e => { 
		if (!e instanceof IgnoreError) {
			console.log(e.message);
			console.log(stackFilter(e.stack));
		}
	});
}

module.exports = setup;