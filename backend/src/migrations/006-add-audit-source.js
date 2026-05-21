module.exports = {
  async up({ queryInterface, DataTypes, transaction }) {
    const tableDesc = await queryInterface.describeTable("audit_results");

    if (!tableDesc.audit_source) {
      await queryInterface.addColumn("audit_results", "audit_source", {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "ADMIN"
      }, { transaction });
    }
  }
};
