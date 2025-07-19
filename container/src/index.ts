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

async function transcodeToHLS(inputPath: string, outputDir: string) {
  console.log(`🎞️ Starting FFmpeg HLS transcode...`);
  await fs.mkdir(outputDir, { recursive: true });

  return new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", inputPath,
      "-filter_complex",
      "[0:v]split=3[v1][v2][v3];" +
      "[v1]scale=w=640:h=360[v360];" +
      "[v2]scale=w=854:h=480[v480];" +
      "[v3]scale=w=1280:h=720[v720]",
      "-map", "[v360]", "-c:v:0", "libx264", "-b:v:0", "800k",
      "-map", "[v480]", "-c:v:1", "libx264", "-b:v:1", "1400k",
      "-map", "[v720]", "-c:v:2", "libx264", "-b:v:2", "2500k",
      "-f", "hls",
      "-hls_time", "6",
      "-hls_list_size", "0",
      "-hls_segment_filename", `${outputDir}/v%v/seg_%03d.ts`,
      "-master_pl_name", "master.m3u8",
      "-var_stream_map", "v:0 v:1 v:2",
      `${outputDir}/v%v/prog.m3u8`
    ], { stdio: "inherit" });

    ffmpeg.on("close", code => {
      if (code === 0) {
        console.log("✅ FFmpeg completed");
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });
  });
}

