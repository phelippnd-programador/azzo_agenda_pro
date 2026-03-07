import { ConfirmationDialog } from "@/components/common/ConfirmationDialog";

type DeleteConfirmationDialogProps = {
  open: boolean;
  isLoading?: boolean;
  title?: string;
  description: string;
  cancelLabel?: string;
  confirmLabel?: string;
  loadingLabel?: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteConfirmationDialog({
  open,
  isLoading = false,
  title = "Confirmar exclusao?",
  description,
  cancelLabel = "Cancel",
  confirmLabel = "Confirm Delete",
  loadingLabel = "Excluindo...",
  onOpenChange,
  onConfirm,
}: DeleteConfirmationDialogProps) {
  return (
    <ConfirmationDialog
      open={open}
      title={title}
      description={description}
      isLoading={isLoading}
      cancelLabel={cancelLabel}
      confirmLabel={confirmLabel}
      loadingLabel={loadingLabel}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
    />
  );
}
