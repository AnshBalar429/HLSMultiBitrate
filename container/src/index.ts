import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { spawn } from "child_process";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { v4 as uuidv4 } from "uuid";

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME!;
const accountKey  = process.env.AZURE_STORAGE_ACCOUNT_KEY!;
const outputContainer = process.env.OUTPUT_CONTAINER || "outputs";
const videoUrl = process.env.VIDEO_URL!;


async function downloadBlob(tempDir: string) {
  console.log(`🔽 Downloading blob: ${videoUrl}`);
  const blobName = path.basename(videoUrl.split("?")[0]);
  const localPath = path.join(tempDir, blobName);
  console.log("1");
  const cred = new StorageSharedKeyCredential(accountName, accountKey);
  const blobService = new BlobServiceClient(
    `https://${accountName}.blob.core.windows.net`,
    cred
  );
  console.log("2");
  const url = new URL(videoUrl);
  const containerName = url.pathname.split("/")[1];
  const container = blobService.getContainerClient(containerName);
  const blobClient = container.getBlobClient(blobName);
  console.log("3");
  await fs.mkdir(tempDir, { recursive: true });
  await blobClient.downloadToFile(localPath);
  console.log(`✅ Downloaded to ${localPath}`);

  return { localPath, videoId: path.parse(blobName).name };
}

