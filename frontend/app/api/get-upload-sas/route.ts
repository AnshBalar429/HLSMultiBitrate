import { NextRequest, NextResponse } from "next/server";
import {
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  StorageSharedKeyCredential,
  SASProtocol,
} from "@azure/storage-blob";
import { v4 as uuidv4 } from "uuid";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey  = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const container   = "uploads";

export async function GET(req: NextRequest) {
  const sharedKeyCred = new StorageSharedKeyCredential(accountName, accountKey);
  const videoId = uuidv4();
  const blobName = `${videoId}.mp4`;
  const sasOptions = {
    containerName: container,
    blobName,
    permissions: BlobSASPermissions.parse("cwr"),
    startsOn: new Date(Date.now() - 5 * 60e3),
    expiresOn: new Date(Date.now() + 15 * 60e3),
    protocol: SASProtocol.Https,
  };

  const token = generateBlobSASQueryParameters(sasOptions, sharedKeyCred).toString();
  const url = `https://${accountName}.blob.core.windows.net/${container}/${blobName}?${token}`;

  return NextResponse.json({ uploadUrl: url, blobName, videoId });
}
