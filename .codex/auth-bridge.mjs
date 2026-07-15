import http from 'node:http';
import { SignJWT } from 'jose';
const token=await new SignJWT({id:1,username:'admin',role:'admin'}).setProtectedHeader({alg:'HS256'}).setExpirationTime('30m').sign(new TextEncoder().encode('nuxt-interaction-jwt-secret-key-2025'));
const server=http.createServer((req,res)=>{res.statusCode=302;res.setHeader('Set-Cookie',`auth_token=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800`);res.setHeader('Location','http://127.0.0.1:3000/');res.end();setTimeout(()=>server.close(),100)});server.listen(3011,'127.0.0.1');
