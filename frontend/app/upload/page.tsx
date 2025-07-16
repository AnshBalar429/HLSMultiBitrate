"use client";

import { useState, useRef, useEffect } from "react";

type SasResponse = {
  uploadUrl: string;
  blobName: string;
};

export default function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate thumbnail once file is set
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.src = url;
    video.currentTime = 1; // seek 1s in
    video.onloadeddata = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(video, 0, 0);
      setThumbnail(canvas.toDataURL("image/png"));
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleFile = (f: FileList | null) => {
    if (f && f[0]) setFile(f[0]);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      // 1. Get SAS URL
      const res = await fetch("/api/get-upload-sas");
      if (!res.ok) throw new Error("Failed to get SAS");
      const { uploadUrl }: SasResponse = await res.json();

      // 2. PUT via XHR to track progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl, true);
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setProgress(pct);
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) resolve();
          else reject(new Error(`Upload failed: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.setRequestHeader("x-ms-blob-type", "BlockBlob");
        xhr.send(file);
      });

      setProgress(100);
      // Optionally notify parent or UI that processing has started…
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 border rounded-lg shadow">
      <h2 className="text-xl font-semibold">Upload Your Video</h2>

      {/* Dropzone / File Input */}
      <div
        onDrop={(e) => {
          e.preventDefault();
          handleFile(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 p-6 text-center cursor-pointer"
        onClick={() => document.getElementById("file-input")?.click()}
      >
        {file ? (
          <p>{file.name} ({(file.size / 1e6).toFixed(2)} MB)</p>
        ) : (
          <p>Click or drop a video here</p>
        )}
        <input
          id="file-input"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files)}
        />
      </div>

      {/* Thumbnail Preview */}
      {thumbnail && (
        <div>
          <p className="text-sm">Thumbnail preview:</p>
          <img src={thumbnail} alt="Video thumbnail" className="mt-2 rounded" />
        </div>
      )}

      {/* Upload Button & Progress */}
      <button
        onClick={upload}
        disabled={!file || uploading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {uploading ? "Uploading…" : "Start Upload"}
      </button>

      {uploading && (
        <div className="w-full bg-gray-200 rounded h-4 overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-width"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && <p className="text-sm text-red-600">Error: {error}</p>}
    </div>
  );
}
