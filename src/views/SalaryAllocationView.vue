<script setup lang="ts">
import SalaryAllocationForm from '../features/salary-allocation/SalaryAllocationForm.vue'
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">薪資配置</h1>
      <p class="text-sm text-slate-500 mt-1">管理您每個月的薪資收入與各項花費配置。</p>
    </div>
    
    <div class="max-w-3xl mx-auto">
      <SalaryAllocationForm />
    </div>
  </div>
</template>
