import MongodbConnection from "../connections/mongo";

import { MongodbSeeder } from "./mongodb-seeder";

const mongodbSeeder = new MongodbSeeder(MongodbConnection);

mongodbSeeder.seedDatabase("airtimeProviders", "airtimeProviders", "airtimeDump");
