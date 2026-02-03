import type {
  PackageManagerAdapter,
  PackageStats,
  HistoricalDownloads,
  PackageInfo,
} from './types'

const DOCKER_HUB_API = 'https://hub.docker.com/v2/repositories'

interface DockerImageRef {
  namespace: string
  repository: string
  tag?: string
}

function parseDockerImage(input: string): DockerImageRef | null {
  const trimmed = input.trim()

  try {
    const url = new URL(trimmed)
    if (url.hostname.includes('hub.docker.com')) {
      const parts = url.pathname.split('/').filter(Boolean)
      if (parts[0] === 'r' && parts.length >= 3) {
        const namespace = parts[1]
        const repository = parts[2]
        const tag = url.searchParams.get('name') || undefined
        return { namespace, repository, tag }
      }
    }
  } catch {
    // Not a URL, fall through to plain parsing.
  }

  const withoutDigest = trimmed.split('@')[0]
  const [namePart, tag] = withoutDigest.split(':')
  if (!namePart) return null

  const segments = namePart.split('/').filter(Boolean)
  if (segments.length === 1) {
    return { namespace: 'library', repository: segments[0], tag }
  }
  if (segments.length === 2) {
    return { namespace: segments[0], repository: segments[1], tag }
  }
  return null
}

export class DockerHubAdapter implements PackageManagerAdapter {
  type = 'docker' as const

  async getPackageInfo(packageName: string): Promise<PackageInfo | null> {
    const ref = parseDockerImage(packageName)
    if (!ref) return null

    const response = await fetch(`${DOCKER_HUB_API}/${ref.namespace}/${ref.repository}/`)
    if (!response.ok) return null
    const data = await response.json()

    return {
      name: `${ref.namespace}/${ref.repository}`,
      description: data?.description || undefined,
      homepage: data?.repo_url || undefined,
      repository: data?.github_url || undefined,
    }
  }

  async getCurrentStats(packageName: string): Promise<PackageStats | null> {
    const ref = parseDockerImage(packageName)
    if (!ref) return null

    const response = await fetch(
      ref.tag
        ? `${DOCKER_HUB_API}/${ref.namespace}/${ref.repository}/tags/${ref.tag}/`
        : `${DOCKER_HUB_API}/${ref.namespace}/${ref.repository}/`
    )

    if (!response.ok) return null
    const data = await response.json()
    const pullCount = data?.pull_count
    if (typeof pullCount !== 'number') return null

    return {
      downloadsDay: 0,
      downloadsWeek: 0,
      downloadsMonth: 0,
      downloadsYear: 0,
      rawData: {
        pull_count: pullCount,
        tag: ref.tag,
      },
    }
  }

  async getHistoricalDownloads(): Promise<HistoricalDownloads[]> {
    return []
  }

  validatePackageUrl(url: string): boolean {
    return parseDockerImage(url) !== null
  }

  extractPackageName(url: string): string | null {
    const ref = parseDockerImage(url)
    if (!ref) return null
    return `${ref.namespace}/${ref.repository}${ref.tag ? `:${ref.tag}` : ''}`
  }
}

export const dockerAdapter = new DockerHubAdapter()
