import { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

// Shared sheet for components that float above the page: fixed width, one
// consistent height, sticky header/footer, body scrolls. Backdrop click and
// Escape both close it.
const Modal = ({ onClose, eyebrow, title, subtitle, headerExtra, children, footer, width = 560 }) => {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="cmodal-ov" onMouseDown={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="cmodal" style={{ width }} role="dialog" aria-modal="true" aria-label={title}>
        <header className="cmodal-hd">
          <div className="cmodal-hd-row">
            <div style={{ minWidth: 0 }}>
              {eyebrow && <div className="cmodal-eyebrow">{eyebrow}</div>}
              <h2 className="cmodal-title">{title}</h2>
              {subtitle && <div className="cmodal-sub">{subtitle}</div>}
            </div>
            <button className="cmodal-x" onClick={onClose} aria-label="Close">
              <X size={17} strokeWidth={2.2} />
            </button>
          </div>
          {headerExtra}
        </header>

        <div className="cmodal-body">{children}</div>

        {footer && <footer className="cmodal-ft">{footer}</footer>}
      </div>
    </div>
  );
};

export default Modal;
