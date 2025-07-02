import { ContextMenuProps } from "../types";

export default function ContextMenu({
 contextMenu,
 setContextMenu,
 handleRowOperation,
 handleColumnOperation,
 columnHeaders,
 getColumnLabel,
 hasAddColumn,
 hasDeleteColumn,
 hasUpdateColumn,
 hasAddRow,
 hasDeleteRow,
 hasUpdateRow,
}: ContextMenuProps) {
 if (!contextMenu) return null;

 return (
  <ul
   className="custom-context-menu absolute z-50 bg-white border border-gray-300 rounded shadow-md text-sm"
   style={{ top: contextMenu.y, left: contextMenu.x, minWidth: 180 }}
  >
   {hasAddRow && (
    <li
     className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
     onClick={() => {
      handleRowOperation("add", contextMenu.row);
      setContextMenu(null);
     }}
    >
     Insert Row Below
    </li>
   )}

   {hasDeleteRow && (
    <li
     className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
     onClick={() => {
      handleRowOperation("delete", contextMenu.row);
      setContextMenu(null);
     }}
    >
     Delete Row
    </li>
   )}

   {hasAddColumn && (
    <li
     className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
     onClick={() => {
      handleColumnOperation("add", {
       index: contextMenu.col + 1,
       newName: getColumnLabel(columnHeaders.length),
      });
      setContextMenu(null);
     }}
    >
     Insert Column Right
    </li>
   )}
   {hasDeleteColumn && (
    <li
     className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
     onClick={() => {
      handleColumnOperation("delete", { index: contextMenu.col });
      setContextMenu(null);
     }}
    >
     Delete Column
    </li>
   )}
  </ul>
 );
}
