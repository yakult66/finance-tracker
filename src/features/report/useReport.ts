import { useCashFlow } from '../cash-flow/useCashFlow'
import { useFixedExpenses } from '../fixed-expense/useFixedExpenses'
import { useAllowance } from '../allowance/useAllowance'
import { useFirstGoal } from '../first-goal/useFirstGoal'

// 報表是唯一需要橫跨所有 feature 的地方，
// 但它只讀各 feature 對外的介面，不碰它們的儲存細節。

// CSV 欄位跳脫：含逗號、引號、換行時要用雙引號包起來
function cell(value: unknown): string {
  const s = value === null || value === undefined ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const rows = (list: unknown[][]): string =>
  list.map((r) => (r as unknown[]).map(cell).join(',')).join('\n')

export function useReport() {
  const cashFlow = useCashFlow()
  const fixed = useFixedExpenses()
  const allowance = useAllowance()
  const goal = useFirstGoal()

  // 單一月份、涵蓋所有功能的標準報表
  function monthReportRows(month: string): unknown[][] {
    const record = cashFlow.findByMonth(month)
    const spending = allowance.itemsOf(month)
    const spentAllowance = allowance.spent(month)

    const out: unknown[][] = [
      ['========================================='],
      [`【標準收支報表 - ${month}月】`],
      ['========================================='],
      ['產生時間', new Date().toLocaleString('zh-TW')],
      []
    ]

    if (record) {
      out.push(['[收入 (Revenues)]'])
      out.push(['月總收入', record.income])
      out.push([])

      out.push(['[支出 (Expenses)]'])
      out.push(['固定費用', record.fixedExpense])
      out.push(['純存錢 / 投資', record.saving])
      out.push(['緊急預備金', record.emergencyFund])
      out.push(['其它基金', record.otherFund])
      out.push(['零用金已花', spentAllowance])
      out.push(['-------------------------'])
      
      const totalExpense = 
        Number(record.fixedExpense || 0) + 
        Number(record.saving || 0) + 
        Number(record.emergencyFund || 0) + 
        Number(record.otherFund || 0) + 
        Number(spentAllowance || 0)
        
      out.push(['總支出 (Total Expenses)', totalExpense])
      out.push([])

      out.push(['[本月淨結餘 (Net Income)]'])
      out.push(['淨結餘', Number(record.income || 0) - totalExpense])
    } else {
      out.push(['（本月無現金流紀錄）'])
    }
    out.push([])
    out.push(['========================================='])
    out.push(['【當月各項規劃與明細】'])
    out.push(['========================================='])
    out.push([])

    out.push(['[固定費用明細]'])
    const breakdown = record?.fixedBreakdown ?? []
    if (breakdown.length) {
      out.push(['項目', '金額'])
      breakdown.forEach((b) => out.push([b.name, b.amount]))
      out.push(['小計', record!.fixedExpense])
    } else {
      out.push(['（此紀錄未留存明細）'])
    }
    out.push([])

    out.push(['[年度重大費用預留]'])
    if (fixed.annualItems.value.length) {
      out.push(['項目', '年度金額', '每月預留', '繳款日'])
      fixed.annualItems.value.forEach((i) =>
        out.push([i.name, i.amount, i.monthly, i.dueDate || '未設定'])
      )
    } else {
      out.push(['（尚無年度項目）'])
    }
    out.push([])

    out.push(['[零用金支出明細]'])
    if (spending.length) {
      out.push(['項目', '金額', '日期', '記錄時間'])
      spending.forEach((i) =>
        out.push([
          i.name,
          i.amount,
          i.date || '',
          i.createdAt ? new Date(i.createdAt).toLocaleString('zh-TW') : ''
        ])
      )
    } else {
      out.push(['（本月無零用金支出）'])
    }
    out.push([])

    out.push(['[第一桶金進度快照]'])
    out.push(['目標金額', goal.goal.value])
    out.push(['總累積資產', goal.totalAssets.value])
    out.push(['距離目標', goal.remainingToGoal.value])
    out.push(['達成率', `${goal.progressPercentage.value}%`])

    return out
  }

  function monthReportCsv(month: string): string {
    return rows(monthReportRows(month))
  }

  // 全部月份併成一張總表，方便丟進試算軟體比較
  function allMonthsCsv(): string {
    const header = [
      '月份',
      '收入',
      '固定費用',
      '存錢',
      '緊急預備金',
      '其它基金',
      '剩餘零用金',
      '零用金已花',
      '零用金餘額'
    ]
    const body = cashFlow.records.value.map((r) => [
      r.month,
      r.income,
      r.fixedExpense,
      r.saving,
      r.emergencyFund,
      r.otherFund,
      r.balance,
      allowance.spent(r.month),
      allowance.left(r.month)
    ])
    return rows([header, ...body])
  }

  // 原始資料備份，可完整還原
  function backupJson(): string {
    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        records: cashFlow.records.value,
        plans: goal.plans.value,
        fixedItems: fixed.fixedItems.value,
        annualItems: fixed.annualItems.value,
        allowanceItems: allowance.allowanceItems.value,
        goal: goal.goal.value
      },
      null,
      2
    )
  }

  function download(filename: string, content: string, type: string): void {
    // Excel 開 CSV 需要 BOM 才不會把中文變亂碼
    const payload = type.startsWith('text/csv') ? `\uFEFF${content}` : content
    const url = URL.createObjectURL(new Blob([payload], { type }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return { monthReportCsv, allMonthsCsv, backupJson, download }
}
