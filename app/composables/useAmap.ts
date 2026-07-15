let amapPromise: Promise<any> | null = null

const DEFAULT_AMAP_KEY = '75e7e73e950401aa1362427451d2cc69'
const DEFAULT_AMAP_SECURITY_CODE = 'fb4f4ae4a9bcc783ca84ac4b12c93571'

export interface XingjianMapLocation {
  longitude: number
  latitude: number
  accuracy?: number
}

export interface XingjianMapPoint {
  id: number
  name: string
  cityName?: string
  category?: string
  address?: string
  longitude: number
  latitude: number
  checkinRadius: number
  pointsReward?: number
  checkedToday?: boolean
  status?: string
}

export function calculateMapDistance(
  from: Pick<XingjianMapLocation, 'longitude' | 'latitude'>,
  to: Pick<XingjianMapLocation, 'longitude' | 'latitude'>,
) {
  const radians = (degree: number) => degree * Math.PI / 180
  const earthRadius = 6371000
  const latitudeDelta = radians(to.latitude - from.latitude)
  const longitudeDelta = radians(to.longitude - from.longitude)
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2
  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)))
}

export function formatMapDistance(distance?: number | null) {
  if (distance === undefined || distance === null || !Number.isFinite(distance)) return '--'
  if (distance < 1000) return `${Math.round(distance)} m`
  return `${(distance / 1000).toFixed(distance >= 10000 ? 1 : 2)} km`
}

export function useAmap() {
  const config = useRuntimeConfig()

  async function loadAmap() {
    if (!import.meta.client) throw new Error('地图只能在浏览器中加载')
    if (amapPromise) return amapPromise

    const publicConfig = config.public as Record<string, any>
    const key = publicConfig.amapKey || DEFAULT_AMAP_KEY
    const securityJsCode = publicConfig.amapSecurityCode || DEFAULT_AMAP_SECURITY_CODE
    window._AMapSecurityConfig = { securityJsCode }

    amapPromise = import('@amap/amap-jsapi-loader')
      .then(({ default: AMapLoader }) => AMapLoader.load({
        key,
        version: '2.0',
        plugins: [
          'AMap.Geocoder',
          'AMap.ToolBar',
          'AMap.Scale',
        ],
      }))
      .catch((error) => {
        amapPromise = null
        throw error
      })

    return amapPromise
  }

  return { loadAmap }
}
