import { describe, expect, it } from 'vitest'
import {
  base64ToText,
  binaryToText,
  convertCase,
  findAndReplace,
  getTextStats,
  repeatText,
  slugToText,
  slugify,
  sortLines,
  textToBase64,
  textToBinary,
  urlDecode,
  urlEncode,
} from './textTools'

describe('textTools', () => {
  it('slugifies unicode, punctuation and whitespace', () => {
    expect(slugify("  Héllo, World! Let's build  ")).toBe('hello-world-lets-build')
    expect(slugify('A & B')).toBe('a-and-b')
  })

  it('turns slugs back into readable text', () => {
    expect(slugToText('my-awesome_blog-post')).toBe('My Awesome Blog Post')
    expect(slugToText('my-awesome-post', false)).toBe('my awesome post')
  })

  it('round-trips UTF-8 text through binary and base64', () => {
    const value = 'ONEV 🚀 café'
    expect(binaryToText(textToBinary(value))).toBe(value)
    expect(base64ToText(textToBase64(value))).toBe(value)
    expect(() => binaryToText('0101')).toThrow(/multiple of 8/)
  })

  it('round-trips URL encoding', () => {
    expect(urlDecode(urlEncode('a b&c=🚀'))).toBe('a b&c=🚀')
  })

  it('converts between common cases', () => {
    const input = 'the quick brown fox'
    expect(convertCase(input, 'camel')).toBe('theQuickBrownFox')
    expect(convertCase(input, 'pascal')).toBe('TheQuickBrownFox')
    expect(convertCase(input, 'snake')).toBe('the_quick_brown_fox')
    expect(convertCase(input, 'kebab')).toBe('the-quick-brown-fox')
    expect(convertCase(input, 'constant')).toBe('THE_QUICK_BROWN_FOX')
  })

  it('finds and replaces with options', () => {
    expect(findAndReplace('one ONE one', 'one', 'two')).toEqual({ result: 'two two two', count: 3 })
    expect(findAndReplace('one ONE one', 'one', 'two', { caseSensitive: true })).toEqual({
      result: 'two ONE two',
      count: 2,
    })
    expect(findAndReplace('cat category', 'cat', 'dog', { wholeWord: true }).result).toBe('dog category')
    expect(findAndReplace('abc123', '\\d+', '#', { useRegex: true }).result).toBe('abc#')
    expect(findAndReplace('abc', '[', 'x', { useRegex: true }).error).toBeTruthy()
  })

  it('counts text and repeats safely', () => {
    const stats = getTextStats('Hello world. One more sentence.')
    expect(stats.words).toBe(5)
    expect(stats.sentences).toBe(2)
    expect(stats.charactersNoSpaces).toBeLessThan(stats.characters)
    expect(repeatText('a', 3, '-')).toBe('a-a-a')
    expect(repeatText('a', 0)).toBe('')
  })

  it('sorts and de-duplicates lines', () => {
    expect(sortLines('b\na\nb')).toBe('a\nb\nb')
    expect(sortLines('b\na\nb', 'desc', true)).toBe('b\na')
  })
})
