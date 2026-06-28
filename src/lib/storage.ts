import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type SavePaymentProofInput = {
  fileName: string;
  buffer: Buffer;
  mime: string;
};

type StoredFile = {
  fileUrl: string;
  storageKey: string;
};

export function storageDriver() {
  return process.env.STORAGE_DRIVER || "local-private";
}

function localProofPath(fileName: string) {
  return path.join(process.cwd(), "storage", "uploads", "proofs", fileName);
}

async function saveLocalPrivateProof({
  fileName,
  buffer,
}: SavePaymentProofInput): Promise<StoredFile> {
  const uploadDir = path.join(process.cwd(), "storage", "uploads", "proofs");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(localProofPath(fileName), buffer);

  return {
    fileUrl: `/api/proofs/${fileName}`,
    storageKey: fileName,
  };
}

async function saveCloudHttpProof({
  fileName,
  buffer,
  mime,
}: SavePaymentProofInput): Promise<StoredFile> {
  const endpoint = process.env.STORAGE_UPLOAD_ENDPOINT?.replace(/\/$/, "");
  const publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL?.replace(/\/$/, "");
  const token = process.env.STORAGE_UPLOAD_TOKEN;

  if (!endpoint || !publicBaseUrl) {
    throw new Error(
      "STORAGE_UPLOAD_ENDPOINT dan STORAGE_PUBLIC_BASE_URL wajib diisi untuk STORAGE_DRIVER=cloud-http."
    );
  }

  const response = await fetch(`${endpoint}/${encodeURIComponent(fileName)}`, {
    method: "PUT",
    headers: {
      "Content-Type": mime,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: new Uint8Array(buffer),
  });

  if (!response.ok) {
    throw new Error(`Upload storage cloud gagal (${response.status}).`);
  }

  return {
    fileUrl: `${publicBaseUrl}/${encodeURIComponent(fileName)}`,
    storageKey: fileName,
  };
}

export async function savePaymentProofFile(input: SavePaymentProofInput) {
  const driver = storageDriver();

  if (driver === "local-private") {
    return saveLocalPrivateProof(input);
  }

  if (driver === "cloud-http") {
    return saveCloudHttpProof(input);
  }

  throw new Error(`Storage driver ${driver} belum didukung.`);
}

export async function readLocalPaymentProof(fileName: string) {
  return readFile(localProofPath(fileName));
}
