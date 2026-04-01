const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_TARGET_SIZE_BYTES = 500 * 1024;
const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

type PrepareImageUploadOptions = {
  maxDimension?: number;
  targetSizeBytes?: number;
  maxFileSizeBytes?: number;
};

type LoadedImage = {
  width: number;
  height: number;
  source: CanvasImageSource;
};

export async function prepareImageUpload(
  file: File,
  options: PrepareImageUploadOptions = {}
): Promise<File> {
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const targetSizeBytes = options.targetSizeBytes ?? DEFAULT_TARGET_SIZE_BYTES;
  const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;

  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    throw new Error("Formato de imagem nao suportado. Use JPG, PNG ou WEBP.");
  }
  if (file.size > maxFileSizeBytes) {
    throw new Error("Imagem excede o tamanho maximo permitido de 10 MB.");
  }

  const image = await loadImage(file);
  const dimensions = getScaledDimensions(image.width, image.height, maxDimension);
  const needsResize = dimensions.width !== image.width || dimensions.height !== image.height;
  const needsCompression = file.size > targetSizeBytes;

  if (!needsResize && !needsCompression) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Nao foi possivel preparar a imagem para upload.");
  }

  context.drawImage(image.source, 0, 0, dimensions.width, dimensions.height);

  let quality = 0.86;
  let blob = await canvasToBlob(canvas, "image/webp", quality);

  while (blob.size > targetSizeBytes && quality > 0.56) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, "image/webp", quality);
  }

  if (blob.size >= file.size && !needsResize) {
    return file;
  }

  return new File([blob], replaceFileExtension(file.name, "webp"), {
    type: blob.type,
    lastModified: Date.now(),
  });
}

function getScaledDimensions(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) {
    return { width, height };
  }
  const ratio = width > height ? maxDimension / width : maxDimension / height;
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

async function loadImage(file: File): Promise<LoadedImage> {
  if ("createImageBitmap" in window) {
    const bitmap = await createImageBitmap(file);
    return {
      width: bitmap.width,
      height: bitmap.height,
      source: bitmap,
    };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Nao foi possivel ler a imagem selecionada."));
      element.src = objectUrl;
    });
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      source: image,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Nao foi possivel gerar a imagem otimizada."));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

function replaceFileExtension(fileName: string, extension: string) {
  const normalized = fileName || "imagem-estabelecimento";
  const baseName = normalized.replace(/\.[^/.]+$/, "");
  return `${baseName}.${extension}`;
}
