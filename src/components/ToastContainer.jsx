import { AnimatePresence, motion } from "framer-motion";

const toneMap = {
  error: "var(--false)",
  warning: "var(--partial)",
  success: "var(--true)",
};

export default function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-3 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 28 }}
            transition={{ duration: 0.28 }}
            className="pointer-events-auto panel rounded-[22px] px-4 py-4"
          >
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="flex w-full items-start gap-3 text-left"
            >
              <span
                className="mt-1 h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: toneMap[toast.tone] || toneMap.error }}
              />
              <span className="text-sm leading-6 text-[var(--text-main)]">{toast.message}</span>
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
