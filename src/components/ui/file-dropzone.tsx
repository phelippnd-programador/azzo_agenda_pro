import { useEffect, useMemo, useRef, useState, type MouseEvent, type RefCallback } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { Camera, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type FileDropzoneProps = {
  accept?: Accept;
  capture?: "user" | "environment";
  enableWebcamCapture?: boolean;
  cameraFacingMode?: "user" | "environment";
  maxSizeBytes?: number;
  disabled?: boolean;
  isLoading?: boolean;
  currentPreviewUrl?: string | null;
  title: string;
  description?: string;
  helperText?: string;
  previewAlt?: string;
  variant?: "card" | "avatar";
  sizeClassName?: string;
  onFileSelected: (file: File) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  inputTestId?: string;
  className?: string;
};

function formatBytes(value?: number) {
  if (!value || value <= 0) return "";
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(value / 1024)} KB`;
}

export function FileDropzone({
  accept,
  capture,
  enableWebcamCapture = false,
  cameraFacingMode = "user",
  maxSizeBytes,
  disabled = false,
  isLoading = false,
  currentPreviewUrl,
  title,
  description,
  helperText,
  previewAlt,
  variant = "card",
  sizeClassName,
  onFileSelected,
  onRemove,
  inputTestId,
  className,
}: FileDropzoneProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [isCapturingFromCamera, setIsCapturingFromCamera] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const attachStreamToVideo = async (videoElement: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!videoElement || !stream) return;

    if (videoElement.srcObject !== stream) {
      videoElement.srcObject = stream;
    }

    if (videoElement.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA || videoElement.videoWidth > 0) {
      setIsCameraReady(true);
      return;
    }

    await videoElement.play().catch(() => undefined);
  };

  const setVideoElement: RefCallback<HTMLVideoElement> = (node) => {
    videoRef.current = node;
    if (node && streamRef.current) {
      void attachStreamToVideo(node, streamRef.current);
    }
  };

  const helper = useMemo(() => {
    const sizeLabel = maxSizeBytes ? `Tamanho maximo: ${formatBytes(maxSizeBytes)}.` : "";
    return [helperText, sizeLabel].filter(Boolean).join(" ");
  }, [helperText, maxSizeBytes]);

  const canUseWebcam =
    enableWebcamCapture &&
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function";

  const stopCameraStream = () => {
    if (!streamRef.current) return;
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraReady(false);
  };

  useEffect(() => {
    if (!isCameraOpen || !canUseWebcam) return;

    let isActive = true;
    setIsCameraLoading(true);
    setCameraError(null);
    setIsCameraReady(false);

    void navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: cameraFacingMode,
        },
        audio: false,
      })
      .then(async (stream) => {
        if (!isActive) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        await attachStreamToVideo(videoRef.current, stream);
      })
      .catch(() => {
        if (isActive) {
          setCameraError("Nao foi possivel acessar a webcam do navegador.");
        }
      })
      .finally(() => {
        if (isActive) {
          setIsCameraLoading(false);
        }
      });

    return () => {
      isActive = false;
      stopCameraStream();
    };
  }, [cameraFacingMode, canUseWebcam, isCameraOpen]);

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    accept,
    maxSize: maxSizeBytes,
    multiple: false,
    disabled: disabled || isLoading,
    noKeyboard: true,
    onDropAccepted: async (acceptedFiles) => {
      const selectedFile = acceptedFiles[0];
      if (!selectedFile) return;
      setErrorMessage(null);
      await onFileSelected(selectedFile);
    },
    onDropRejected: (rejections) => {
      setErrorMessage(buildRejectionMessage(rejections[0]));
    },
  });

  const openCamera = (event: MouseEvent) => {
    event.stopPropagation();
    setCameraError(null);
    setIsCameraOpen(true);
  };

  const closeCamera = (open: boolean) => {
    setIsCameraOpen(open);
    if (!open) {
      stopCameraStream();
      setCameraError(null);
    }
  };

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video || !isCameraReady || video.videoWidth <= 0 || video.videoHeight <= 0) {
      setCameraError("A webcam ainda nao esta pronta para capturar.");
      return;
    }

    setIsCapturingFromCamera(true);
    setCameraError(null);
    setErrorMessage(null);

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");

      if (!context) {
        throw new Error("Nao foi possivel capturar a imagem da webcam.");
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (capturedBlob) => {
            if (!capturedBlob) {
              reject(new Error("Nao foi possivel gerar a imagem capturada."));
              return;
            }
            resolve(capturedBlob);
          },
          "image/jpeg",
          0.92
        );
      });

      const normalizedType = blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
      const extension = normalizedType === "image/png" ? "png" : normalizedType === "image/webp" ? "webp" : "jpg";

      const file = new File([blob], `camera-${Date.now()}.${extension}`, {
        type: normalizedType,
        lastModified: Date.now(),
      });

      await onFileSelected(file);
      closeCamera(false);
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "Nao foi possivel capturar a imagem da webcam.");
    } finally {
      setIsCapturingFromCamera(false);
    }
  };

  if (variant === "avatar") {
    const hasImage = Boolean(currentPreviewUrl);
    return (
      <>
        <div className={cn("space-y-2", className)}>
          <div
            {...getRootProps()}
            className={cn(
              "relative flex cursor-pointer items-center justify-center overflow-hidden transition-colors",
              hasImage
                ? "rounded-full border border-border bg-muted"
                : "rounded-2xl border border-dashed bg-muted/30 hover:bg-muted/50",
              isDragActive && "border-primary bg-primary/5",
              (disabled || isLoading) && "cursor-not-allowed opacity-70",
              sizeClassName || "h-24 w-24"
            )}
            aria-label={title}
          >
            <input {...getInputProps({ "data-testid": inputTestId, capture })} />

            {hasImage ? (
              <>
                <img
                  src={currentPreviewUrl || undefined}
                  alt={previewAlt || title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity hover:opacity-100">
                  {isLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  ) : (
                    <span className="px-2 text-center text-xs font-medium text-white">Arraste, clique ou use a camera</span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-1 px-2 text-center">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                ) : (
                  <UploadCloud className="h-6 w-6 text-primary" />
                )}
                <span className="text-[11px] font-medium leading-tight text-muted-foreground">Arraste ou clique</span>
              </div>
            )}

            {hasImage && onRemove ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className={cn(
                  "absolute h-7 w-7 rounded-full shadow-sm",
                  canUseWebcam ? "bottom-1 left-[38%] -translate-x-1/2" : "bottom-1 left-1/2 -translate-x-1/2"
                )}
                onClick={(event) => {
                  event.stopPropagation();
                  void onRemove();
                }}
                disabled={disabled || isLoading}
                aria-label="Remover imagem"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            ) : null}

            {canUseWebcam ? (
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className={cn(
                  "absolute bottom-1 h-7 w-7 rounded-full shadow-sm",
                  hasImage ? "left-[62%] -translate-x-1/2" : "left-1/2 -translate-x-1/2"
                )}
                onClick={openCamera}
                disabled={disabled || isLoading}
                aria-label="Abrir camera"
              >
                <Camera className="h-3.5 w-3.5" />
              </Button>
            ) : null}
          </div>

          {helper ? <div className="max-w-36 text-[11px] text-muted-foreground">{helper}</div> : null}
          {canUseWebcam ? <div className="max-w-36 text-[11px] text-muted-foreground">A webcam tambem pode ser usada no navegador.</div> : null}
          {errorMessage ? <div className="max-w-36 text-[11px] text-red-600">{errorMessage}</div> : null}
        </div>

        <CameraDialog
          isOpen={isCameraOpen}
          isLoading={isCameraLoading}
          isCapturing={isCapturingFromCamera}
          errorMessage={cameraError}
          isReady={isCameraReady}
          previewAlt={previewAlt || title}
          videoRef={setVideoElement}
          onVideoReady={() => setIsCameraReady(true)}
          onOpenChange={closeCamera}
          onCapture={captureFromCamera}
        />
      </>
    );
  }

  return (
    <>
      <div className={cn("space-y-3", className)}>
        <div
          {...getRootProps()}
          className={cn(
            "rounded-xl border border-dashed bg-muted/30 p-4 transition-colors hover:bg-muted/50",
            isDragActive && "border-primary bg-primary/5",
            (disabled || isLoading) && "cursor-not-allowed opacity-70"
          )}
        >
          <input {...getInputProps({ "data-testid": inputTestId, capture })} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border bg-background">
              {currentPreviewUrl ? (
                <img
                  src={currentPreviewUrl}
                  alt={previewAlt || title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImagePlus className="h-8 w-8 text-muted-foreground" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="font-medium">{title}</div>
              {description ? <div className="text-sm text-muted-foreground">{description}</div> : null}
              {helper ? <div className="mt-1 text-xs text-muted-foreground">{helper}</div> : null}
              {errorMessage ? <div className="mt-2 text-xs text-red-600">{errorMessage}</div> : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  open();
                }}
                disabled={disabled || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Selecionar
                  </>
                )}
              </Button>
              {canUseWebcam ? (
                <Button type="button" variant="outline" onClick={openCamera} disabled={disabled || isLoading}>
                  <Camera className="mr-2 h-4 w-4" />
                  Camera
                </Button>
              ) : null}
              {currentPreviewUrl && onRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    void onRemove();
                  }}
                  disabled={disabled || isLoading}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <CameraDialog
        isOpen={isCameraOpen}
        isLoading={isCameraLoading}
        isCapturing={isCapturingFromCamera}
        errorMessage={cameraError}
        isReady={isCameraReady}
        previewAlt={previewAlt || title}
        videoRef={setVideoElement}
        onVideoReady={() => setIsCameraReady(true)}
        onOpenChange={closeCamera}
        onCapture={captureFromCamera}
      />
    </>
  );
}

type CameraDialogProps = {
  isOpen: boolean;
  isLoading: boolean;
  isCapturing: boolean;
  errorMessage?: string | null;
  isReady: boolean;
  previewAlt: string;
  videoRef: RefCallback<HTMLVideoElement>;
  onVideoReady: () => void;
  onOpenChange: (open: boolean) => void;
  onCapture: () => Promise<void> | void;
};

function CameraDialog({
  isOpen,
  isLoading,
  isCapturing,
  errorMessage,
  isReady,
  previewAlt,
  videoRef,
  onVideoReady,
  onOpenChange,
  onCapture,
}: CameraDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Capturar pela webcam</DialogTitle>
          <DialogDescription>Permita o acesso a camera do navegador para tirar a foto agora.</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border bg-black">
          {isLoading ? (
            <div className="flex aspect-square items-center justify-center text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={onVideoReady}
              onCanPlay={onVideoReady}
              className="aspect-square w-full object-cover"
              aria-label={previewAlt}
            />
          )}
        </div>

        {!isLoading && !isReady && !errorMessage ? (
          <div className="text-sm text-muted-foreground">Aguardando a webcam iniciar...</div>
        ) : null}
        {errorMessage ? <div className="text-sm text-red-600">{errorMessage}</div> : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCapturing}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void onCapture()} disabled={isLoading || isCapturing || !isReady}>
            {isCapturing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Capturando...
              </>
            ) : (
              <>
                <Camera className="mr-2 h-4 w-4" />
                Tirar foto
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function buildRejectionMessage(rejection?: FileRejection) {
  if (!rejection) return "Nao foi possivel processar o arquivo selecionado.";
  if (rejection.errors.some((error) => error.code === "file-too-large")) {
    return "Arquivo acima do tamanho maximo permitido.";
  }
  if (rejection.errors.some((error) => error.code === "file-invalid-type")) {
    return "Formato nao suportado. Use JPG, PNG ou WEBP.";
  }
  return rejection.errors[0]?.message || "Nao foi possivel processar o arquivo selecionado.";
}
