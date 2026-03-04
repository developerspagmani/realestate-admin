'use client';

import React from 'react';

interface ConfirmationModalProps {
    show: boolean;
    title: string;
    message: string | React.ReactNode;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    type?: 'danger' | 'primary' | 'warning' | 'success';
    icon?: string;
}

export default function ConfirmationModal({
    show,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    type = 'primary',
    icon
}: ConfirmationModalProps) {
    if (!show) return null;

    const typeClasses = {
        danger: 'btn-danger',
        primary: 'btn-primary',
        warning: 'btn-warning text-dark',
        success: 'btn-success'
    };

    const iconClasses = {
        danger: 'bi-exclamation-triangle-fill text-danger',
        primary: 'bi-info-circle-fill text-primary',
        warning: 'bi-exclamation-circle-fill text-warning',
        success: 'bi-check-circle-fill text-success'
    };

    const bgClasses = {
        danger: 'bg-danger-soft',
        primary: 'bg-primary-soft',
        warning: 'bg-warning-soft',
        success: 'bg-success-soft'
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', zIndex: 2100 }}>
            <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header border-0 p-4 pb-0 justify-content-center text-center">
                        <div className={`p-3 rounded-circle ${bgClasses[type]} d-flex align-items-center justify-content-center`} style={{ width: '70px', height: '70px' }}>
                            <i className={`bi ${icon || iconClasses[type]} fs-1`}></i>
                        </div>
                    </div>
                    <div className="modal-body p-4 text-center">
                        <h4 className="fw-bold text-dark mb-2">{title}</h4>
                        <div className="text-muted small px-2">
                            {message}
                        </div>
                    </div>
                    <div className="modal-footer border-0 p-4 d-flex gap-3 pt-0">
                        <button
                            type="button"
                            className="btn btn-light px-4 py-2 flex-grow-1 rounded-3 fw-bold border-0 shadow-sm"
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>
                        <button
                            type="button"
                            className={`btn ${typeClasses[type]} px-4 py-2 flex-grow-1 rounded-3 fw-bold shadow-sm`}
                            onClick={onConfirm}
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .bg-primary-soft { background-color: rgba(13, 110, 253, 0.1); }
                .bg-danger-soft { background-color: rgba(220, 53, 69, 0.1); }
                .bg-warning-soft { background-color: rgba(255, 193, 7, 0.1); }
                .bg-success-soft { background-color: rgba(25, 135, 84, 0.1); }
            `}</style>
        </div>
    );
}
