// 时间格式化工具函数
// 转换为东八区(UTC+8)时间

/**
 * 格式化日期时间为东八区时间
 * @param dateString 日期字符串或Date对象
 * @param format 格式化格式，默认 'YYYY-MM-DD HH:mm:ss
 */
export function formatToUTC8(dateString: string | Date, format = 'YYYY-MM-DD HH:mm:ss'): string {
  if (!dateString) return '';
  
  let date: Date;
  
  if (typeof dateString === 'string') {
    date = new Date(dateString);
  } else {
    date = dateString;
  }
  
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // 转换为东八区时间
  const utc8Date = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  
  const year = utc8Date.getUTCFullYear();
  const month = String(utc8Date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(utc8Date.getUTCDate()).padStart(2, '0');
  const hours = String(utc8Date.getUTCHours()).padStart(2, '0');
  const minutes = String(utc8Date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(utc8Date.getUTCSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 获取当前时间的东八区时间
 */
export function getNowUTC8(): Date {
  const now = new Date();
  return new Date(now.getTime() + 8 * 60 * 60 * 1000);
}
