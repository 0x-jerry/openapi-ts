/**
 *
 * convert a url path to a valid interface name.
 *
 * @param path url path
 * @returns
 */
export function convertPathToName(path: string) {
  return path
    .split('/')
    .map((n) => {
      return n
        .split('-')
        .map((l) => {
          l = l
            // remove path parentheses
            .replace(/[{}]/g, '')
            // resolve invalid character like `*{}`
            .replace(/[^a-z0-9]/gi, '_')
            .trim()

          return l && l[0].toUpperCase() + l.slice(1)
        })
        .filter(Boolean)
        .join('')
    })
    .join('')
}
