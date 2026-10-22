import 'dotenv/config';
import { pool } from './pool.js';

if (process.env.NODE_ENV === 'production') {
  throw new Error('Demo records cannot be seeded in production.');
}

const demoUsers = [
  { role: 'super_admin', mobile: '+12125550101', name: 'Demo Super Admin' },
  { role: 'admin', mobile: '+12125550102', name: 'Demo Company Admin' },
  { role: 'client', mobile: '+12125550103', name: 'Ananya Rao', businessName: 'Demo Greenway Auto Works', description: 'Local two-wheeler sales and service.' , latitude: 12.9716, longitude: 77.5946 },
  { role: 'client', mobile: '+12125550104', name: 'Rohan Mehta', businessName: 'Demo Maya Home Kitchen', description: 'Fresh neighborhood meals and catering.', latitude: 12.975, longitude: 77.601 },
  { role: 'agent', mobile: '+12125550105', name: 'Demo Neighborhood Agent' },
  { role: 'end_user', mobile: '+12125550106', name: 'Demo Customer Asha' },
  { role: 'end_user', mobile: '+12125550107', name: 'Demo Customer Vivek' },
];

async function upsertUser(db, { role, mobile, name }) {
  const { rows } = await db.query(
    `INSERT INTO users(role,mobile,name,status)
     VALUES($1,$2,$3,'active')
     ON CONFLICT(mobile) DO UPDATE SET name=EXCLUDED.name,status='active',updated_at=now()
       WHERE users.role=EXCLUDED.role
     RETURNING id,role,mobile,name,status`,
    [role, mobile, name],
  );
  if (!rows[0]) throw new Error(`Demo mobile ${mobile} already belongs to a different account role.`);
  return rows[0];
}

const db = await pool.connect();
try {
  await db.query('BEGIN');
  const users = new Map();
  for (const demoUser of demoUsers) users.set(demoUser.role + demoUser.mobile, await upsertUser(db, demoUser));

  const superAdmin = users.get('super_admin+12125550101');
  const companyAdmin = users.get('admin+12125550102');
  await db.query(`INSERT INTO admins(user_id,created_by,permissions)
    VALUES($1,NULL,'["*"]'::jsonb)
    ON CONFLICT(user_id) DO UPDATE SET permissions='["*"]'::jsonb`, [superAdmin.id]);
  await db.query(`INSERT INTO admins(user_id,created_by,permissions)
    VALUES($1,$2,'["users:read","clients:read","orders:read"]'::jsonb)
    ON CONFLICT(user_id) DO UPDATE SET created_by=EXCLUDED.created_by,permissions=EXCLUDED.permissions`, [companyAdmin.id, superAdmin.id]);

  const agent = users.get('agent+12125550105');
  await db.query('INSERT INTO agents(user_id,created_by) VALUES($1,$2) ON CONFLICT(user_id) DO NOTHING', [agent.id, superAdmin.id]);

  for (const demoUser of demoUsers.filter((item) => item.role === 'client')) {
    const user = users.get(demoUser.role + demoUser.mobile);
    await db.query(`INSERT INTO clients(user_id,business_name,service_description,latitude,longitude,radius_km,is_online,approved_at)
      VALUES($1,$2,$3,$4,$5,5,true,now())
      ON CONFLICT(user_id) DO UPDATE SET business_name=EXCLUDED.business_name,service_description=EXCLUDED.service_description,
        latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,radius_km=EXCLUDED.radius_km,is_online=true,approved_at=COALESCE(clients.approved_at,now())`,
    [user.id, demoUser.businessName, demoUser.description, demoUser.latitude, demoUser.longitude]);
  }

  await db.query('COMMIT');
  console.log('Demo records ready: 2 businesses, 2 customers, 1 agent, 1 company Admin and 1 Super Admin.');
  console.log('Demo mobiles use reserved fictional +1 212-555-01xx numbers. In development, OTPs are shown in the login flow or API log.');
} catch (error) {
  await db.query('ROLLBACK').catch(() => {});
  throw error;
} finally {
  db.release();
  await pool.end();
}
