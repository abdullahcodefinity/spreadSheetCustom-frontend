interface CellOptionsProps {
  position: { top: number; left: number } | null;
  onClose: () => void;
}

export default function CellOptions({ position, onClose }: CellOptionsProps) {
  if (!position) return null;

  return (
    <div
      className="absolute bg-white shadow-lg border border-gray-200 rounded-md py-2 z-50"
      style={{
        top: `${position.top + 40}px`, // Offset to appear below the cell
        left: `${position.left}px`,
      }}
    >
      <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
        <button className="text-sm text-gray-700 w-full text-left">
          Format Cell
        </button>
      </div>
      <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
        <button className="text-sm text-gray-700 w-full text-left">
          Insert Formula
        </button>
      </div>
      <div className="px-2 py-1 hover:bg-gray-100 cursor-pointer">
        <button className="text-sm text-gray-700 w-full text-left">
          Clear Cell
        </button>
      </div>
    </div>
  );
} 