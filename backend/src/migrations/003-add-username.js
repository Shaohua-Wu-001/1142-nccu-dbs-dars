module.exports = {
  async up({ queryInterface, DataTypes, transaction }) {
    const tableDesc = await queryInterface.describeTable("users");
    if (!tableDesc.username) {
      await queryInterface.addColumn("users", "username", {
        type: DataTypes.STRING(50),
        allowNull: true
      }, { transaction });

      await queryInterface.addIndex("users", ["username"], {
        name: "uniq_users_username",
        unique: true
      });
    }
  }
};
