import MongodbConnection from "../connections/mongo";

import { MongodbSeeder } from "./mongodb-seeder";

const mongodbSeeder = new MongodbSeeder(MongodbConnection);

// mongodbSeeder.seedDatabase("electricityProvider", "electricityProviders", "electricityDump");
mongodbSeeder.seedDatabase("electricityMeterNumbers", "meterNumbers", "electricityDump");
