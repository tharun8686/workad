import { auth } from '@/server/auth';
import type { NextRequest } from 'next/server';
export const runtime='nodejs';
async function handle(req:NextRequest){if(!process.env.DATABASE_URL||!process.env.BETTER_AUTH_SECRET)return Response.json({message:'Connect your database and configure authentication first.'},{status:503});return auth().handler(req);}
export const GET=handle;export const POST=handle;
