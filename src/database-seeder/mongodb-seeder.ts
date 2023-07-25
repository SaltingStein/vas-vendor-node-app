import fs from "fs";
import path from "path";

import { MongoConnection } from "../connections/mongo";

export class MongodbSeeder {
	private dbConnection: MongoConnection;
	private baseDir: string;

	constructor(dbConnection: MongoConnection) {
		this.dbConnection = dbConnection;
		this.baseDir = path.join(__dirname, "/../../.data/");
	}

	public async seedDatabase(file: string, collectionName: string, dirName: string) {
		try {
			const documentToInsert = await this.readFile(file, dirName);
			await this.insertDocumentsIntoCollection(documentToInsert, collectionName);
		} catch (err) {
			throw err;
		} finally {
			console.log("collection is successfully seeded...");
		}
	}

	private async insertDocumentsIntoCollection(documentsToInsert: any[], collectionName: string) {
		try {
			const db = await this.dbConnection.createConnection();
			// @ts-ignore
			return db.collection(collectionName).insertMany(documentsToInsert);
		} catch (err) {
			return Promise.reject(err);
		}
	}

	private readFile(fileName: string, dirName: string): Promise<any[]> {
		return new Promise((resolve, reject) => {
			fs.readFile(`${this.baseDir}${dirName}/${fileName}.json`, "utf8", (err, stringifiedData) => {
				if (!err && stringifiedData) {
					resolve(JSON.parse(stringifiedData));
				}
				reject(new Error("Could not read from file"));
			});
		});
	}
}
