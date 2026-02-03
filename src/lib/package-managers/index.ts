import type { PackageManagerType } from '@/types/database'
import type { PackageManagerAdapter } from './types'
import { npmAdapter } from './npm-adapter'
import { dockerAdapter } from './docker-adapter'

const adapters: Record<PackageManagerType, PackageManagerAdapter> = {
  npm: npmAdapter,
  docker: dockerAdapter,
  nuget: npmAdapter, // Placeholder - will be implemented later
  pypi: npmAdapter,  // Placeholder - will be implemented later
  maven: npmAdapter, // Placeholder - will be implemented later
  cargo: npmAdapter, // Placeholder - will be implemented later
}

export function getPackageManagerAdapter(type: PackageManagerType): PackageManagerAdapter {
  const adapter = adapters[type]
  if (!adapter) {
    throw new Error(`Unsupported package manager: ${type}`)
  }
  return adapter
}

export * from './types'
export { npmAdapter } from './npm-adapter'
export { dockerAdapter } from './docker-adapter'
