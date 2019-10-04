// JavaScript
const { CosmosClient } = require("@azure/cosmos");

const connectOpt = require("../../../../../connectOpt");
const client = new CosmosClient(connectOpt);

const databaseDefinition = { id: "sample database" };
const collectionDefinition = { id: "sample collection" };
const documentDefinition = { id: "hello world doc", content: "Hello World!" };

async function helloCosmos() {
  const { database } = await client.databases.create(databaseDefinition);
  console.log("created database");

  const { container } = await database.containers.create(collectionDefinition);
  console.log("created collection");

  const { resource } = await container.items.create(documentDefinition);
  console.log("Created item with content: ", resource.content);

  await database.delete();
  console.log("Deleted database");
}

helloCosmos().catch(err => {
  console.error(err);
});
