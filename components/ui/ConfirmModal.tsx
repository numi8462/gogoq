import Button from "@/components/common/Button";
import Modal from "@/components/common/Modal";

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  title,
  description,
  confirmLabel = "확인",
  onConfirm,
  onClose,
  isLoading,
}: ConfirmModalProps) {
  return (
    <Modal title={title} onClose={onClose} className="mx-1">
      <p className="text-sm text-text-secondary break-keep">{description}</p>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onClose}>
          취소
        </Button>
        <Button
          variant="danger"
          className="flex-1"
          isLoading={isLoading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
