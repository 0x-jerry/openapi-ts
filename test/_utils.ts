import type { Volume } from 'memfs/lib/volume'
import path from 'node:path'
import { expect } from 'vitest'

export function expectMatchOutput(vfs: Volume, outputDir: string) {
  const content = vfs.toJSON()

  const files = Object.entries(content)

  for (const [filePath, fileContent] of files) {
    expect(fileContent).toMatchFileSnapshot(path.join(outputDir, filePath))
  }
}
