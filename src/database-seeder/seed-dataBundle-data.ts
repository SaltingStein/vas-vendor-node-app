import MongodbConnection from "../connections/mongo";

import { MongodbSeeder } from "./mongodb-seeder";

const mongodbSeeder = new MongodbSeeder(MongodbConnection);

mongodbSeeder.seedDatabase("airtelBundle", "dataBundles", "databundleDump");
mongodbSeeder.seedDatabase("etisalatBundle", "dataBundles", "databundleDump");
mongodbSeeder.seedDatabase("gloBundle", "dataBundles", "databundleDump");
mongodbSeeder.seedDatabase("mtnBundle", "dataBundles", "databundleDump");
mongodbSeeder.seedDatabase("dataBundleProviders", "dataBundleProviders", "databundleDump");
