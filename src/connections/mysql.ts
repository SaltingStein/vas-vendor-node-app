import { MySQL } from "@config";
import { Sequelize } from "sequelize-typescript";
// import { BaseConnection } from "./base";
import { WP_USERMETA } from "@models/sql/wallet";

interface SequelizeOptions {
	logging?: boolean;
	models?: any[];
}

class MySQLConnection {
	public ActiveConnection!: Promise<Sequelize>;
	public options?: SequelizeOptions;
	constructor(options?: SequelizeOptions) {
		this.options = options;
		this.ActiveConnection = this.createConnection();
	}
	public async createConnection() {
		const connection = new Sequelize(`mysql://${MySQL.username}:${MySQL.password}@${MySQL.host}:${MySQL.port}/${MySQL.database}`, {
			models: [WP_USERMETA],
		});

		await connection.sync();
		return connection;
	}

	public set connectionOptions(v: SequelizeOptions) {
		this.options = v;
	}
}

export default new MySQLConnection();
