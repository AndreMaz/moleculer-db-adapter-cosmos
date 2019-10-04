"use strict";
const { ServiceBroker } = require("moleculer");
const CosmosDbAdapter = require("../../src");
const { default: cosmosServer } = require("@zeit/cosmosdb-server");

const https = require("https");

describe("Test CosmosStoreAdapter", () => {
  let cosmosMock;

  const broker = new ServiceBroker({ logger: false });
  const service = broker.createService({
    name: "store"
  });

  const connection = {
    endpoint: `https://localhost:3000`,
    key: "dummy key",
    agent: https.Agent({ rejectUnauthorized: false })
  };
  const dbName = "dbTest";
  const containerName = "dbContainer";

  const adapter = new CosmosDbAdapter(connection, dbName, containerName);

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

  beforeEach(() => {
    adapter.init(broker, service);
  });

  afterAll(() => {
    cosmosMock.close(err => {
      if (err) console.log(err);
    });
  });

  it("should be created", () => {
    expect(adapter).toBeDefined();

    expect(adapter.connection).toBe(connection);
    expect(adapter.dbName).toBe(dbName);
    expect(adapter.containerName).toBe(containerName);

    expect(adapter.init).toBeDefined();
    expect(adapter.connect).toBeDefined();
    expect(adapter.disconnect).toBeDefined();

    expect(adapter.find).toBeDefined();
    expect(adapter.findOne).toBeDefined();

    expect(adapter.findById).toBeDefined();
    expect(adapter.findByIds).toBeDefined();

    expect(adapter.count).toBeDefined();

    expect(adapter.insert).toBeDefined();
    expect(adapter.insertMany).toBeDefined();

    expect(adapter.updateById).toBeDefined();
    expect(adapter.updateMany).toBeDefined();

    expect(adapter.removeById).toBeDefined();
    expect(adapter.removeMany).toBeDefined();

    expect(adapter.clear).toBeDefined();
    expect(adapter.beforeSaveTransformID).toBeInstanceOf(Function);
    expect(adapter.afterRetrieveTransformID).toBeInstanceOf(Function);
  });

  it("should init", () => {
    expect(adapter.broker).toBe(broker);
    expect(adapter.service).toBe(service);
  });

  it("should connect", async () => {
    try {
      await adapter.connect();
      expect(adapter.database).toBeDefined();
      expect(adapter.container).toBeDefined();
    } catch (error) {
      expect(error).toBeDefined;
    }
  });

  it("should disconnect", () => {
    return adapter.disconnect().then(res => {
      expect(res).toBe("Disconnected");
    });
  });

  it("should `find` zero elements", () => {
    return adapter.find().then(response => {
      expect(response.length).toBe(0);
    });
  });

  it("should `insert` one entry", () => {
    return adapter.insert(dummyEntries[0]).then(response => {
      expect(response._etag).toBeDefined();
      expect(response._rid).toBeDefined();
      expect(response._self).toBeDefined();
      expect(response._ts).toBeDefined();
      expect(response.id).toBe(dummyEntries[0].id);
      expect(response.test).toBe(dummyEntries[0].test);

      // Check it's there
      return adapter.find().then(response => {
        expect(response.length).toBe(1);
      });
    });
  });

  it("should NOT `insert` repeated entry", () => {
    return adapter.insert(dummyEntries[0]).catch(err => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe(
        "Resource with specified id or name already exists."
      );
    });
  });

  it("should `findById` an entry", () => {
    return adapter.findById(dummyEntries[0].id).then(res => {
      expect(res.id).toBe(dummyEntries[0].id);
      expect(res.test).toBe(dummyEntries[0].test);
    });
  });

  it("should NOT `findById`", () => {
    const id = "wrong-id";
    return adapter.findById(id).catch(err => {
      // console.log(err);
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe(`Resource with ${id} not found`);
    });
  });

  it("should `delete` entry", () => {
    return adapter.removeById(dummyEntries[0].id).then(res => {
      expect(res.id).toBe(dummyEntries[0].id);
      expect(res.test).toBe(dummyEntries[0].test);
    });
  });

  it("should NOT `delete`", () => {
    const id = "wrong-id";
    return adapter.removeById(id).catch(err => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe(`Resource with ${id} not found`);
    });
  });

  it("should `insertMany` 3 entries", () => {
    return adapter.insertMany(dummyEntries).then(response => {
      expect(response.length).toBe(3);
    });
  });

  it("should NOT `insertMany`", () => {
    return adapter.insertMany(dummyEntries).catch(err => {
      expect(err).toBeInstanceOf(Error);
      expect(err.message).toBe(
        "Resource with specified id or name already exists."
      );
    });
  });

  it("should `findByIds` 3 entries", () => {
    const idList = dummyEntries.map(elem => elem.id);

    return adapter.findByIds(idList).then(res => {
      expect(res.length).toBe(3);
    });
  });

  it("should `findOne` by query", () => {
    const q = `SELECT * FROM c WHERE c.test = "two"`;

    return adapter.findOne(q).then(res => {
      expect(res[0].test).toBe("two");
    });
  });

  it("should NOT `findOne` due to BAD query", () => {
    const q = `SELECT * FROM c WHER"`;

    return adapter.findOne(q).catch(err => {
      expect(err).toBeInstanceOf(Error);
    });
  });

  it("should `count` all entries", () => {
    return adapter.count().then(response => {
      expect(response).toBe(3);
    });
  });

  it("should `updateById` an entry", () => {
    const id = dummyEntries[0].id;

    const update = {
      $set: {
        test: "UPDATED TEST"
      }
    };

    return adapter.updateById(id, update).then(res => {
      expect(res.id).toBe(id);
      expect(res.test).toBe(update.$set.test);
    });
  });

  it("should NOT `updateById` an entry", () => {
    const id = "wrong-id";

    const update = {
      $set: {
        test: "UPDATED TEST"
      }
    };

    return adapter.updateById(id, update).catch(err => {
      expect(err).toBeInstanceOf(Error);
      expect(err.code).toBe(404);
    });
  });

  it("should `updateMany` entries", () => {
    const updatedEntries = dummyEntries.map(entry => {
      entry.test = "UPDATE";

      return entry;
    });

    return adapter.updateMany(updatedEntries).then(res => {
      expect(res.length).toBe(3);
      expect(res[0].test).toBe("UPDATE");
      expect(res[1].test).toBe("UPDATE");
      expect(res[2].test).toBe("UPDATE");
    });
  });

  it("should NOT `updateMany` entries", () => {
    const updatedEntries = dummyEntries.map(entry => entry);
    updatedEntries[0].id = "wrong-0";

    return adapter.updateMany(updatedEntries).catch(err => {
      expect(err).toBeInstanceOf(Error);
      expect(err.code).toBe(404);
    });
  });

  it("should `removeById` an entry", () => {
    const id = "1";

    return adapter.removeById(id).then(res => {
      expect(res.id).toBe(id);
      expect(res.test).toBe("UPDATE");
    });
  });

  it("should `removeByIds` two entries", () => {
    const idList = [dummyEntries[1].id, dummyEntries[2].id];

    return adapter.removeMany(idList).then(res => {
      expect(res.length).toBe(2);
      expect(res[0].test).toBe("UPDATE");
      expect(res[1].test).toBe("UPDATE");
    });
  });

  it("should `clear` DB", () => {
    // Insert Again
    return adapter.insertMany(dummyEntries).then(response => {
      // Clear DB
      return adapter.clear().then(res => {
        expect(res.length).toBe(3);
      });
    });
  });

  it("should `entityToObject` DB", () => {
    expect(adapter.entityToObject(dummyEntries[0])).toBe(dummyEntries[0]);
  });

  it("should `transformSort` DB", () => {
    let message = "Method `transformSort` Not Implemented";
    try {
      adapter.transformSort();
    } catch (error) {
      expect(error.message).toBe(message);
    }
  });

  it("should `beforeSaveTransformID` DB", () => {
    expect(adapter.beforeSaveTransformID(dummyEntries[0])).toBe(
      dummyEntries[0]
    );
  });

  it("should `afterRetrieveTransformID` DB", () => {
    expect(adapter.afterRetrieveTransformID(dummyEntries[0])).toBe(
      dummyEntries[0]
    );
  });
});
