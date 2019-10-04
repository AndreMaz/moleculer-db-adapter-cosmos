/*
 * moleculer-db-adapter-cosmosDB
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer-db)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");
const Promise = require("bluebird");
const { ServiceSchemaError } = require("moleculer").Errors;
const { CosmosClient } = require("@azure/cosmos");

class CosmosDbAdapter {
  /**
   * Creates an instance of CosmosDbAdapter.
   * @param {Object} connection
   * @param {string} dbName
   * @param {string} containerName
   *
   * @memberof CosmosDbAdapter
   */
  constructor(connection, dbName, containerName) {
    this.connection = connection;
    this.dbName = dbName;
    this.containerName = containerName;
  }

  /**
   * Initialize adapter
   *
   * @param {ServiceBroker} broker
   * @param {Service} service
   *
   * @memberof CosmosDbAdapter
   */
  init(broker, service) {
    this.broker = broker;
    this.service = service;

    if (!this.dbName) {
      /* istanbul ignore next */
      throw new ServiceSchemaError(
        "Missing `database` definition in DB adapter!"
      );
    }

    if (!this.containerName) {
      /* istanbul ignore next */
      throw new ServiceSchemaError(
        "Missing `container` definition in DB adapter!"
      );
    }
  }

  /**
   * Connect to database
   *
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  async connect() {
    try {
      this.client = new CosmosClient(this.connection);

      const dbResponse = await this.client.databases.createIfNotExists({
        id: this.dbName
      });
      this.database = dbResponse.database;

      const containerResponse = await this.database.containers.createIfNotExists(
        { id: this.containerName }
      );
      this.container = containerResponse.container;

      return Promise.resolve();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Disconnect from database
   *
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  disconnect() {
    // We are making REST requests so just resolve
    return Promise.resolve("Disconnected");
  }

  /**
   * Find all entities by filters.
   *
   *  - query
   *
   * @param {any} filters
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  find(filters) {
    // throw new Error("Method Not Implemented");
    return this.createCursor(filters);
  }

  /**
   * Find an entity by query
   *
   * @param {Object} query
   * @returns {Promise}
   *
   * @memberof MemoryDbAdapter
   */
  async findOne(query) {
    // throw new Error("Method `findOne` Not Implemented");
    try {
      const response = await this.container.items.query(query).fetchAll();

      return response.resources;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find an entities by ID
   *
   * @param {any} _id
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  async findById(_id) {
    // throw new Error("Method `findById` Not Implemented");
    try {
      const readResponse = await this.container.item(_id).read();

      if (readResponse.statusCode >= 400) {
        throw new Error(`Resource with id "${_id}" not found`);
      }

      return readResponse.resource;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Find any entities by IDs
   *
   * @param {Array} idList
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  async findByIds(idList) {
    // throw new Error("Method `findByIds` Not Implemented");
    const ids = idList.map(elem => `"${elem}"`).join(",");

    const q = {
      query: `SELECT * FROM c WHERE c.id IN (${ids})`,
      parameters: []
    };

    const response = await this.container.items.query(q).fetchAll();
    return response.resources;
  }

  /**
   * Get count of filtered entities
   *
   * Available filter props:
   *  - query
   *
   * @param {Object} [filters={}]
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  count(filters = {}) {
    // throw new Error("Method `count` Not Implemented");
    return this.createCursor(filters, true);
  }

  /**
   * Insert an entity
   *
   * @param {Object} entity
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  async insert(entity) {
    try {
      const response = await this.container.items.create(entity);
      return response.resource;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Insert many entities
   *
   * @param {Array} entities
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  insertMany(entities) {
    // At this moment there is no Bulk Executor Lib for Node
    // More info: https://docs.microsoft.com/en-us/azure/cosmos-db/bulk-executor-overview

    // ToDo: Check CosmosDB DB engine stored procedures
    // More info: https://docs.microsoft.com/en-us/azure/cosmos-db/stored-procedures-triggers-udfs
    this.broker.logger.warn(
      "insertMany() method is not Request Units (RUs) friendly. Use it at your own risk. Consider using CosmosDB DB stored procedures"
    );

    const p = entities.map(entity => this.insert(entity));

    try {
      const response = Promise.all(p);
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update an entity by ID and `update`
   *
   * @param {any} _id
   * @param {Object} update
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  async updateById(_id, update) {
    // throw new Error("Method `updateById` Not Implemented");
    try {
      const newItem = { id: _id, ...update["$set"] };

      const response = await this.container.item(_id).replace(newItem);

      return response.resource;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update many entities
   *
   * @param {Array} update array of entities
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  updateMany(entries) {
    // At this moment there is no Bulk Executor Lib for Node
    // More info: https://docs.microsoft.com/en-us/azure/cosmos-db/bulk-executor-overview

    // ToDo: Check CosmosDB DB stored procedures
    // More info: https://docs.microsoft.com/en-us/azure/cosmos-db/stored-procedures-triggers-udfs
    this.broker.logger.warn(
      "updateMany() method operator is not Request Units (RUs) friendly. Use it at your own risk. Consider using CosmosDB DB stored procedures"
    );
    try {
      const p = entries.map(entry =>
        this.container.item(entry.id).replace(entry)
      );

      const response = Promise.all(p);
      return response.map(entry => entry.resource);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove an entity by ID
   *
   * @param {any} _id
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  async removeById(_id) {
    try {
      const readResponse = await this.container.item(_id).read();

      if (readResponse.statusCode >= 400) {
        throw new Error(`Resource with id "${_id}" not found`);
      }

      const delResponse = await this.container.item(_id).delete();
      if (delResponse.statusCode >= 400) {
        throw new Error(`Resource with id "${_id}" not found`);
      }

      return readResponse.resource;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Remove many entities by their ID
   *
   * @param {Array<string>} idList
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  removeMany(idList) {
    // At this moment there is no Bulk Executor Lib for Node
    // More info: https://docs.microsoft.com/en-us/azure/cosmos-db/bulk-executor-overview

    // ToDo: Check CosmosDB DB engine stored procedures
    // More info: https://docs.microsoft.com/en-us/azure/cosmos-db/stored-procedures-triggers-udfs
    this.broker.logger.warn(
      "removeMany() method is not Request Units (RUs) friendly. Use it at your own risk. Consider using CosmosDB DB stored procedures"
    );

    try {
      const p = idList.map(id => this.removeById(id));
      return Promise.all(p);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Clear all entities from container
   *
   * @returns {Promise}
   *
   * @memberof CosmosDbAdapter
   */
  async clear() {
    // At this moment there is no Bulk Executor Lib for Node
    // More info: https://docs.microsoft.com/en-us/azure/cosmos-db/bulk-executor-overview

    // ToDo: Check CosmosDB DB engine stored procedures
    // More info: https://docs.microsoft.com/en-us/azure/cosmos-db/stored-procedures-triggers-udfs
    this.broker.logger.warn(
      "clear() method is not Request Units (RUs) friendly. Use it at your own risk. Consider using CosmosDB DB stored procedures"
    );

    try {
      const allEntries = await this.find();

      const result = await this.removeMany(allEntries.map(entry => entry.id));

      return result;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert DB entity to JSON object
   *
   * @param {any} entity
   * @returns {Object}
   * @memberof CosmosDbAdapter
   */
  entityToObject(entity) {
    return entity;
  }

  /**
   * Create a filtered query
   * Available filters in `params`:
   *  - query
   *
   * @param {Object} params
   * @param {Boolean} isCounting
   * @returns {Promise}
   */
  async createCursor(params = {}, isCounting) {
    const q = {
      query: params.query || "SELECT * from c", // By default get everything
      parameters: []
    };

    if (isCounting) {
      q.query = "SELECT VALUE COUNT(1) FROM c"; // Count all entries
    }

    const response = await this.container.items.query(q).fetchAll();

    // Response is an array with the count number
    if (isCounting) return response.resources[0];

    return response.resources;
  }

  /**
   * Convert the `sort` param to a `sort` object to Sequelize queries.
   *
   * @param {String|Array<String>|Object} paramSort
   * @returns {Object} Return with a sort object like `[["votes", "ASC"], ["title", "DESC"]]`
   * @memberof CosmosDbAdapter
   */
  transformSort(paramSort) {
    throw new Error("Method `transformSort` Not Implemented");
  }

  /**
   * For compatibility only.
   * @param {Object} entity
   * @param {String} idField
   * @memberof CosmosDbAdapter
   * @returns {Object} Entity
   */
  beforeSaveTransformID(entity, idField) {
    return entity;
  }

  /**
   * For compatibility only.
   * @param {Object} entity
   * @param {String} idField
   * @memberof CosmosDbAdapter
   * @returns {Object} Entity
   */
  afterRetrieveTransformID(entity, idField) {
    return entity;
  }
}

module.exports = CosmosDbAdapter;
