// utils/dateHelper.js

function pad(n) { return n < 10 ? '0' + n : '' + n; }

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function format(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function firstDayOfMonth(year, month) {
  return new Date(year, month - 1, 1);
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * 返回某月的 6 行 x 7 列日历格数据(含上月末尾和下月开头填充)
 * 周一为一周开始
 */
function monthGrid(year, month) {
  const first = firstDayOfMonth(year, month);
  const firstWeekday = (first.getDay() + 6) % 7; // 转成周一=0
  const days = daysInMonth(year, month);
  const prevDays = daysInMonth(month === 1 ? year - 1 : year, month === 1 ? 12 : month - 1);

  const cells = [];
  // 上月末尾
  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({
      day: prevDays - i,
      month: month === 1 ? 12 : month - 1,
      year: month === 1 ? year - 1 : year,
      isCurMonth: false
    });
  }
  // 本月
  for (let i = 1; i <= days; i++) {
    cells.push({ day: i, month, year, isCurMonth: true });
  }
  // 下月开头
  while (cells.length < 42) {
    const last = cells[cells.length - 1];
    const nextDay = last.isCurMonth ? last.day + 1 : last.day + 1;
    const nextMonth = last.isCurMonth ? (month === 12 ? 1 : month + 1) : last.month;
    const nextYear = last.isCurMonth ? (month === 12 ? year + 1 : year) : last.year;
    if (last.isCurMonth && last.day === days) {
      cells.push({ day: 1, month: nextMonth, year: nextYear, isCurMonth: false });
    } else if (!last.isCurMonth) {
      cells.push({ day: last.day + 1, month: last.month, year: last.year, isCurMonth: false });
    }
  }
  // 给每个 cell 算日期字符串
  cells.forEach(c => {
    c.dateStr = `${c.year}-${pad(c.month)}-${pad(c.day)}`;
  });
  return cells;
}

/**
 * 返回日期对应的星期标签("一", "二"...)
 */
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

module.exports = {
  today,
  format,
  firstDayOfMonth,
  daysInMonth,
  monthGrid,
  WEEKDAY_LABELS
};
