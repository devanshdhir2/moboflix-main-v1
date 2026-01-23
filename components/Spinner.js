// components/Spinner.jsx
import { createPortal } from "react-dom";

export default function Spinner({ show }) {
  if (!show) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
        <p className="mt-4 text-lg text-gray-200">Loading...</p>
      </div>
    </div>,
    document.body
  );
}
