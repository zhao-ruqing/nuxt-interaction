export interface XingjianBrowserLocation {
  longitude: number
  latitude: number
  accuracy: number
  timestamp?: number
}

export function useXingjianCheckin() {
  const locating = ref(false)
  const currentLocation = ref<XingjianBrowserLocation | null>(null)
  const locationError = ref('')

  function locate(): Promise<XingjianBrowserLocation> {
    if (!import.meta.client || !navigator.geolocation) {
      const error = new Error('当前浏览器不支持定位')
      locationError.value = error.message
      return Promise.reject(error)
    }

    locating.value = true
    locationError.value = ''
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          }
          currentLocation.value = location
          resolve(location)
        },
        (error) => {
          const messages: Record<number, string> = {
            1: '定位权限被拒绝，请在浏览器设置中允许访问位置',
            2: '暂时无法获取当前位置，请检查系统定位服务',
            3: '获取位置超时，请移动到信号较好的区域重试',
          }
          const message = messages[error.code] || '获取当前位置失败'
          locationError.value = message
          reject(new Error(message))
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      )
    }).finally(() => { locating.value = false })
  }

  async function submitXingjianCheckin(pointId: number) {
    const location = await locate()
    return $fetch<any>('/api/checkins', { method: 'POST', body: { pointId, ...location } })
  }

  function clearLocation() {
    currentLocation.value = null
    locationError.value = ''
  }

  return {
    locating,
    currentLocation,
    locationError,
    locate,
    clearLocation,
    submitXingjianCheckin,
  }
}
