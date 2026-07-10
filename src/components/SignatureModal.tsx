import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useI18n } from '../i18n/I18nContext';

interface SignatureModalProps {
  loserName: string;
  onSave: (dataUrl: string) => void;
  onSkip: () => void;
}

export function SignatureModal({ loserName, onSave, onSkip }: SignatureModalProps) {
  const { t } = useI18n();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#0f172a';
    }
  }, []);

  const getPoint = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext('2d');
    const last = lastPointRef.current;
    const point = getPoint(e);
    if (ctx && last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    lastPointRef.current = point;
    if (!hasDrawn) setHasDrawn(true);
  };

  const handlePointerUp = () => {
    drawingRef.current = false;
    lastPointRef.current = null;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasDrawn(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:bg-slate-900 sm:rounded-2xl sm:pb-4">
        <p className="mb-3 text-center text-lg font-semibold">
          {t('signature.title', { name: loserName })}
        </p>
        <canvas
          ref={canvasRef}
          className="h-56 w-full touch-none rounded-xl border border-slate-300 bg-white dark:border-slate-700"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
        <div className="mt-4 grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={clear}
            className="rounded-lg border border-slate-300 px-3 py-3 text-sm font-medium dark:border-slate-700"
          >
            {t('signature.clear')}
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="rounded-lg border border-slate-300 px-3 py-3 text-sm font-medium dark:border-slate-700"
          >
            {t('signature.skip')}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!hasDrawn}
            className="rounded-lg bg-indigo-600 px-3 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {t('signature.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
