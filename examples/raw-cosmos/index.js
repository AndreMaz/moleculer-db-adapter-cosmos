// JavaScript
const { CosmosClient } = require("@azure/cosmos");
const https = require("https");
const { default: cosmosServer } = require("@zeit/cosmosdb-server");

// Start mock CosmosDB server
cosmosServer().listen(3000, () => {
  console.log(`Cosmos DB server running at https://localhost:3000`);

  // Call the client
  helloCosmos();
});
const databaseDefinition = { id: "sample database" };
const collectionDefinition = { id: "sample collection" };
const documentDefinition = { id: "hello world doc", content: "Hello World!" };

async function helloCosmos() {
  try {
    // Create client
    const client = new CosmosClient({
      endpoint: `https://localhost:3000`,
      key: "dummy key",
      // disable SSL verification
      // since the server uses self-signed certificate
      agent: https.Agent({ rejectUnauthorized: false })
    });

    // Create DB
    const { database } = await client.databases.create(databaseDefinition);
    console.log("created database");

    // Create container
    const { container } = await database.containers.create(
      collectionDefinition
    );
    console.log("created collection");

    // Insert a document
    const { resource } = await container.items.create(documentDefinition);
    console.log("Created item with content: ", resource.content);

    // Read from DB
    const { resource: item } = await container
      .item(documentDefinition.id)
      .read();
    console.log("Item from DB: ", item);

    await database.delete();
    console.log("Deleted database");

    console.log("Exiting");
    process.exit(0);
  } catch (error) {
    throw error;
  }
}

/*
helloCosmos().catch(err => {
  console.error(err);
});
*/
