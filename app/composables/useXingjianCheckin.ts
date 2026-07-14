export function useXingjianCheckin() {
  const locating = ref(false)

  function getBrowserLocation(): Promise<{ longitude: number, latitude: number } | null> {
    if (!import.meta.client || !navigator.geolocation) return Promise.resolve(null)
    locating.value = true
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        position => resolve({ longitude: position.coords.longitude, latitude: position.coords.latitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
      )
    }).finally(() => { locating.value = false })
  }

  async function submitXingjianCheckin(pointId: number) {
    const location = await getBrowserLocation()
    return $fetch<any>('/api/checkins', { method: 'POST', body: { pointId, ...location } })
  }

  return { locating, submitXingjianCheckin }
}
