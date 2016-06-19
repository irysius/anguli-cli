var initializers = [];
var context = {
	initialize: function () {
		var promise = Promise.resolve();
		// Initializer order matters
		initializers.forEach(initializer => {
			promise = promise.then(initializer);
		});
		return promise;
	}
};

// TODO: Make sure all libraries that console log takes a logger
// Schema
var SchemaService = require('@irysius/schema-service');
var schemas;

function initializeSchema() {
	return SchemaService.initialize(
		PATH.join(__dirname, 'api', 'schemas')).then(_schemas => {
			schemas = _schemas;
		});
}
initializers.push(initializeSchema);

Object.defineProperty(context, 'Schemas', {
	get: () => {
		if (!schemas) { throw new Error('Schemas not initialized.'); }
		return schemas;
	}	
});

// Configuration
var ConfigManager = require('@irysius/config-manager');
var configManager = ConfigManager({});
var configuration;

var FileConfigService = require('@irysius/file-config-service');
var fileConfigService = FileConfigService({ 
	rootFolder: __dirname, 
	paths: ['config.json'] 
});

function initializeConfiguration() {
	return configManager
		.use(fileConfigService)
		.assemble().then(_configuration => {
			return SchemaService.validate(_configuration, context.Schemas['config']);
		}).then(_configuration => {
			configuration = _configuration;
		});
}
initializers.push(initializeConfiguration);

Object.defineProperty(context, 'Configuration', {
	get: () => {
		if (!configuration) { throw new Error('Configuration not initialized.'); }
		return configuration;
	}
});

// Model
var Modeller = require('@irysius/anguli-components').Modeller;
var Waterline = require('waterline');
var modeller = new Modeller({ Waterline: Waterline });
var models;

function initializeModels() {
	var config = context.Configuration;
	return modeller.initialize(
		config.waterline, PATH.join(__dirname, 'api', 'models')).then(_models => {
			models = _models;
		});
}
initializers.push(initializeModels);

Object.defineProperty(context, 'Models', {
	get: () => {
		if (!models) { throw new Error('Models not initialized.'); }
		return models;
	}
});

module.exports = context;