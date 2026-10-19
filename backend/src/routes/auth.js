import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { sendOtpSms } from '../services/sms.js';
import { authenticate } from '../middleware/auth.js';

export const authRouter = Router();
const roles = new Set(['admin', 'super_admin', 'client', 'end_user', 'agent']);
const otpPepper = () => process.env.OTP_PEPPER || process.env.JWT_SECRET;
const digest = (value) => crypto.createHmac('sha256', otpPepper()).update(value).digest('hex');
const normalizeMobile = (value) => String(value || '').replace(/[\s()-]/g, '');

authRouter.post('/otp/request', async (req, res, next) => {
  const mobile = normalizeMobile(req.body.mobile);
  const requestedRole = String(req.body.role || 'end_user');
  if (!/^\+[1-9]\d{7,14}$/.test(mobile)) return res.status(400).json({ error: 'Enter a valid mobile number in international format, such as +919876543210' });
  if (!roles.has(requestedRole)) return res.status(400).json({ error: 'Choose a valid portal' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [mobile]);
    const user = await client.query('SELECT role,status FROM users WHERE mobile=$1 FOR UPDATE', [mobile]);
    if (user.rows[0] && user.rows[0].role !== requestedRole && !(requestedRole === 'admin' && ['admin','super_admin'].includes(user.rows[0].role))) { await client.query('ROLLBACK'); return res.status(409).json({ error: `This number is registered as ${user.rows[0].role.replace('_', ' ')}. Select that portal to sign in.` }); }
    if (user.rows[0]?.status === 'blocked' || user.rows[0]?.status === 'deleted') { await client.query('ROLLBACK'); return res.status(403).json({ error: 'This account is unavailable. Contact platform support.' }); }
    if (['admin','super_admin'].includes(requestedRole) && !user.rows[0]) { await client.query('ROLLBACK'); return res.status(403).json({ error: 'Admin accounts must be created by a Super Admin.' }); }
    const previous = await client.query('SELECT next_resend_at FROM otp_logs WHERE mobile=$1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE', [mobile]);
    if (previous.rows[0] && new Date(previous.rows[0].next_resend_at) > new Date()) { await client.query('ROLLBACK'); return res.status(429).json({ error: 'Please wait before requesting another code', retryAfterSeconds: Math.ceil((new Date(previous.rows[0].next_resend_at) - Date.now()) / 1000) }); }
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const storedRole = user.rows[0]?.role || requestedRole;
    await client.query(`INSERT INTO otp_logs(mobile,code_hash,requested_role,expires_at,next_resend_at) VALUES($1,$2,$3,now()+interval '5 minutes',now()+interval '30 seconds')`, [mobile, digest(code), storedRole]);
    await client.query('COMMIT');
    const provider = await sendOtpSms(mobile, code);
    res.json({ ok: true, expiresInSeconds: 300, resendAfterSeconds: 30, provider, ...(process.env.NODE_ENV !== 'production' && provider === 'development' ? { demoOtp: code } : {}) });
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); next(error); }
  finally { client.release(); }
});

authRouter.post('/otp/verify', async (req, res, next) => {
  const mobile = normalizeMobile(req.body.mobile), code = String(req.body.otp || ''), client = await pool.connect();
  if (!/^\+[1-9]\d{7,14}$/.test(mobile) || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'Enter your mobile number and six-digit code' });
  try {
    await client.query('BEGIN');
    const found = await client.query(`SELECT * FROM otp_logs WHERE mobile=$1 AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [mobile]);
    const otp = found.rows[0];
    if (!otp || new Date(otp.expires_at) <= new Date()) { await client.query('ROLLBACK'); return res.status(401).json({ error: 'The code expired. Request a new one.' }); }
    if (otp.attempts >= 3) { await client.query('ROLLBACK'); return res.status(429).json({ error: 'Too many incorrect codes. Request a new one.' }); }
    if (!crypto.timingSafeEqual(Buffer.from(otp.code_hash, 'hex'), Buffer.from(digest(code), 'hex'))) {
      await client.query('UPDATE otp_logs SET attempts=attempts+1 WHERE id=$1', [otp.id]); await client.query('COMMIT');
      return res.status(401).json({ error: `Incorrect code. ${2 - otp.attempts} attempt(s) remaining.` });
    }
    await client.query('UPDATE otp_logs SET consumed_at=now() WHERE id=$1', [otp.id]);
    let result = await client.query('SELECT id,role,mobile,name,status FROM users WHERE mobile=$1 FOR UPDATE', [mobile]);
    let user = result.rows[0];
    if (user && user.role !== otp.requested_role) { await client.query('ROLLBACK'); return res.status(409).json({ error: 'Select the portal registered to this mobile number.' }); }
    if (!user) {
      const status = 'active';
      result = await client.query('INSERT INTO users(role,mobile,name,status) VALUES($1,$2,$3,$4) RETURNING id,role,mobile,name,status', [otp.requested_role,mobile,`New ${otp.requested_role.replace('_',' ')}`,status]); user = result.rows[0];
      if (user.role === 'client') await client.query('INSERT INTO clients(user_id) VALUES($1)', [user.id]);
      if (user.role === 'agent') await client.query('INSERT INTO agents(user_id) VALUES($1)', [user.id]);
    }
    if (user.status === 'blocked' || user.status === 'deleted') { await client.query('ROLLBACK'); return res.status(403).json({ error: 'This account is unavailable' }); }
    if (user.role === 'super_admin' || user.role === 'admin') await client.query('UPDATE admins SET last_login_at=now() WHERE user_id=$1', [user.id]);
    const tokenId = crypto.randomUUID();
    const { rows: sessionRows } = await client.query(`INSERT INTO auth_sessions(user_id,token_id,expires_at) VALUES($1,$2,now()+interval '12 hours') RETURNING expires_at`, [user.id,tokenId]);
    await client.query('COMMIT');
    const token = jwt.sign({ sub: user.id, role: user.role, jti: tokenId }, process.env.JWT_SECRET, { expiresIn: '12h', issuer: 'neighborly', audience: 'neighborly-web' });
    res.json({ token, expiresAt: sessionRows[0].expires_at, user });
  } catch (error) { await client.query('ROLLBACK').catch(() => {}); next(error); }
  finally { client.release(); }
});

authRouter.get('/me', authenticate, (req, res) => res.json({ user: req.user }));
authRouter.post('/logout', authenticate, async (req, res, next) => {
  try { await pool.query('UPDATE auth_sessions SET revoked_at=now() WHERE token_id=$1', [req.authTokenId]); res.json({ ok: true }); } catch (error) { next(error); }
});
