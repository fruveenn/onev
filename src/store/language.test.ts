import { describe, expect, it } from 'vitest'
import { CATEGORIES } from '../registry/categories'
import { TOOLS } from '../registry/tools'
import { INDONESIAN, translate } from './language'

describe('translate', () => {
  it('defaults to Indonesian text while English keeps the source', () => {
    const source = 'Encrypt JS, TS, Python and other source with a password or recovery key.'

    expect(translate(source, 'id')).toBe(INDONESIAN[source])
    expect(translate(source, 'en')).toBe(source)
  })

  it('interpolates values in both languages', () => {
    expect(translate('No tools matched “{query}”', 'en', { query: 'abc' })).toBe(
      'No tools matched “abc”',
    )
    expect(translate('No tools matched “{query}”', 'id', { query: 'abc' })).toContain('abc')
  })

  it('has an Indonesian description for every tool and category', () => {
    const missing = [...TOOLS.map((tool) => tool.description), ...CATEGORIES.map((category) => category.description)].filter(
      (description) => !INDONESIAN[description],
    )

    expect(missing).toEqual([])
  })
})
