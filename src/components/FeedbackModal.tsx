import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
}

const ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;

type Status = 'idle' | 'sending' | 'success' | 'error';

export function FeedbackModal({ open, onClose }: FeedbackModalProps) {
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  // Honeypot: hidden from real users, so a value here means a bot filled the form.
  const [honeypot, setHoneypot] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset to a clean idle state and focus the textarea each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setStatus('idle');
    setErrorMsg('');
    const id = window.setTimeout(() => textareaRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSend = message.trim().length > 0 && status !== 'sending';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    if (honeypot) return; // bot filled the hidden field — silently drop
    if (!ACCESS_KEY) {
      setStatus('error');
      setErrorMsg('Feedback isn’t configured yet — no Web3Forms access key is set.');
      return;
    }

    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: ACCESS_KEY,
          subject: 'Composition Armatures — feedback',
          from_name: 'Composition Armatures',
          message,
          email: email.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('success');
        setMessage('');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMsg(data.message || 'Something went wrong — please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Couldn’t reach the server — check your connection and try again.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="feedback-title" className="modal-title">Send feedback</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {status === 'success' ? (
          <div className="feedback-success">
            <p>Thanks — your feedback is on its way. 🙌</p>
            <button type="button" className="btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={handleSubmit}>
            <p className="modal-subtitle">Bugs, ideas, or anything else — it comes straight to me.</p>
            <textarea
              ref={textareaRef}
              className="feedback-textarea"
              placeholder="What’s on your mind?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
            />
            <input
              className="feedback-email"
              type="email"
              placeholder="Your email (optional, if you’d like a reply)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input
              type="text"
              className="feedback-honeypot"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
            {status === 'error' && <p className="control-error">{errorMsg}</p>}
            <div className="feedback-actions">
              <button type="button" className="btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={!canSend}>
                {status === 'sending' ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
