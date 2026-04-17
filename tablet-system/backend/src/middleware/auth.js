/**
 * Driver auth middleware.
 * Driver-facing endpoints (update ETA, complete ride, trigger prompt) require
 * the DRIVER_TOKEN set in .env. Pass it as: Authorization: Bearer <token>
 */
function requireDriver(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = header.slice(7);
  if (token !== process.env.DRIVER_TOKEN) {
    return res.status(403).json({ error: 'Invalid driver token' });
  }
  next();
}

module.exports = { requireDriver };
