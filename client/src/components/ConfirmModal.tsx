import React from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    isLoading = false,
}) => {
    if (!isOpen) {
        return null;
    }

    const isDeleteAction = confirmText === 'Удалить навсегда';
    const isArchiveAction = confirmText === 'Архивировать';
    const isRestoreAction = confirmText === 'Восстановить';

    let confirmButtonClass = "primary-btn small-btn";
    if (isDeleteAction) {
        confirmButtonClass += " confirm-btn-delete";
    } else if (isArchiveAction) {
        confirmButtonClass += " confirm-btn-archive";
    } else if (isRestoreAction) {
        confirmButtonClass += " confirm-btn-restore";
    }


    return (
        <div className="modal-overlay" onClick={!isLoading ? onClose : undefined}>
            <div className="modal-content confirm-modal-content" onClick={(e) => e.stopPropagation()}>

                <h2>{title}</h2>
                <p className="confirm-message">{message}</p>

                <div className="confirm-footer">
                    <button
                        onClick={onClose}
                        className="secondary-btn small-btn"
                        disabled={isLoading}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={confirmButtonClass}
                        disabled={isLoading}
                    >
                        {isLoading ? (isDeleteAction ? 'Удаление...' : isArchiveAction ? 'Архивирование...' : 'Обработка...') : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;