const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth.routes");
const coursesRoutes = require("./routes/courses.routes");
const curriculumsRoutes = require("./routes/curriculums.routes");
const transcriptsRoutes = require("./routes/transcripts.routes");
const studentCoursesRoutes = require("./routes/studentCourses.routes");
const auditRoutes = require("./routes/audit.routes");
const adminRoutes = require("./routes/admin.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/curriculums", curriculumsRoutes);
app.use("/api/transcripts", transcriptsRoutes);
app.use("/api/student-courses", studentCoursesRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/admin", adminRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Not Found", path: req.path });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.name === "SequelizeValidationError" || err.name === "SequelizeUniqueConstraintError"
    ? 400
    : err.status || 500;
  res.status(status).json({
    error: err.message || "Internal Server Error"
  });
});

module.exports = app;
