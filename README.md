![Moleculer logo](http://moleculer.services/images/banner.png)

# moleculer-db-adapter-cosmos [![Build Status](https://travis-ci.org/AndreMaz/moleculer-db-adapter-cosmos.svg?branch=master)](https://travis-ci.org/AndreMaz/moleculer-db-adapter-cosmos) [![Coverage Status](https://coveralls.io/repos/github/AndreMaz/moleculer-db-adapter-cosmos/badge.svg?branch=master)](https://coveralls.io/github/AndreMaz/moleculer-db-adapter-cosmos?branch=master) [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/AndreMaz/moleculer-db-adapter-cosmos/master/LICENSE) [![npm](https://img.shields.io/npm/v/moleculer-db-adapter-cosmos.svg)](https://www.npmjs.com/package/moleculer-db-adapter-cosmos) [![Downloads](https://img.shields.io/npm/dm/moleculer-db-adapter-cosmos.svg)](https://www.npmjs.com/package/moleculer-db-adapter-cosmos) ![stability-experimental](https://img.shields.io/badge/stability-experimental-orange.svg)

> **Warning**: This DB adapter is not stable and it does not contain any [Request Units](https://docs.microsoft.com/en-us/azure/cosmos-db/request-units) optimizations. Use it at your own risk.

[CosmosDB SQL native adapter](https://www.npmjs.com/package/@azure/cosmos) for Moleculer DB service.

## Install

```bash
$ npm install moleculer-db moleculer-db-adapter-cosmos --save
```

## Usage

```js
const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const CosmosDbAdapter = require("moleculer-db-adapter-cosmos");

// Mock CosmosDB server
const { default: cosmosServer } = require("@zeit/cosmosdb-server");
const https = require("https");

const connection = {
  endpoint: `https://localhost:3000`, // URL to your Cosmos DB
  key: "dummy key", // Put your password
  // Create new Agent with disabled SSL verification
  // since the server uses self-signed certificate
  agent: https.Agent({ rejectUnauthorized: false }) // For test purposes only. Remove this when working with an actual DB
};

const dbName = "sample_database";
const containerName = "sample_collection";

// Create broker
let broker = new ServiceBroker({
  logger: console,
  logLevel: "debug"
});

// Create a service
broker.createService({
  name: "store",
  // Load DB methods and action handlers
  mixins: [DbService],
  // Create a Cosmos DB adapter
  adapter: new CosmosDbAdapter(connection, dbName, containerName),

  async afterConnected() {
    this.broker.logger.info("Connection Established");
  }
});

// Start mock CosmosDB server
cosmosServer().listen(3000, () => {
  // Start the broker
  broker.start().then(async () => {
    const documentDefinition = {
      id: "hello world doc",
      content: "Hello World!"
    };

    // Insert an Item
    let item = await broker.call("store.create", documentDefinition);

    broker.logger.info(`Item Created`);
    broker.logger.info(item);

    // Find all items in BD
    let result = await broker.call("store.find");
    broker.logger.info(`Items in DB`);
    broker.logger.info(result);

    // Count the items
    let count = await broker.call("store.count");
    broker.logger.info(`Number of Items in DB`);
    broker.logger.info(count);

    // Remove by ID
    broker.logger.info(`Removing an Item`);
    await broker.call("store.remove", { id: documentDefinition.id });

    // Count again
    count = await broker.call("store.count");
    broker.logger.info(`Number of Items in DB`);
    broker.logger.info(count);
  });
});
```

# Test

```bash
$ npm test
```

In development with watching

```bash
$ npm run ci
```

# License

The project is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact

Copyright (c) 2019 André Mazayev
