import {
  ArrowRightLeft,
  Braces,
  Calculator,
  Image as ImageIcon,
  Palette,
  ShieldCheck,
  Sparkles,
  Type,
  Wrench,
} from 'lucide-react'
import type { Category, CategoryId } from './types'

export const CATEGORIES: Category[] = [
  {
    id: 'generators',
    name: 'Generators',
    description: 'Passwords, numbers, gradients and sample data',
    icon: Sparkles,
  },
  {
    id: 'formatters',
    name: 'Formatters',
    description: 'Validate, prettify and minify source code',
    icon: Braces,
  },
  {
    id: 'text',
    name: 'Text',
    description: 'Transform, encode and analyse text',
    icon: Type,
  },
  {
    id: 'calculators',
    name: 'Calculators',
    description: 'Everyday maths without the friction',
    icon: Calculator,
  },
  {
    id: 'converters',
    name: 'Converters',
    description: 'Units, currencies and data sizes',
    icon: ArrowRightLeft,
  },
  {
    id: 'color',
    name: 'Color',
    description: 'Convert, harmonise and check contrast',
    icon: Palette,
  },
  {
    id: 'image',
    name: 'Image',
    description: 'Resize, crop, convert and compress locally',
    icon: ImageIcon,
  },
  {
    id: 'security',
    name: 'Security',
    description: 'Encrypt and decrypt text locally',
    icon: ShieldCheck,
  },
  {
    id: 'utilities',
    name: 'Utilities',
    description: 'Small tools for everyday workflows',
    icon: Wrench,
  },
]

export function getCategory(id: CategoryId): Category {
  const category = CATEGORIES.find((item) => item.id === id)
  if (!category) throw new Error(`Unknown category: ${id}`)
  return category
}

export function isCategoryId(value: string | undefined): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value)
}
