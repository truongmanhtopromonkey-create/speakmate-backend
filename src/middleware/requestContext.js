export function requestContext(req, _res, next) {
  req.userId = req.header('x-user-id') || `anon_${req.ip || 'unknown'}`;
  req.isPremium = String(req.header('x-premium-user') || '').toLowerCase() === 'true';
  next();
}
