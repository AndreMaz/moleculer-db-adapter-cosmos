"use strict";
const { ServiceBroker } = require("moleculer");
const CosmosDbAdapter = require("../../src");
const DbService = require("moleculer-db");
const { default: cosmosServer } = require("@zeit/cosmosdb-server");

const https = require("https");

describe("Test With Moleculer DB", () => {
  let cosmosMock;

  const connection = {
    endpoint: `https://localhost:3000`,
    key: "dummy key",
    agent: https.Agent({ rejectUnauthorized: false })
  };
  const dbName = "dbTest";
  const containerName = "dbContainer";

  const adapter = new CosmosDbAdapter(connection, dbName, containerName);

  const broker = new ServiceBroker({ logger: false });
  const service = broker.createService({
    name: "store",
    mixins: [DbService],
    adapter: adapter
  });

  const dummyEntries = [
    { id: "1", test: "one" },
    { id: "2", test: "two" },
    { id: "3", test: "three" }
  ];

  beforeAll(() => {
    return new Promise((resolve, reject) => {
      cosmosMock = cosmosServer().listen(3000, () => {
        console.log(`Cosmos DB server running at https://localhost:3000`);
        resolve();
      });
    });
  });

  beforeAll(() => broker.start());

  afterAll(() => {
    return cosmosMock.close(err => {
      if (err) console.log(err);

      return broker.stop();
    });
  });

  it("should create the service", () => {
    expect(service).toBeDefined();
    expect(service.name).toBe("store");
    expect(service.adapter).toBeDefined();
  });

  it("should call find", async () => {
    expect.assertions(1);

    let res = await broker.call("store.find");
    expect(res).toEqual([]);
  });

  it("should call count", async () => {
    expect.assertions(1);

    let res = await broker.call("store.count");
    expect(res).toEqual(0);
  });

  it("should call create", async () => {
    expect.assertions(2);

    let res = await broker.call("store.create", dummyEntries[0]);
    expect(res.id).toEqual(dummyEntries[0].id);
    expect(res.test).toEqual(dummyEntries[0].test);
  });

  it("should call insert", async () => {
    expect.assertions(1);

    let res = await broker.call("store.insert", {
      entities: [dummyEntries[1], dummyEntries[2]]
    });
    expect(res.length).toEqual(2);
  });

  it("should call list", async () => {
    expect.assertions(1);

    let res = await broker.call("store.list");
    expect(res.rows.length).toEqual(3);
  });

  it("should call count again", async () => {
    expect.assertions(1);

    let res = await broker.call("store.count");
    expect(res).toEqual(3);
  });

  it("should call get", async () => {
    expect.assertions(2);

    let res = await broker.call("store.get", { id: "1" });
    expect(res.id).toEqual(dummyEntries[0].id);
    expect(res.test).toEqual(dummyEntries[0].test);
  });

  it("should call update", async () => {
    expect.assertions(2);

    let res = await broker.call("store.update", { id: "1", test: "UPDATE" });
    expect(res.id).toEqual(dummyEntries[0].id);
    expect(res.test).toEqual("UPDATE");
  });

  it("should call update", async () => {
    expect.assertions(2);

    let res = await broker.call("store.remove", { id: "1" });
    expect(res.id).toEqual(dummyEntries[0].id);
    let count = await broker.call("store.count");
    expect(count).toEqual(2);
  });
});
