import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { pool } from './db/pool.js';
import { authRouter } from './routes/auth.js';
import { workspaceRouter } from './routes/workspace.js';
import { superAdminRouter } from './routes/superAdmin.js';
import { paymentRouter } from './routes/payments.js';

const app=express();
const port=Number(process.env.API_PORT||4180);
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32)throw new Error('JWT_SECRET must be set to at least 32 characters');
app.disable('x-powered-by');
app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
app.use(express.json({limit:'100kb'}));
app.get('/api/health',async(_req,res)=>{try{await pool.query('SELECT 1');res.json({ok:true,database:'postgresql'})}catch{res.status(503).json({ok:false,database:'unavailable'})}});
app.use('/api/auth',rateLimit({windowMs:60_000,limit:30,standardHeaders:true,legacyHeaders:false}),authRouter);
app.use('/api',workspaceRouter);
app.use('/api/super-admin',superAdminRouter);
app.use('/api/payments',paymentRouter);
const frontendDist=fileURLToPath(new URL('../../dist/',import.meta.url));
if(existsSync(frontendDist)){
  app.use(express.static(frontendDist));
  app.use((req,res,next)=>req.path.startsWith('/api/')?next():res.sendFile(fileURLToPath(new URL('../../dist/index.html',import.meta.url))));
}
app.use((req,res)=>res.status(404).json({error:'API route not found'}));
app.use((error,_req,res,_next)=>{console.error(error);res.status(error.status||500).json({error:error.status?error.message:'Internal server error'})});

if(process.env.RUN_MIGRATIONS==='true'){
  const schemaPath=fileURLToPath(new URL('../../database/schema.sql',import.meta.url));
  await pool.query(await readFile(schemaPath,'utf8'));
}
app.listen(port,'127.0.0.1',()=>console.log(`Neighborly API listening at http://127.0.0.1:${port}`));
process.on('SIGTERM',async()=>{await pool.end();process.exit(0)});
