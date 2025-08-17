export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('autosize', {
    getSSRProps() {
      return {}
    },
    mounted(el: HTMLTextAreaElement) {
      const fit = () => {
        el.style.height = 'auto'
        el.style.height = el.scrollHeight + 'px'
      }
      el.addEventListener('input', fit)
      requestAnimationFrame(fit)
    },
    updated(el: HTMLTextAreaElement) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    },
  })
})
