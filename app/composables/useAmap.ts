let amapPromise: Promise<any> | null = null;

const DEFAULT_AMAP_KEY = "75e7e73e950401aa1362427451d2cc69";
const DEFAULT_AMAP_SECURITY_CODE = "fb4f4ae4a9bcc783ca84ac4b12c93571";

export interface XingjianMapLocation {
  longitude: number;
  latitude: number;
  accuracy?: number;
}

export interface XingjianMapPoint {
  id: number;
  name: string;
  cityName?: string;
  category?: string;
  address?: string;
  longitude: number;
  latitude: number;
  checkinRadius: number;
  pointsReward?: number;
  checkedToday?: boolean;
  status?: string;
}

/** 逆地理解析后的地点信息，供城市/点位表单自动回填 */
export interface XingjianMapPlace {
  address: string;
  province: string;
  city: string;
  district: string;
  adcode: string;
  citycode: string;
}

/** 正向地理编码结果，含坐标与省市信息 */
export interface XingjianGeocodeResult extends XingjianMapPlace {
  longitude: number;
  latitude: number;
}

/** 从高德逆地理结果提取可回填的省市信息 */
export function parseAmapRegeocode(regeocode: any): XingjianMapPlace {
  const component = regeocode?.addressComponent || {};
  const province = String(component.province || "");
  const rawCity = component.city;
  const cityFromComponent = Array.isArray(rawCity)
    ? ""
    : String(rawCity || "").trim();
  // 直辖市 city 常为空，此时用省级名称作为城市名
  const city =
    cityFromComponent ||
    (province.endsWith("市") ? province : String(component.district || "")) ||
    province;
  return {
    address: String(regeocode?.formattedAddress || ""),
    province,
    city: city.replace(/市$/, "") || city,
    district: String(component.district || ""),
    adcode: String(component.adcode || ""),
    citycode: String(component.citycode || ""),
  };
}

export function calculateMapDistance(
  from: Pick<XingjianMapLocation, "longitude" | "latitude">,
  to: Pick<XingjianMapLocation, "longitude" | "latitude">,
) {
  const radians = (degree: number) => (degree * Math.PI) / 180;
  const earthRadius = 6371000;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(
    earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)),
  );
}

export function formatMapDistance(distance?: number | null) {
  if (distance === undefined || distance === null || !Number.isFinite(distance))
    return "--";
  if (distance < 1000) return `${Math.round(distance)} m`;
  return `${(distance / 1000).toFixed(distance >= 10000 ? 1 : 2)} km`;
}

/** 从高德 location 字段解析经纬度 */
function parseAmapLocation(location: any): { longitude: number; latitude: number } | null {
  if (!location) return null;
  if (typeof location.getLng === "function" && typeof location.getLat === "function") {
    return {
      longitude: Number(location.getLng()),
      latitude: Number(location.getLat()),
    };
  }
  if (typeof location === "string") {
    const [longitude, latitude] = location.split(",").map(Number);
    if (Number.isFinite(longitude) && Number.isFinite(latitude)) {
      return { longitude, latitude };
    }
  }
  const longitude = Number(location.lng ?? location.longitude);
  const latitude = Number(location.lat ?? location.latitude);
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  return { longitude, latitude };
}

export function useAmap() {
  const config = useRuntimeConfig();

  async function loadAmap() {
    if (!import.meta.client) throw new Error("地图只能在浏览器中加载");
    if (amapPromise) return amapPromise;

    const publicConfig = config.public as Record<string, any>;
    const key = publicConfig.amapKey || DEFAULT_AMAP_KEY;
    const securityJsCode =
      publicConfig.amapSecurityCode || DEFAULT_AMAP_SECURITY_CODE;
    window._AMapSecurityConfig = { securityJsCode };

    amapPromise = import("@amap/amap-jsapi-loader")
      .then(({ default: AMapLoader }) =>
        AMapLoader.load({
          key,
          version: "2.0",
          plugins: ["AMap.Geocoder", "AMap.ToolBar", "AMap.Scale"],
        }),
      )
      .catch((error) => {
        amapPromise = null;
        throw error;
      });

    return amapPromise;
  }

  /** 按城市名称正向地理编码，回填省份与中心坐标 */
  async function geocodeCityByName(
    keyword: string,
  ): Promise<XingjianGeocodeResult | null> {
    const trimmed = keyword.trim();
    if (!trimmed) return null;

    const AMap = await loadAmap();
    const geocoder = new AMap.Geocoder({ city: "全国" });
    const queries = [trimmed];
    // 简称补全市后缀，提高「杭州」这类检索命中率
    if (!/[省市州县区]$/.test(trimmed)) queries.push(`${trimmed}市`);

    for (const query of queries) {
      const result = await new Promise<XingjianGeocodeResult | null>(
        (resolve) => {
          geocoder.getLocation(query, (status: string, data: any) => {
            if (status !== "complete" || !data?.geocodes?.length) {
              resolve(null);
              return;
            }
            const item = data.geocodes[0];
            const coords = parseAmapLocation(item.location);
            if (!coords) {
              resolve(null);
              return;
            }
            const place = parseAmapRegeocode({
              formattedAddress: item.formattedAddress,
              addressComponent: item.addressComponent,
            });
            resolve({
              ...place,
              longitude: Number(coords.longitude.toFixed(6)),
              latitude: Number(coords.latitude.toFixed(6)),
            });
          });
        },
      );
      if (result) return result;
    }

    return null;
  }

  return { loadAmap, geocodeCityByName };
}
