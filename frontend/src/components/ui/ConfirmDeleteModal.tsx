import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  itemName?: string;
  isDeleting?: boolean;
}

export function ConfirmDeleteModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  description,
  itemName = "this item",
  isDeleting = false,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            onClick={onConfirm}
            loading={isDeleting}
          >
            Delete
          </Button>
        </>
      }
    >
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {description || `Are you sure you want to delete ${itemName}? This action cannot be undone.`}
        </p>
      </div>
    </Modal>
  );
}
