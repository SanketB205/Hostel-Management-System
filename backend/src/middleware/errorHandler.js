export function notFound(req, res) {
  return res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} was not found.` });
}

export function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  console.error(error);
  if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Session is invalid or expired.' });
  }
  if (error.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'A record with this value already exists.' });
  }
  return res.status(error.status || 500).json({ message: error.message || 'Internal server error.' });
}
