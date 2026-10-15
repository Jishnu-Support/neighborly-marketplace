import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Sign in required' });
    const claims = jwt.verify(token, process.env.JWT_SECRET);
    const { rows } = await pool.query(
      `SELECT u.id, u.role, u.mobile, u.name, u.status, s.id AS session_id
       FROM auth_sessions s JOIN users u ON u.id=s.user_id
       WHERE s.token_id=$1 AND s.user_id=$2 AND s.revoked_at IS NULL AND s.expires_at > now()`,
      [claims.jti, claims.sub],
    );
    if (!rows[0] || rows[0].status !== 'active') return res.status(401).json({ error: 'Session expired or account unavailable' });
    req.user = rows[0]; req.authTokenId = claims.jti;
    next();
  } catch (error) { res.status(401).json({ error: error.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid session' }); }
}

export function allowRoles(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'This account cannot access this area' });
}

export const isAdmin = allowRoles('super_admin', 'admin');
