interface ContextMenuProps {
  contextMenu: {
    x: number;
    y: number;
    row: number;
    col: number;
  } | null;
  setContextMenu: (value: null) => void;
  handleRowOperation: (operation: string, row: number) => void;
  handleColumnOperation: (operation: string, params: { index: number, newName?: string }) => void;
  columnHeaders: string[];
  getColumnLabel: (index: number) => string;
}

export default function ContextMenu({
  contextMenu,
  setContextMenu,
  handleRowOperation,
  handleColumnOperation,
  columnHeaders,
  getColumnLabel
}: ContextMenuProps) {
  if (!contextMenu) return null;

  return (
    <ul
      className="custom-context-menu absolute z-50 bg-white border border-gray-300 rounded shadow-md text-sm"
      style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 180 }}
    >
      <li
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
        onClick={() => {
          handleRowOperation('add', contextMenu.row);
          setContextMenu(null);
        }}
      >
        Insert Row Below
      </li>
      <li
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
        onClick={() => {
          handleRowOperation('delete', contextMenu.row);
          setContextMenu(null);
        }}
      >
        Delete Row
      </li>
      <li
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
        onClick={() => {
          handleColumnOperation('add', { index: contextMenu.col + 1, newName: getColumnLabel(columnHeaders.length) });
          setContextMenu(null);
        }}
      >
        Insert Column Right
      </li>
      <li
        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
        onClick={() => {
          handleColumnOperation('delete', { index: contextMenu.col });
          setContextMenu(null);
        }}
      >
        Delete Column
      </li>
    </ul>
  );
}
