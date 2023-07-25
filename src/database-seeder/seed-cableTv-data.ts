import MongodbConnection from "../connections/mongo";

import { MongodbSeeder } from "./mongodb-seeder";

const mongodbSeeder = new MongodbSeeder(MongodbConnection);

// mongodbSeeder.seedDatabase("dstvBouquets", "cabletvBouquets", "cabletvDump");
// mongodbSeeder.seedDatabase("gotvBouquets", "cabletvBouquets", "cabletvDump");
// mongodbSeeder.seedDatabase("startimesBouquets", "cabletvBouquets", "cabletvDump");
mongodbSeeder.seedDatabase("cableTvProviders", "cabletvProviders", "cabletvDump");
