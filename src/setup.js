var _ = require('lodash');
var inquirer = require('inquirer');
var h = require('./helpers');
var fs = require('@irysius/utils').fs;
var PATH = require('path');
var dependency = require('./dependency');
var IgnoreError = require('@irysius/utils').IgnoreError;
var stackFilter = require('@irysius/utils').Logger.stackFilter;

var invalidDirectory = 'anguli setup is expected to run in the root of a node project. Please re-run the command in a directory with a package.json.';
var needsBowerJson = 'anguli setup currently expects there to be a bower.json file to manipulate for client-side libraries. Please re-run the command in a directory with a bower.json.';
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

var questionIncludeReact = {
	type: 'confirm',
	name: 'includereact',
	message: 'Would you like to use React in this project?'
};

var questionIncludeBootstrap = {
	type: 'confirm',
	name: 'includebootstrap',
	message: 'Would you like to use Bootstrap (for styles or components) in this project? (will install jQuery)'
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
	{ package: 'bluebird', version: '3.4.1' },
	{ package: 'once', version: '1.3.3' }
];

var devDependencies = [
	{ package: 'babel-preset-es2015', version: '^6.6.0' },
	{ package: 'babel-preset-react', version: '^6.11.1' },
	{ package: 'grunt', version: '^0.4.5' },
	{ package: 'grunt-babel', version: '^6.0.0' },
	{ package: 'grunt-contrib-clean', version: '^1.0.0' },
	{ package: 'grunt-contrib-copy', version: '^1.0.0' },
	{ package: 'grunt-contrib-watch', version: '^0.6.1' },
	{ package: 'mocha', version: '^2.4.5' },
	{ package: 'chai', version: '^3.5.0' }
];

var reactServerDependencies = [
	{ package: 'react', version: '15.2.x' },
	{ package: 'react-dom', version: '15.2.x' }
];

var reactClientDependencies = [
	{ 
		package: 'react', version: '15.2.x',
		copy: [
			{ src: 'bower_components/react/react.js', dest: 'src/static/js/react.js' },
			{ src: 'bower_components/react/react-dom.js', dest: 'src/static/js/react-dom.js' }
		]
	}
];

var bootstrapDependencies = [
	{ 
		package: 'bootstrap', version: '3.3.x',
		copy: [
			{ 
				expand: true,
				cwd: 'bower_components/bootstrap/dist/',
				src: ['**/*.*'],
				dest: 'src/static' 
			}
		] 
	},
	{ 
		package: 'jquery', version: '2.2.x',
		copy: [
			{ src: 'bower_components/jquery/dist/jquery.js', dest: 'src/static/js/jquery.js' }
		]
	}
]

var bowerDependencies = [
	{ 
		package: 'axios', version: '0.12.x', 
		copy: [
			{ src: 'bower_components/axios/dist/axios.js', dest: 'src/static/js/axios.js' }
		]
	},
	{ 
		package: 'moment', version: '2.13.x',
		copy: [
			{ src: 'bower_components/moment/moment.js', dest: 'src/static/js/moment.js' }
		] 
	},
	{ 
		package: 'lodash', version: '4.13.x',
		copy: [
			{ src: 'bower_components/lodash/dist/lodash.js', dest: 'src/static/js/lodash.js' }
		] 
	}
];

var dependencies = [];
var clientDependencies = [];
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
		return h.hasBowerJson(context.cwd);
	}).then(yes => {
		if (!yes) {
			console.error(needsBowerJson);
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
		var options = [
			optionHub, optionSessions, optionIdentity, optionModels
		];
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

			if (base.needsHub) { 
				dependencies.push({ package: 'socket.io', version: '1.4.8' });
				folderAsserts.push(fs.assertFolder(t.hubFile())); 
			}
			if (base.needsModel) { 
				dependencies.push({ package: 'waterline', version: '0.12.2' });
				dependencies.push({ package: 'sails-disk', version: '0.10.10' });
				folderAsserts.push(fs.assertFolder(t.modelFile())); 
			}

			if (base.needsIdentity) {
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
		})
	}).then(() => {
		return inquirer.prompt([questionIncludeReact, questionIncludeBootstrap]).then(({ includereact, includebootstrap }) => {
			if (includereact) {
				dependencies = _.concat(dependencies, reactServerDependencies);
				clientDependencies = _.concat(clientDependencies, reactClientDependencies);
			}
			if (includebootstrap) {
				clientDependencies = _.concat(clientDependencies, bootstrapDependencies);
			}
		});
	}).then(() => {
		// Update package.json, bower.json, and Gruntfile.js
		var packageJson = PATH.resolve(context.cwd, 'package.json');
		dependency.assert(packageJson, 
			_.concat(baseDependencies, utilityDependencies, irysiusDependencies, dependencies));
		dependency.assert(packageJson, devDependencies, true);

		var bowerJson = PATH.resolve(context.cwd, 'bower.json');
		var masterClientDependencies = _.concat(bowerDependencies, clientDependencies); 
		dependency.assert(bowerJson, masterClientDependencies);

		var sourceFile = templateFile('Gruntfile.js.template');
		var targetFile = t.rootFile('Gruntfile.js');
		var a = _.flatMap(masterClientDependencies, cd => cd.copy);
		console.log(a);
		var bowerCopies = JSON.stringify(a);
		console.log(bowerCopies);
		return h.templateWriter(sourceFile, targetFile, { bowerCopies: bowerCopies });
	}).catch(e => { 
		if (!(e instanceof IgnoreError)) {
			console.log(e.message);
			console.log(stackFilter(e.stack));
		}
	});
}

module.exports = setup;