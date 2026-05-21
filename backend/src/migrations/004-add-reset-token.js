module.exports = {
  async up({ queryInterface, DataTypes, transaction }) {
    const tableDesc = await queryInterface.describeTable("users");

    if (!tableDesc.reset_token) {
      await queryInterface.addColumn("users", "reset_token", {
        type: DataTypes.STRING(64),
        allowNull: true,
        defaultValue: null,
      }, { transaction });
    }

    if (!tableDesc.reset_expires) {
      await queryInterface.addColumn("users", "reset_expires", {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      }, { transaction });
    }

    if (tableDesc.student_number && !tableDesc.student_number.allowNull) {
      await queryInterface.changeColumn("users", "student_number", {
        type: DataTypes.STRING(20),
        allowNull: true,
      }, { transaction });
    }

    if (tableDesc.admission_year && !tableDesc.admission_year.allowNull) {
      await queryInterface.changeColumn("users", "admission_year", {
        type: DataTypes.INTEGER,
        allowNull: true,
      }, { transaction });
    }
  },
};
