import knex from "knex";
// Une caminhos e padroniza para diferentes sistemas operacionais
import path from "path";

const connection = knex({
  client: "sqlite3",
  connection: {
    filename: path.resolve(__dirname, "database.sqlite"),
  },
  useNullAsDefault: true,
});

export default connection;

// Migrations = Histórico do banco de dados

