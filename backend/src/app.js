const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/auth', require('./routes/auth.routes'));
app.use('/users', require('./routes/users.routes'));
app.use('/employees', require('./routes/employees.routes'));
app.use('/attendance', require('./routes/attendance.routes'));
// Leave routes cover /leave-types, /leave-balances and /leave-requests, which
// don't share one prefix, so the router is mounted at root instead of nested.
app.use('/', require('./routes/leave.routes'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Central error handler - anything thrown/rejected in a route wrapped with
// asyncHandler ends up here instead of crashing the process.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
