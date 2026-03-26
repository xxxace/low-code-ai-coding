export function getWeekNumber(date: string) {
  const inputDate = new Date(date)
  const startOfYear = new Date(inputDate.getFullYear(), 0, 1)

  // 获取1月1日是星期几，0代表星期天，1代表星期一，依此类推
  const startDay = startOfYear.getDay()

  // 计算该日期是今年的第几天
  const dayOfYear =
    Math.floor((inputDate.getTime() - startOfYear.getTime()) / (1000 * 3600 * 24)) + 1

  // 根据1月1日是星期几来调整偏差
  // 如果1月1号是星期日，周数计算应该加6天；如果是星期六，加5天，以此类推
  const adjust = startDay === 0 ? 6 : startDay - 1

  // 调整dayOfYear并计算周数
  const weekNumber = Math.ceil((dayOfYear + adjust) / 7)

  // 返回年份和周数（确保周数为两位数）
  return Number(`${inputDate.getFullYear()}${weekNumber.toString().padStart(2, '0')}`) || undefined
}

export function getWeekRange(yearWeek: number) {
  const year = Math.floor(yearWeek / 100)
  const week = yearWeek % 100

  // 计算该年份1月1日是星期几
  const firstDayOfYear = new Date(year, 0, 1)
  const dayOfWeek = firstDayOfYear.getDay()

  // ISO 8601中，周一为一周的第一天
  const ISO_WEEK_START = 1

  // 计算第一周的第一天（可能是上一年的最后几天）
  let startOfFirstWeek
  if (dayOfWeek <= 4) {
    // 1月1日是周一到周四
    startOfFirstWeek = new Date(
      firstDayOfYear.getTime() - (dayOfWeek - ISO_WEEK_START) * 24 * 60 * 60 * 1000
    )
  } else {
    // 1月1日是周五到周日
    startOfFirstWeek = new Date(
      firstDayOfYear.getTime() + (7 - dayOfWeek + ISO_WEEK_START) * 24 * 60 * 60 * 1000
    )
  }

  // 计算指定周的开始日期
  const weekStart = new Date(startOfFirstWeek.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000)

  // 计算指定周的结束日期
  const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)

  // 格式化输出
  const format = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`

  return {
    begin: format(weekStart),
    end: format(weekEnd)
  }
}
