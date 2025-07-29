import { NextRequest, NextResponse } from "next/server";
import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

const acct = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const key = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const container = process.env.OUTPUT_CONTAINER || "outputs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
): Promise<NextResponse> {
  
  const { videoId } = await params;
  const cred = new StorageSharedKeyCredential(acct, key);
  const client = new BlobServiceClient(`https://${acct}.blob.core.windows.net`, cred);
  const blobClient = client
    .getContainerClient(container)
    .getBlobClient(`${videoId}/master.m3u8`);

  const exists = await blobClient.exists();
  return NextResponse.json({ ready: exists });
}
