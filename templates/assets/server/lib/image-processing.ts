import sharp from "sharp";

import type {
  AspectRatio,
  PresetSkeletonForegroundLayer,
  PresetSkeletonSpec,
} from "../../shared/api.js";
import { aspectRatioValue } from "./preset-skeleton.js";

/**
 * True when the error means the sharp native module cannot run in this
 * runtime (e.g. the Cloudflare Pages worker build stubs `sharp` with a
 * throwing proxy, and serverless Linux builds can fail to load the native
 * binary). Used to degrade gracefully instead of failing the whole upload.
 */
function isSharpUnavailableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /sharp unavailable|Could not load the "?sharp"? module/i.test(
    message,
  );
}

/**
 * Pure-JS dimension sniffing for the upload formats the app accepts.
 * Fallback path for runtimes where sharp is unavailable (workerd); parses
 * container headers only — no decoding.
 */
export function sniffImageDimensions(data: Uint8Array): {
  width: number | null;
  height: number | null;
  mimeType: string | null;
} {
  const none = { width: null, height: null, mimeType: null };
  if (data.length < 16) return none;
  // PNG: IHDR width/height are big-endian uint32 at offsets 16/20.
  if (
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47
  ) {
    if (data.length < 24) return { ...none, mimeType: "image/png" };
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    return {
      width: view.getUint32(16),
      height: view.getUint32(20),
      mimeType: "image/png",
    };
  }
  // JPEG: walk segment markers to the first SOF frame header.
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    let offset = 2;
    while (offset + 9 < data.length) {
      if (data[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = data[offset + 1];
      // Standalone markers without length payloads.
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
        offset += 2;
        continue;
      }
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      if (isSof) {
        return {
          height: view.getUint16(offset + 5),
          width: view.getUint16(offset + 7),
          mimeType: "image/jpeg",
        };
      }
      const length = view.getUint16(offset + 2);
      if (length < 2) break;
      offset += 2 + length;
    }
    return { ...none, mimeType: "image/jpeg" };
  }
  // WebP: RIFF container; VP8/VP8L/VP8X chunks carry dimensions.
  if (
    Buffer.from(data.subarray(0, 4)).toString("ascii") === "RIFF" &&
    Buffer.from(data.subarray(8, 12)).toString("ascii") === "WEBP" &&
    data.length >= 30
  ) {
    const chunk = Buffer.from(data.subarray(12, 16)).toString("ascii");
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    if (chunk === "VP8X") {
      return {
        width: 1 + (data[24] | (data[25] << 8) | (data[26] << 16)),
        height: 1 + (data[27] | (data[28] << 8) | (data[29] << 16)),
        mimeType: "image/webp",
      };
    }
    if (chunk === "VP8L" && data[20] === 0x2f) {
      const bits = view.getUint32(21, true);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >> 14) & 0x3fff) + 1,
        mimeType: "image/webp",
      };
    }
    if (chunk === "VP8 ") {
      // Lossy keyframe: 3-byte frame tag then 9d 01 2a start code.
      if (data[23] === 0x9d && data[24] === 0x01 && data[25] === 0x2a) {
        return {
          width: view.getUint16(26, true) & 0x3fff,
          height: view.getUint16(28, true) & 0x3fff,
          mimeType: "image/webp",
        };
      }
      return { ...none, mimeType: "image/webp" };
    }
    return { ...none, mimeType: "image/webp" };
  }
  // AVIF: scan for the `ispe` (image spatial extents) property box —
  // version/flags(4) width(4) height(4) big-endian after the fourcc.
  if (
    Buffer.from(data.subarray(4, 12)).toString("ascii").includes("ftyp") &&
    Buffer.from(data.subarray(8, 12)).toString("ascii") === "avif"
  ) {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    const limit = Math.min(data.length - 16, 65536);
    for (let i = 12; i < limit; i++) {
      if (
        data[i] === 0x69 && // i
        data[i + 1] === 0x73 && // s
        data[i + 2] === 0x70 && // p
        data[i + 3] === 0x65 // e
      ) {
        return {
          width: view.getUint32(i + 8),
          height: view.getUint32(i + 12),
          mimeType: "image/avif",
        };
      }
    }
    return { ...none, mimeType: "image/avif" };
  }
  return none;
}

export async function imageInfo(buffer: Buffer): Promise<{
  width: number | null;
  height: number | null;
  mimeType: string;
  sizeBytes: number;
}> {
  try {
    const img = sharp(buffer, { failOn: "none" });
    const meta = await img.metadata();
    const format = meta.format === "jpeg" ? "jpeg" : meta.format || "png";
    return {
      width: meta.width ?? null,
      height: meta.height ?? null,
      mimeType:
        format === "jpg" || format === "jpeg"
          ? "image/jpeg"
          : `image/${format}`,
      sizeBytes: buffer.byteLength,
    };
  } catch (error) {
    if (!isSharpUnavailableError(error)) throw error;
    // Passthrough-for-originals: header-parse dimensions so uploads keep
    // working on runtimes without sharp. Callers fall back to the declared
    // mime type when the sniffer returns null.
    const sniffed = sniffImageDimensions(buffer);
    return {
      width: sniffed.width,
      height: sniffed.height,
      mimeType: sniffed.mimeType ?? "",
      sizeBytes: buffer.byteLength,
    };
  }
}

export async function makeThumbnail(buffer: Buffer): Promise<{
  buffer: Buffer;
  mimeType: string;
} | null> {
  try {
    return {
      buffer: await sharp(buffer, { failOn: "none" })
        .rotate()
        .resize({
          width: 640,
          height: 640,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 82 })
        .toBuffer(),
      mimeType: "image/webp",
    };
  } catch (error) {
    if (!isSharpUnavailableError(error)) throw error;
    // No thumbnail on runtimes without sharp — readers already fall back to
    // the original asset when `thumbnailObjectKey` is null.
    return null;
  }
}

export async function extractDominantColors(buffer: Buffer): Promise<string[]> {
  const { data } = await sharp(buffer, { failOn: "none" })
    .resize(64, 64, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += 3) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = [r, g, b]
      .map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0"))
      .join("");
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([hex]) => `#${hex.toUpperCase()}`);
}

export async function compositeLogo(input: {
  image: Buffer;
  logo: Buffer;
}): Promise<Buffer> {
  const base = sharp(input.image, { failOn: "none" }).rotate();
  const meta = await base.metadata();
  const width = meta.width ?? 1024;
  const height = meta.height ?? 1024;
  const logoWidth = Math.max(120, Math.round(width * 0.16));
  const logoBuffer = await sharp(input.logo, { failOn: "none" })
    .resize({ width: logoWidth, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const inset = Math.max(24, Math.round(Math.min(width, height) * 0.035));
  return base
    .composite([
      { input: logoBuffer, top: inset, left: width - logoWidth - inset },
    ])
    .png()
    .toBuffer();
}

export async function renderBackground(input: {
  spec: PresetSkeletonSpec;
  size: { width: number; height: number };
  backgroundAsset?: Buffer;
}): Promise<Buffer> {
  const { width, height } = input.size;
  if (!input.backgroundAsset) {
    throw new Error("Preset skeleton background image is missing.");
  }
  return sharp(input.backgroundAsset, { failOn: "none" })
    .rotate()
    .resize({ width, height, fit: "cover" })
    .png()
    .toBuffer();
}

export async function maskFromPlateAlpha(plate: Buffer): Promise<Buffer> {
  return maskFromAlphaChannel({
    image: plate,
    transparentError:
      "gpt-image-2 skeleton inpainting requires a background plate with transparent areas.",
  });
}

export async function maskFromManualMaskAlpha(input: {
  mask: Buffer;
  plate: Buffer;
}): Promise<Buffer> {
  const plateMeta = await sharp(input.plate, { failOn: "none" }).metadata();
  return maskFromAlphaChannel({
    image: input.mask,
    expectedSize: {
      width: plateMeta.width ?? 0,
      height: plateMeta.height ?? 0,
    },
    sizeError:
      "Skeleton inpainting mask must be the same pixel size as the background plate.",
    transparentError:
      "Skeleton inpainting mask requires transparent areas to mark where the subject may be painted.",
  });
}

const GPT_IMAGE_2_EDIT_SIZE_MULTIPLE = 16;
const GPT_IMAGE_2_EDIT_MIN_PIXELS = 655_360;
const GPT_IMAGE_2_EDIT_MAX_PIXELS = 8_294_400;
const GPT_IMAGE_2_EDIT_MAX_SIDE = 3840;
const GPT_IMAGE_2_EDIT_MAX_RATIO = 3;

export async function prepareGptImage2SkeletonInpaintImages(input: {
  plate: Buffer;
  mask: Buffer;
}): Promise<{
  plate: Buffer;
  mask: Buffer;
  size: { width: number; height: number };
  resized: boolean;
}> {
  const metadata = await sharp(input.plate, { failOn: "none" }).metadata();
  const width = metadata.width ?? 0;
  const height = metadata.height ?? 0;
  if (!width || !height) {
    throw new Error(
      "Skeleton inpainting background plate dimensions are invalid.",
    );
  }
  const size = gptImage2EditSizeForPlate({ width, height });
  const resized = size.width !== width || size.height !== height;
  if (!resized) {
    return { plate: input.plate, mask: input.mask, size, resized };
  }
  return {
    plate: await sharp(input.plate, { failOn: "none" })
      .rotate()
      .resize({ width: size.width, height: size.height, fit: "fill" })
      .png()
      .toBuffer(),
    mask: await sharp(input.mask, { failOn: "none" })
      .resize({ width: size.width, height: size.height, fit: "fill" })
      .png()
      .toBuffer(),
    size,
    resized,
  };
}

function gptImage2EditSizeForPlate(input: { width: number; height: number }): {
  width: number;
  height: number;
} {
  if (isValidGptImage2EditSize(input)) return input;
  const ratio =
    Math.max(input.width, input.height) / Math.min(input.width, input.height);
  if (ratio > GPT_IMAGE_2_EDIT_MAX_RATIO) {
    throw new Error(
      "gpt-image-2 skeleton inpainting requires a background plate aspect ratio no wider or taller than 3:1.",
    );
  }

  const pixels = input.width * input.height;
  let scale = 1;
  if (pixels < GPT_IMAGE_2_EDIT_MIN_PIXELS) {
    scale = Math.sqrt(GPT_IMAGE_2_EDIT_MIN_PIXELS / pixels);
  } else if (pixels > GPT_IMAGE_2_EDIT_MAX_PIXELS) {
    scale = Math.sqrt(GPT_IMAGE_2_EDIT_MAX_PIXELS / pixels);
  }
  scale = Math.min(
    scale,
    GPT_IMAGE_2_EDIT_MAX_SIDE / Math.max(input.width, input.height),
  );

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const candidate = {
      width: roundToMultiple(
        input.width * scale,
        GPT_IMAGE_2_EDIT_SIZE_MULTIPLE,
      ),
      height: roundToMultiple(
        input.height * scale,
        GPT_IMAGE_2_EDIT_SIZE_MULTIPLE,
      ),
    };
    if (isValidGptImage2EditSize(candidate)) return candidate;
    const candidatePixels = candidate.width * candidate.height;
    if (
      candidatePixels < GPT_IMAGE_2_EDIT_MIN_PIXELS ||
      candidate.width % GPT_IMAGE_2_EDIT_SIZE_MULTIPLE !== 0 ||
      candidate.height % GPT_IMAGE_2_EDIT_SIZE_MULTIPLE !== 0
    ) {
      scale *= 1.01;
    } else {
      scale *= 0.99;
    }
  }

  throw new Error(
    "Unable to prepare a valid gpt-image-2 skeleton inpainting size.",
  );
}

function isValidGptImage2EditSize(input: {
  width: number;
  height: number;
}): boolean {
  if (!Number.isInteger(input.width) || !Number.isInteger(input.height)) {
    return false;
  }
  if (input.width <= 0 || input.height <= 0) return false;
  if (Math.max(input.width, input.height) > GPT_IMAGE_2_EDIT_MAX_SIDE) {
    return false;
  }
  if (
    input.width % GPT_IMAGE_2_EDIT_SIZE_MULTIPLE !== 0 ||
    input.height % GPT_IMAGE_2_EDIT_SIZE_MULTIPLE !== 0
  ) {
    return false;
  }
  if (
    Math.max(input.width, input.height) / Math.min(input.width, input.height) >
    GPT_IMAGE_2_EDIT_MAX_RATIO
  ) {
    return false;
  }
  const pixels = input.width * input.height;
  return (
    pixels >= GPT_IMAGE_2_EDIT_MIN_PIXELS &&
    pixels <= GPT_IMAGE_2_EDIT_MAX_PIXELS
  );
}

function roundToMultiple(value: number, multiple: number): number {
  return Math.max(multiple, Math.round(value / multiple) * multiple);
}

async function maskFromAlphaChannel(input: {
  image: Buffer;
  expectedSize?: { width: number; height: number };
  sizeError?: string;
  transparentError: string;
}): Promise<Buffer> {
  const { data, info } = await sharp(input.image, { failOn: "none" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (
    input.expectedSize &&
    (info.width !== input.expectedSize.width ||
      info.height !== input.expectedSize.height)
  ) {
    throw new Error(input.sizeError ?? "Mask image dimensions are invalid.");
  }
  const mask = Buffer.alloc(info.width * info.height * 4);
  let hasTransparentPixels = false;
  for (let source = 0, target = 0; source < data.length; source += 4) {
    const alpha = data[source + 3];
    if (alpha < 255) hasTransparentPixels = true;
    mask[target++] = 255;
    mask[target++] = 255;
    mask[target++] = 255;
    mask[target++] = alpha;
  }
  if (!hasTransparentPixels) {
    throw new Error(input.transparentError);
  }
  return sharp(mask, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

export async function applyPresetSkeleton(input: {
  subject: Buffer;
  spec: PresetSkeletonSpec;
  canvasSize?: { width: number; height: number };
  canvasAspectRatio?: AspectRatio;
  backgroundAsset?: Buffer;
  canonicalLogo?: Buffer;
  foregroundAssets?: Record<string, Buffer>;
}): Promise<Buffer> {
  const subjectBase = sharp(input.subject, { failOn: "none" }).rotate();
  const subjectMeta = await subjectBase.metadata();
  const size =
    input.canvasSize ??
    canvasSizeFromAspectRatio({
      aspectRatio: input.canvasAspectRatio,
      baseWidth: subjectMeta.width ?? 1024,
      baseHeight: subjectMeta.height ?? 1024,
    });
  const background = await renderBackground({
    spec: input.spec,
    size,
    backgroundAsset: input.backgroundAsset,
  });
  const region = normalizeContentRegion(input.spec.contentRegion);
  const subjectBox = {
    left: Math.round(size.width * region.x),
    top: Math.round(size.height * region.y),
    width: Math.max(1, Math.round(size.width * region.w)),
    height: Math.max(1, Math.round(size.height * region.h)),
  };
  const resizedSubject = await subjectBase
    .resize({
      width: subjectBox.width,
      height: subjectBox.height,
      fit: input.spec.contentMode === "cutout" ? "contain" : "cover",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  const composites: sharp.OverlayOptions[] = [];
  if (input.spec.contentMode === "cutout" && input.spec.dropShadow) {
    composites.push({
      input: contactShadowSvg(size, subjectBox),
      top: 0,
      left: 0,
    });
  }
  composites.push({
    input: resizedSubject,
    top: subjectBox.top,
    left: subjectBox.left,
  });
  composites.push(
    ...(await foregroundCompositeLayers({
      layers: input.spec.foreground ?? [],
      canvasSize: size,
      canonicalLogo: input.canonicalLogo,
      foregroundAssets: input.foregroundAssets ?? {},
    })),
  );
  return sharp(background, { failOn: "none" })
    .composite(composites)
    .png()
    .toBuffer();
}

export function canvasSizeFromAspectRatio(input: {
  aspectRatio?: AspectRatio;
  baseWidth: number;
  baseHeight: number;
}): { width: number; height: number } {
  const baseWidth = Math.max(1, input.baseWidth);
  const baseHeight = Math.max(1, input.baseHeight);
  if (!input.aspectRatio) return { width: baseWidth, height: baseHeight };
  const requested = aspectRatioValue(input.aspectRatio);
  const current = baseWidth / baseHeight;
  if (Math.abs(requested - current) < 0.01) {
    return { width: baseWidth, height: baseHeight };
  }
  if (requested > current) {
    return {
      width: Math.max(1, Math.round(baseHeight * requested)),
      height: baseHeight,
    };
  }
  return {
    width: baseWidth,
    height: Math.max(1, Math.round(baseWidth / requested)),
  };
}

function normalizeContentRegion(region: PresetSkeletonSpec["contentRegion"]): {
  x: number;
  y: number;
  w: number;
  h: number;
} {
  if (!region) return { x: 0, y: 0, w: 1, h: 1 };
  const x = clamp(region.x, 0, 1);
  const y = clamp(region.y, 0, 1);
  return {
    x,
    y,
    w: clamp(region.w, 0.02, 1 - x),
    h: clamp(region.h, 0.02, 1 - y),
  };
}

async function foregroundCompositeLayers(input: {
  layers: PresetSkeletonForegroundLayer[];
  canvasSize: { width: number; height: number };
  canonicalLogo?: Buffer;
  foregroundAssets: Record<string, Buffer>;
}): Promise<sharp.OverlayOptions[]> {
  const overlays: sharp.OverlayOptions[] = [];
  for (const layer of input.layers) {
    const source =
      layer.source === "canonicalLogo"
        ? input.canonicalLogo
        : input.foregroundAssets[layer.source.assetId];
    if (!source) continue;
    const targetWidth = Math.max(
      1,
      Math.round(input.canvasSize.width * clamp(layer.w, 0.02, 1)),
    );
    const buffer = await sharp(source, { failOn: "none" })
      .rotate()
      .resize({ width: targetWidth, fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    overlays.push({
      input: buffer,
      left: Math.round(input.canvasSize.width * clamp(layer.x, 0, 1)),
      top: Math.round(input.canvasSize.height * clamp(layer.y, 0, 1)),
    });
  }
  return overlays;
}

function contactShadowSvg(
  canvasSize: { width: number; height: number },
  subjectBox: { left: number; top: number; width: number; height: number },
): Buffer {
  const cx = subjectBox.left + subjectBox.width / 2;
  const cy = subjectBox.top + subjectBox.height * 0.86;
  const rx = Math.max(12, subjectBox.width * 0.28);
  const ry = Math.max(6, subjectBox.height * 0.045);
  const blur = Math.max(
    6,
    Math.min(canvasSize.width, canvasSize.height) * 0.018,
  );
  return Buffer.from(`<svg width="${canvasSize.width}" height="${canvasSize.height}" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}" xmlns="http://www.w3.org/2000/svg">
  <defs><filter id="shadow"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>
  <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#000000" opacity="0.24" filter="url(#shadow)"/>
</svg>`);
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function hasRasterImageSignature(
  mimeType: string,
  data: Uint8Array,
): boolean {
  if (mimeType === "image/png") {
    return (
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47
    );
  }
  if (mimeType === "image/jpeg") {
    return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  if (mimeType === "image/webp") {
    return (
      Buffer.from(data.subarray(0, 4)).toString("ascii") === "RIFF" &&
      Buffer.from(data.subarray(8, 12)).toString("ascii") === "WEBP"
    );
  }
  if (mimeType === "image/avif") {
    return Buffer.from(data.subarray(4, 12)).toString("ascii").includes("ftyp");
  }
  return false;
}

export function hasVideoSignature(mimeType: string, data: Uint8Array): boolean {
  if (
    mimeType === "video/mp4" ||
    mimeType === "video/quicktime" ||
    mimeType === "video/x-m4v"
  ) {
    return Buffer.from(data.subarray(4, 12)).toString("ascii").includes("ftyp");
  }
  if (mimeType === "video/webm") {
    return (
      data[0] === 0x1a &&
      data[1] === 0x45 &&
      data[2] === 0xdf &&
      data[3] === 0xa3
    );
  }
  return false;
}
