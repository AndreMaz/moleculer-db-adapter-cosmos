"use strict";

const { ServiceBroker } = require("moleculer");
const DbService = require("moleculer-db");
const CosmosDbAdapter = require("../../index");

const { default: cosmosServer } = require("@zeit/cosmosdb-server");
const https = require("https");

const connection = {
  endpoint: `https://localhost:3000`,
  key: "dummy key",
  // disable SSL verification
  // since the server uses self-signed certificate
  agent: https.Agent({ rejectUnauthorized: false })
};
const dbName = "sample_database";
const containerName = "sample_collection";

// Create broker
let broker = new ServiceBroker({
  logger: console,
  logLevel: "debug"
});

// Load my service
broker.createService({
  name: "store",
  mixins: [DbService],
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
