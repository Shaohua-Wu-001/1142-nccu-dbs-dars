module.exports = {
  async up({ queryInterface, DataTypes, transaction }) {
    const tableDesc = await queryInterface.describeTable("users");

    if (!tableDesc.password_hash) {
      await queryInterface.addColumn("users", "password_hash", {
        type: DataTypes.STRING(60),
        allowNull: true
      }, { transaction });
    }

    if (!tableDesc.role) {
      await queryInterface.addColumn("users", "role", {
        type: DataTypes.ENUM("student", "admin"),
        allowNull: false,
        defaultValue: "student"
      }, { transaction });
    }
  }
};
