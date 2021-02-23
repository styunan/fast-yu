const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://adminweb:adminweb@localhost:5432/mstbotdb_stg');
exports.sequelize = sequelize;