import { Table, Model, Column, DataType } from "sequelize-typescript";

@Table({
	timestamps: false,
	tableName: "wp_usermeta",
})
export class WP_USERMETA extends Model {
	@Column({
		type: DataType.NUMBER,
		allowNull: false,
	})
	umeta_id!: number;

	@Column({
		type: DataType.NUMBER,
		allowNull: false,
	})
	user_id!: number;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	meta_key!: string;

	@Column({
		type: DataType.STRING,
		allowNull: false,
	})
	meta_value!: string;
}
