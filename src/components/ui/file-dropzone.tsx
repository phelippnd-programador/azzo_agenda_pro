import { useMemo, useState } from "react";
import { useDropzone, type Accept, type FileRejection } from "react-dropzone";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type FileDropzoneProps = {
  accept?: Accept;
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

  const helper = useMemo(() => {
    const sizeLabel = maxSizeBytes ? `Tamanho maximo: ${formatBytes(maxSizeBytes)}.` : "";
    return [helperText, sizeLabel].filter(Boolean).join(" ");
  }, [helperText, maxSizeBytes]);

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

  if (variant === "avatar") {
    const hasImage = Boolean(currentPreviewUrl);
    return (
      <div className={cn("space-y-2", className)}>
        <div
          {...getRootProps()}
          className={cn(
            "relative flex items-center justify-center overflow-hidden transition-colors",
            "cursor-pointer",
            hasImage
              ? "rounded-full border border-border bg-muted"
              : "rounded-2xl border border-dashed bg-muted/30 hover:bg-muted/50",
            isDragActive && "border-primary bg-primary/5",
            (disabled || isLoading) && "cursor-not-allowed opacity-70",
            sizeClassName || "h-24 w-24"
          )}
          aria-label={title}
        >
          <input {...getInputProps({ "data-testid": inputTestId })} />

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
                  <span className="px-2 text-center text-xs font-medium text-white">
                    Arraste ou clique
                  </span>
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
              <span className="text-[11px] font-medium leading-tight text-muted-foreground">
                Arraste ou clique
              </span>
            </div>
          )}

          {hasImage && onRemove ? (
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="absolute bottom-1 left-1/2 h-7 w-7 -translate-x-1/2 rounded-full shadow-sm"
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
        </div>

        {helper ? <div className="max-w-32 text-[11px] text-muted-foreground">{helper}</div> : null}
        {errorMessage ? <div className="max-w-32 text-[11px] text-red-600">{errorMessage}</div> : null}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "rounded-xl border border-dashed p-4 transition-colors",
          "bg-muted/30 hover:bg-muted/50",
          isDragActive && "border-primary bg-primary/5",
          (disabled || isLoading) && "cursor-not-allowed opacity-70"
        )}
      >
        <input {...getInputProps({ "data-testid": inputTestId })} />
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
