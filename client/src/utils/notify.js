import { createElement } from 'react';
import Swal from 'sweetalert2';
import { renderToStaticMarkup } from 'react-dom/server';
import { FiCheck, FiAlertCircle, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const popup = Swal.mixin({
  toast: true,
  position: 'top-end',
  target: document.body,
  showConfirmButton: false,
  showCloseButton: true,
  buttonsStyling: false,
  showClass: {
    popup: 'idle-toast-show',
    backdrop: '',
    icon: '',
  },
  hideClass: {
    popup: 'idle-toast-hide',
    backdrop: '',
    icon: '',
  },
  animation: true,
  timer: 4200,
  timerProgressBar: false,
  customClass: {
    container: 'idle-toast-container',
    icon: 'idle-toast-icon',
    closeButton: 'idle-toast-close',
    title: 'idle-toast-title',
    htmlContainer: 'idle-toast-text',
  },
  didOpen: (toast) => {
    const isAssertive = toast.classList.contains('idle-toast-error') || toast.classList.contains('idle-toast-warning');
    toast.setAttribute('role', isAssertive ? 'alert' : 'status');
    toast.setAttribute('aria-live', isAssertive ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  },
});

const iconMarkup = {
  success: renderToStaticMarkup(createElement(FiCheck)),
  error: renderToStaticMarkup(createElement(FiAlertCircle)),
  info: renderToStaticMarkup(createElement(FiInfo)),
  warning: renderToStaticMarkup(createElement(FiAlertTriangle)),
};

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function show(icon, title, text = '') {
  const safeTitle = escapeHtml(title);
  const safeText = escapeHtml(text);

  return popup.fire({
    html: `
      <div class="idle-toast-content">
        <div class="idle-toast-inline-icon" aria-hidden="true">
          <span class="idle-toast-glyph">${iconMarkup[icon] || iconMarkup.info}</span>
        </div>
        <div class="idle-toast-title">${safeTitle}</div>
        ${safeText ? `<div class="idle-toast-text">${safeText}</div>` : ''}
      </div>
    `,
    customClass: {
      container: 'idle-toast-container',
      popup: `idle-toast-popup idle-toast-${icon}`,
      icon: 'idle-toast-icon',
      closeButton: 'idle-toast-close',
      htmlContainer: 'idle-toast-html',
    },
  });
}

export const notify = {
  success: (title, text = '') => show('success', title, text),
  error: (title, text = '') => show('error', title, text),
  info: (title, text = '') => show('info', title, text),
  warning: (title, text = '') => show('warning', title, text),
};

export default notify;



