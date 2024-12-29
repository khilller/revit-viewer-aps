import { APSConfig } from '@/types/app';
import dotenv from 'dotenv';

dotenv.config();

export const apsConfig: APSConfig = {
  clientId: process.env.APS_CLIENT_ID!,
  clientSecret: process.env.APS_CLIENT_SECRET!,
  bucket: process.env.APS_BUCKET || `${process.env.APS_CLIENT_ID!.toLowerCase()}-basic-app`
};
