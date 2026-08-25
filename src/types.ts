import type { Component } from 'vue'

export interface Tab {
  id: string
  label: string
  icon: string
  component: Component
}
