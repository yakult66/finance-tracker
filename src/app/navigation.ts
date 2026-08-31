import { markRaw } from 'vue'
import type { Tab } from '../types'

import SalaryAllocationView from '../views/SalaryAllocationView.vue'
import AssetAllocationView from '../views/AssetAllocationView.vue'
import PocketMoneyView from '../views/PocketMoneyView.vue'

export const tabs: Tab[] = [
  {
    id: 'salary-allocation',
    label: '當月薪資配置',
    icon: 'pi-wallet',
    component: markRaw(SalaryAllocationView)
  },
  {
    id: 'asset-allocation',
    label: '資產配置',
    icon: 'pi-chart-pie',
    component: markRaw(AssetAllocationView)
  },
  {
    id: 'pocket-money',
    label: '零用金',
    icon: 'pi-sparkles',
    component: markRaw(PocketMoneyView)
  }
]
