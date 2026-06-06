export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getDurationMinutes(startStr: string, endStr?: string): number {
  const start = new Date(startStr).getTime();
  const end = endStr ? new Date(endStr).getTime() : Date.now();
  return Math.floor((end - start) / 60000);
}

export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    normal: '正常',
    warning: '预警',
    alarm: '超标',
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消',
  };
  return map[status] || status;
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    normal: 'text-green-700 bg-green-50 border-green-200',
    warning: 'text-amber-700 bg-amber-50 border-amber-200',
    alarm: 'text-red-700 bg-red-50 border-red-200',
    pending: 'text-red-700 bg-red-50 border-red-200',
    processing: 'text-amber-700 bg-amber-50 border-amber-200',
    completed: 'text-green-700 bg-green-50 border-green-200',
    cancelled: 'text-gray-600 bg-gray-50 border-gray-200',
  };
  return map[status] || 'text-gray-600 bg-gray-50 border-gray-200';
}

export function getStatusBorderColor(status: string): string {
  const map: Record<string, string> = {
    normal: 'border-l-green-600',
    warning: 'border-l-amber-500',
    alarm: 'border-l-red-600',
    pending: 'border-l-red-600',
    processing: 'border-l-amber-500',
    completed: 'border-l-green-600',
    cancelled: 'border-l-gray-400',
  };
  return map[status] || 'border-l-gray-400';
}
