import path from 'node:path'
import type { Volume } from 'memfs/lib/volume'
import { expect } from 'vitest'

export async function expectMatchOutput(vfs: Volume, outputDir: string) {
  const content = vfs.toJSON()

  const files = Object.entries(content)

  for (const [filePath, fileContent] of files) {
    await expect(fileContent).toMatchFileSnapshot(path.join(outputDir, filePath))
  }
}
