import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import PrimeVue from 'primevue/config'
import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'
import Ripple from 'primevue/ripple'
import { setupPwa } from './shared/usePwa'

const FinancePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '{indigo.50}',
      100: '{indigo.100}',
      200: '{indigo.200}',
      300: '{indigo.300}',
      400: '{indigo.400}',
      500: '{indigo.600}',
      600: '{indigo.700}',
      700: '{indigo.800}',
      800: '{indigo.900}',
      900: '{indigo.900}',
      950: '{indigo.950}'
    }
  }
})

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: FinancePreset,
    options: {
      darkModeSelector: false
    }
  },
  ripple: true
})

app.directive('ripple', Ripple)

app.mount('#app')

// 註冊 Service Worker 並開始監聽安裝／更新事件
setupPwa()
