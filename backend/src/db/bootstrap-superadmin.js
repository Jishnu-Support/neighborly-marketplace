import 'dotenv/config';
import { pool } from './pool.js';

const mobile=String(process.env.BOOTSTRAP_SUPER_ADMIN_MOBILE||'');
const name=String(process.env.BOOTSTRAP_SUPER_ADMIN_NAME||'Super Admin');
if(!/^\+[1-9]\d{7,14}$/.test(mobile)){console.error('Set BOOTSTRAP_SUPER_ADMIN_MOBILE in .env in international format (+countrycode...)');process.exitCode=1}
else {
  const db=await pool.connect();
  try {await db.query('BEGIN');const {rows}=await db.query(`INSERT INTO users(role,mobile,name,status) VALUES('super_admin',$1,$2,'active') ON CONFLICT(mobile) DO UPDATE SET role='super_admin',name=excluded.name,status='active' RETURNING id`,[mobile,name]);await db.query(`INSERT INTO admins(user_id,permissions) VALUES($1,'["*"]'::jsonb) ON CONFLICT(user_id) DO UPDATE SET permissions='["*"]'::jsonb`,[rows[0].id]);await db.query('COMMIT');console.log(`Super Admin ready for OTP login: ${mobile}`)}catch(error){await db.query('ROLLBACK');throw error}finally{db.release();await pool.end()}
}
