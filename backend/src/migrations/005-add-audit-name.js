module.exports = {
  async up({ queryInterface, DataTypes, transaction }) {
    const tableDesc = await queryInterface.describeTable("audit_results");

    if (!tableDesc.audit_name) {
      await queryInterface.addColumn("audit_results", "audit_name", {
        type: DataTypes.STRING(120),
        allowNull: true,
        defaultValue: null
      }, { transaction });
    }
  }
};
