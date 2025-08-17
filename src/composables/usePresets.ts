export function usePresets<T = any>(key = 'tts-presets') {
  const list = ref<{ name: string; data: T }[]>([])
  onMounted(() => {
    try {
      list.value = JSON.parse(localStorage.getItem(key) || '[]')
    } catch {}
  })
  function save(name: string, data: T) {
    const i = list.value.findIndex((p) => p.name === name)
    if (i >= 0) list.value[i].data = data
    else list.value.push({ name, data })
    localStorage.setItem(key, JSON.stringify(list.value))
  }
  function remove(name: string) {
    list.value = list.value.filter((p) => p.name !== name)
    localStorage.setItem(key, JSON.stringify(list.value))
  }
  return { list, save, remove }
}
