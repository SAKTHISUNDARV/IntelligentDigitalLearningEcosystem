import Swal from 'sweetalert2';

export async function confirmAction({
  title = 'Are you sure?',
  text = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  icon = 'warning',
  confirmButtonColor = '#1e293b',
  cancelButtonColor = '#f8fafc',
  confirmTextColor = '#ffffff',
  cancelTextColor = '#64748b',
} = {}) {
  const result = await Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: false,
    buttonsStyling: false,
    customClass: {
      popup: 'idle-confirm-popup',
      icon: 'idle-confirm-icon',
      title: 'idle-confirm-title',
      htmlContainer: 'idle-confirm-text',
      actions: 'idle-confirm-actions',
      confirmButton: 'idle-confirm-button idle-confirm-button-primary',
      cancelButton: 'idle-confirm-button idle-confirm-button-secondary',
    },
    showClass: {
      popup: 'idle-confirm-show',
      backdrop: 'swal2-backdrop-show',
      icon: 'swal2-icon-show'
    },
    hideClass: {
      popup: 'idle-confirm-hide',
      backdrop: 'swal2-backdrop-hide',
      icon: 'swal2-icon-hide'
    },
    didOpen: () => {
      const confirmButton = Swal.getConfirmButton();
      const cancelButton = Swal.getCancelButton();
      if (confirmButton) {
        confirmButton.style.backgroundColor = confirmButtonColor;
        confirmButton.style.color = confirmTextColor;
      }
      if (cancelButton) {
        cancelButton.style.backgroundColor = cancelButtonColor;
        cancelButton.style.color = cancelTextColor;
      }
    },
  });

  return result.isConfirmed;
}

export default confirmAction;
