import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface ReorderHandleRenderProps {
  setNodeRef: (node: HTMLElement | null) => void;
  style: React.CSSProperties;
  handle: React.ReactElement;
  isDragging: boolean;
}

export interface ReorderHandleProps {
  id: string;
  children: (props: ReorderHandleRenderProps) => React.ReactElement;
}

// Render-prop wrapper around useSortable. The parent (a row in Sidebar)
// applies setNodeRef + style to its root element; the `handle` element
// is the drag-grip span, already wired so only the grip itself initiates
// a drag (not the whole row).
export function ReorderHandle({ id, children }: ReorderHandleProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handle = (
    <span
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`Reorder ${id}`}
      data-reorder-grip
      style={{
        cursor: "grab",
        opacity: 0.5,
        userSelect: "none",
        padding: "0 4px",
        lineHeight: 1,
        letterSpacing: -2,
        fontSize: 14,
        color: "var(--gray-10)",
      }}
    >
      ⋮⋮
    </span>
  );

  return children({ setNodeRef, style, handle, isDragging });
}
