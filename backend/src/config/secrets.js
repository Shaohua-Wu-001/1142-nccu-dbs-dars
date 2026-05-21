const TEST_SECRETS = {
  JWT_SECRET: "nccu-ams-dev-secret",
  ADMIN_SECRET: "nccu-admin-2024"
};

function readRequiredSecret(name) {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "test") return TEST_SECRETS[name];
  throw new Error(`${name} is required. Set it in the environment or .env file.`);
}

module.exports = {
  JWT_SECRET: readRequiredSecret("JWT_SECRET"),
  ADMIN_SECRET: readRequiredSecret("ADMIN_SECRET")
};
