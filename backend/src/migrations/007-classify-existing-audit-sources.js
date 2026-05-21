module.exports = {
  async up({ queryInterface, transaction }) {
    await queryInterface.sequelize.query(`
      UPDATE audit_results ar
      JOIN users u ON u.id = ar.user_id AND u.role = 'student'
      LEFT JOIN (
        SELECT user_id, MIN(created_at) AS first_manual_at
        FROM student_courses
        WHERE source = 'MANUAL'
        GROUP BY user_id
      ) m ON m.user_id = ar.user_id
      SET ar.audit_source = 'STUDENT'
      WHERE ar.audit_source = 'ADMIN'
        AND (m.first_manual_at IS NULL OR ar.created_at < m.first_manual_at)
    `, { transaction });
  }
};
