import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export const useSortableItem = (id: string) => {
  const sortable = useSortable({ id })
  return {
    setNodeRef: sortable.setNodeRef,
    style: {
      transform: CSS.Translate.toString(sortable.transform),
      transition: sortable.isDragging ? undefined : sortable.transition,
      opacity: sortable.isDragging ? 0.5 : 1,
    },
    handleProps: {
      ref: sortable.setActivatorNodeRef,
      ...sortable.attributes,
      ...sortable.listeners,
    },
  }
}
