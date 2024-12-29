// src/lib/aps.ts
import { AuthenticationClient, Scopes } from '@aps_sdk/authentication';
import { OssClient, Region, PolicyKey } from '@aps_sdk/oss';
import { ModelDerivativeClient, View, OutputType } from '@aps_sdk/model-derivative';
import { apsConfig } from './config';

const authClient = new AuthenticationClient();
const ossClient = new OssClient();
const modelDerivativeClient = new ModelDerivativeClient();

async function getInternalToken() {
  const credentials = await authClient.getTwoLeggedToken(
    apsConfig.clientId,
    apsConfig.clientSecret,
    [
      Scopes.DataRead,
      Scopes.DataCreate,
      Scopes.DataWrite,
      Scopes.BucketCreate,
      Scopes.BucketRead
    ]
  );
  return credentials.access_token;
}

export async function getViewerToken() {
  const credentials = await authClient.getTwoLeggedToken(
    apsConfig.clientId,
    apsConfig.clientSecret,
    [Scopes.ViewablesRead]
  );
  return credentials;
}

interface ApiError {
  axiosError?: {
    response?: {
      status: number;
    };
  };
  message: string;
}

export async function ensureBucketExists(bucketKey: string) {
  const token = await getInternalToken();
  try {
    await ossClient.getBucketDetails(bucketKey, { accessToken: token });
  } catch (err: unknown) {
    const error = err as ApiError;
    if (error.axiosError?.response?.status === 404) {
      await ossClient.createBucket(
        Region.Us,
        { bucketKey, policyKey: PolicyKey.Persistent },
        { accessToken: token }
      );
    } else {
      throw error;
    }
  }
}

export async function listObjects() {
  await ensureBucketExists(apsConfig.bucket);
  const token = await getInternalToken();
  let response = await ossClient.getObjects(apsConfig.bucket, { limit: 64, accessToken: token });
  let objects = response.items;

  while (response.next) {
    const startAt = new URL(response.next).searchParams.get('startAt') || undefined;
    response = await ossClient.getObjects(apsConfig.bucket, { limit: 64, startAt, accessToken: token });
    objects = objects.concat(response.items);
  }
  
  return objects;
}

export async function uploadObject(objectName: string, fileBuffer: Buffer) {
  await ensureBucketExists(apsConfig.bucket);
  const token = await getInternalToken();
  return await ossClient.uploadObject(apsConfig.bucket, objectName, fileBuffer, { accessToken: token });
}

export async function translateObject(urn: string, rootFilename?: string) {
  const token = await getInternalToken();
  const job = await modelDerivativeClient.startJob({
    input: {
      urn,
      compressedUrn: !!rootFilename,
      rootFilename
    },
    output: {
      formats: [{
        views: [View._2d, View._3d],
        type: OutputType.Svf2
      }]
    }
  }, { accessToken: token });
  return job.result;
}

export async function getManifest(urn: string) {
  const token = await getInternalToken();
  try {
    return await modelDerivativeClient.getManifest(urn, { accessToken: token });
  } catch (err: unknown) {
    const error = err as ApiError;
    if (error.axiosError?.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

export function urnify(id: string): string {
  return Buffer.from(id).toString('base64').replace(/=/g, '');
}

export async function getTranslationStatus(urn: string) {
  const response = await fetch(
    `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/manifest`,
    {
      headers: {
        'Authorization': `Bearer ${await getInternalToken()}`
      }
    }
  );
  return response.json();
}