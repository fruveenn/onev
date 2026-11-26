import type { LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'

export type CategoryId =
  | 'generators'
  | 'formatters'
  | 'text'
  | 'calculators'
  | 'converters'
  | 'color'
  | 'image'
  | 'security'
  | 'utilities'

export interface Category {
  id: CategoryId
  name: string
  description: string
  icon: LucideIcon
}

export interface ToolMeta {
  id: string
  name: string
  description: string
  category: CategoryId
  icon: LucideIcon
  keywords: string[]
  component: ComponentType<any>
  props?: Record<string, unknown>
  featured?: boolean
}

export interface ToolGroup {
  category: Category
  tools: ToolMeta[]
}
