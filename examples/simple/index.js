"use strict";

let { ServiceBroker } = require("moleculer");
let StoreService = require("../../../moleculer-db/index");

let CosmosDbAdapter = require("../../index");
const connectOpt = require("../../../../../connectOpt");

const dbName = "sample database";
const containerName = "sample collection";

// Create broker
let broker = new ServiceBroker({
  logger: console,
  logLevel: "debug"
});

// Load my service
broker.createService(StoreService, {
  name: "posts",
  adapter: new CosmosDbAdapter(connectOpt, dbName, containerName),
  settings: {},

  async afterConnected() {
    // console.log(this.adapter);
    /*
		let insertResponse = await this.adapter.insert({
			test: "moleculer-cosmos-adapter-test"
		});
		console.log(insertResponse);
		*/
    let result = await this.adapter.find();
    // console.log(res);
    // let idList = ["5b774410-0141-4964-8178-f4deb38cea08", "f13847a7-ff51-4be6-b782-a596b7af6ca5"]
    // this.adapter.findByIds(idList);

    /*
		let entries = ["f13847a7-ff51-4be6-b782-a596b7af6ca5"];

		let result = await this.adapter.clear(entries);
		*/
    console.log(result);
  }
});

broker.start().then(async () => {
  try {
    /*let result = await broker.call("posts.create", {
			test: "called from Moleculer broker"
		});*/
    // let result = await broker.call("posts.find");
    /*
		let result = await broker.call("posts.remove", {
			id: "ecb8eaac-e867-4601-8950-91fba7731e68"
		});
		*/
    // console.log(result);
    /*
		let idList = [
			"5b774410-0141-4964-8178-f4deb38cea08",
			"f13847a7-ff51-4be6-b782-a596b7af6ca5"
		];

		let result = await broker.call("posts.count");
		console.log(result);
		*/
    /*
		let entities = [{ a: "Hello 1" }, { b: "Hello 2" }];
		let result = await broker.call("posts.insert", { entities: entities });
		console.log(result);
		*/
    /*
		let params = {
			id: "f908e7b4-bd1f-4767-8c06-821f822bb346",
			b: "Hello UPDATED HANDLER"
		};
		let result = await broker.call("posts.update", params);
		console.log(result);
		*/
  } catch (error) {
    console.log(error);
  }
});
