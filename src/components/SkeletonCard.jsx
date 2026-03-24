import { motion } from "framer-motion";

export default function SkeletonCard() {
  return (
    <motion.div
      animate={{ opacity: [0.55, 0.95, 0.55] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      className="panel rounded-[28px] p-5"
    >
      <div className="mb-4 h-4 w-24 rounded-full bg-[rgba(255,255,255,0.08)]" />
      <div className="space-y-3">
        <div className="h-5 w-full rounded-full bg-[rgba(255,255,255,0.08)]" />
        <div className="h-5 w-5/6 rounded-full bg-[rgba(255,255,255,0.06)]" />
        <div className="h-5 w-2/3 rounded-full bg-[rgba(255,255,255,0.06)]" />
      </div>
      <div className="mt-5 flex gap-2">
        <div className="h-9 w-24 rounded-full bg-[rgba(255,255,255,0.06)]" />
        <div className="h-9 w-24 rounded-full bg-[rgba(255,255,255,0.06)]" />
      </div>
    </motion.div>
  );
}
