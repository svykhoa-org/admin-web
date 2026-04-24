export interface ExtraActionProps {
  items: React.ReactNode[]
}

export const ExtraAction = ({ items }: ExtraActionProps) => {
  if (items.length === 0) return null
  return <>{items}</>
}
