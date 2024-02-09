import { mkdirSync, writeFileSync } from 'fs'
import json from './schema/v2.json'
import { generate, parseOpenAPI } from '../src'
import { type IFs } from 'memfs'
import path from 'path'
import { spawnSync } from 'child_process'

const result = await parseOpenAPI(json)

const vfs = await generate(result)

writeToDisk(vfs, 'temp/generated')

const biome = path.resolve('node_modules/@biomejs/biome/bin/biome')

spawnSync(biome, 'format --write temp/generated'.split(' '), { stdio: 'pipe' })

function writeToDisk(vfs: IFs, output: string) {
  const out = path.resolve(output)

  return _writeToDisk(vfs, '/', out)

  function _writeToDisk(vfs: IFs, input: string, output: string) {
    const files = vfs.readdirSync(input)

    for (const file of files) {
      const _input = path.join(input, file.toString())
      const _out = path.join(output, file.toString())

      const isDirectory = vfs.statSync(_input).isDirectory()

      if (isDirectory) {
        _writeToDisk(vfs, _input, _out)
      } else {
        // write to disk
        mkdirSync(output, { recursive: true })

        writeFileSync(_out, vfs.readFileSync(_input))
      }
    }
  }
}
