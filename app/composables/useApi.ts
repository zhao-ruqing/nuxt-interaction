export function useApi() {
  async function post<T = any>(url: string, body: any): Promise<T> {
    const { data } = await useFetch(url, { method: 'POST', body })
    return data.value as T
  }

  async function get<T = any>(url: string): Promise<T> {
    const { data } = await useFetch(url)
    return data.value as T
  }

  return { post, get }
}
