const { sequelize } = require("./sequelize");
const { Sequelize, DataTypes } = require("sequelize");
const Comment = sequelize.define(
  "comment",
  {
    title: DataTypes.STRING,
    commentableId: DataTypes.INTEGER,
    commentableType: DataTypes.STRING,
  },
  { underscored: true, tableName: "comment" }
);
const Image = sequelize.define(
  "image",
  {
    title: DataTypes.STRING,
    url: DataTypes.STRING,
  },
  { underscored: true,tableName: "image" }
);
const Video = sequelize.define(
  "video",
  {
    title: DataTypes.STRING,
    text: DataTypes.STRING,
  },
  { underscored: true, tableName: "video" }
);
Image.hasMany(Comment);
Comment.belongsTo(Image);
Video.hasMany(Comment);
Comment.belongsTo(Video);
(async () => {
  await sequelize.sync({ force: true });
  await Image.create({ url: "https://placekitten.com/408/287" })
}
)();