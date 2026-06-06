import { useState, useEffect, useMemo } from 'react';
import { Search, Calendar, MapPin, User, Clock, Droplets, ChevronDown, X, TrendingUp, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts';
import { useAppStore } from '../store/appStore';
import { formatDateTime, getStatusText, getStatusColor, formatTime, getFieldColor } from '../utils/format';
import type { WorkOrder, WorkOrderStatus, SensorData } from '../../shared/types';

interface MiniTrendChartProps {
  data: SensorData[];
  threshold: number;
  triggeredAt: string;
}

function MiniTrendChart({ data, threshold, triggeredAt }: MiniTrendChartProps) {
  const color = getFieldColor(0);

  const chartData = useMemo(() => {
    return data.map(d => ({
      time: formatTime(d.timestamp),
      timestamp: d.timestamp,
      humidity: d.humidity,
      isOver: d.humidity > threshold,
      isTriggerPoint: d.timestamp >= triggeredAt,
    }));
  }, [data, threshold, triggeredAt]);

  const overData = useMemo(() => {
    return chartData.map(d => ({
      ...d,
      overValue: d.isOver ? d.humidity : null,
    }));
  }, [chartData]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number }>; label?: string }) => {
    if (!active || !payload || payload.length === 0) return null;
    const entry = payload[0];
    const point = chartData.find(d => d.time === label);
    const isOver = point?.isOver;

    return (
      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg text-sm">
        <p className="text-gray-500">{label}</p>
        <p className={`font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
          {entry.value.toFixed(1)}%
          {isOver && ' ⚠ 超标'}
        </p>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 text-sm">
        暂无趋势数据
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <TrendingUp className="w-4 h-4 text-field" />
          <span>触发前后2小时湿度趋势</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color.main }} />
            <span>湿度</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500" style={{ borderTop: '2px dashed #ef4444' }} />
            <span>上限 {threshold}%</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-200" />
            <span>超标时段</span>
          </div>
        </div>
      </div>
      <div className="h-40 bg-gray-50 rounded-lg p-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={overData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="overGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={10}
              domain={[40, 100]}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={threshold}
              stroke="#ef4444"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="overValue"
              fill="url(#overGradient)"
              stroke="none"
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="humidity"
              stroke={color.main}
              strokeWidth={2}
              dot={(props: { cx: number; cy: number; payload: { isOver: boolean; isTriggerPoint: boolean } }) => {
                const { cx, cy, payload } = props;
                if (payload.isOver) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={4}
                      fill="#ef4444"
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  );
                }
                if (payload.isTriggerPoint) {
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={5}
                      fill={color.main}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }
                return <circle cx={cx} cy={cy} r={2} fill={color.main} />;
              }}
              activeDot={{ r: 6, fill: color.light }}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function WorkHistory() {
  const { workOrders, fields, fetchWorkOrders, fetchSensorDataByTimeRange, loading } = useAppStore();
  const [filter, setFilter] = useState<WorkOrderStatus | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchField, setSearchField] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [trendData, setTrendData] = useState<SensorData[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);

  useEffect(() => {
    if (workOrders.length === 0) {
      loadOrders();
    }
  }, [workOrders.length]);

  const loadOrders = async () => {
    if (startDate && endDate) {
      await fetchWorkOrders(filter === 'all' ? undefined : filter, startDate, endDate);
    } else {
      await fetchWorkOrders(filter === 'all' ? undefined : filter);
    }
  };

  const handleSelectOrder = async (order: WorkOrder) => {
    setSelectedOrder(order);
    setTrendData([]);
    setTrendLoading(true);

    try {
      const triggerTime = new Date(order.triggeredAt);
      const startTime = new Date(triggerTime.getTime() - 2 * 60 * 60 * 1000).toISOString();
      const endTime = new Date(triggerTime.getTime() + 2 * 60 * 60 * 1000).toISOString();

      const data = await fetchSensorDataByTimeRange(order.fieldId, startTime, endTime);
      setTrendData(data);
    } catch (error) {
      console.error('Failed to fetch trend data:', error);
    } finally {
      setTrendLoading(false);
    }
  };

  const filteredOrders = workOrders
    .filter(o => filter === 'all' || o.status === filter)
    .filter(o => !searchField || o.fieldCode.toLowerCase().includes(searchField.toLowerCase()));

  const completedCount = workOrders.filter(o => o.status === 'completed').length;

  const selectedField = useMemo(() => {
    if (!selectedOrder) return null;
    return fields.find(f => f.id === selectedOrder.fieldId);
  }, [selectedOrder, fields]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">历史工单</h1>
          <p className="text-gray-500 mt-1">
            共 {workOrders.length} 条工单，已完成 {completedCount} 条
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Search className="w-4 h-4" />
          筛选
          <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">晒场编号</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchField}
                  onChange={(e) => setSearchField(e.target.value)}
                  placeholder="输入晒场编号"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-field focus:border-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">工单状态</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as WorkOrderStatus | 'all')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-field focus:border-field"
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-field focus:border-field"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-field focus:border-field"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={loadOrders}
              className="px-6 py-2 bg-field text-white rounded-lg hover:bg-field-dark transition-colors"
            >
              查询
            </button>
            <button
              onClick={() => {
                setSearchField('');
                setFilter('all');
                setStartDate('');
                setEndDate('');
                fetchWorkOrders();
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              重置
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-field border-t-transparent"></div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无工单记录</h3>
          <p className="text-gray-500">请调整筛选条件或稍后查看</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">工单号</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">晒场</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">状态</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">湿度</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">处理人</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">创建时间</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-900">#{order.id.toString().padStart(4, '0')}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-field" />
                        <span className="font-medium">{order.fieldCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-900">{order.humidityAvg.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{order.operatorName || '--'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleSelectOrder(order)}
                        className="text-field hover:text-field-dark font-medium text-sm"
                      >
                        详情
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedOrder(null)}></div>
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">工单详情</h3>
              <button onClick={() => setSelectedOrder(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">工单号</div>
                  <div className="font-semibold font-mono">#{selectedOrder.id.toString().padStart(4, '0')}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">晒场编号</div>
                  <div className="font-semibold">{selectedOrder.fieldCode}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">工单状态</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">触发湿度</div>
                  <div className="font-semibold text-red-600">{selectedOrder.humidityAvg.toFixed(1)}%</div>
                </div>
              </div>

              {trendLoading ? (
                <div className="h-40 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-3 border-field border-t-transparent"></div>
                </div>
              ) : (
                <MiniTrendChart
                  data={trendData}
                  threshold={selectedField?.humidityThreshold || 70}
                  triggeredAt={selectedOrder.triggeredAt}
                />
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-amber-800">触发说明</div>
                    <div className="text-sm text-amber-700 mt-1">
                      连续三次检测湿度超过上限 {selectedField?.humidityThreshold || 70}% 后自动开立此工单
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-500">触发时间：</span>
                  <span className="text-gray-900">{formatDateTime(selectedOrder.triggeredAt)}</span>
                </div>
                {selectedOrder.completedAt && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">完成时间：</span>
                    <span className="text-gray-900">{formatDateTime(selectedOrder.completedAt)}</span>
                  </div>
                )}
                {selectedOrder.operatorName && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">处理人：</span>
                    <span className="text-gray-900">{selectedOrder.operatorName}</span>
                  </div>
                )}
                {selectedOrder.workDuration && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">作业时长：</span>
                    <span className="text-gray-900">{selectedOrder.workDuration} 分钟</span>
                  </div>
                )}
              </div>

              {selectedOrder.remark && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">作业备注</div>
                  <div className="bg-gray-50 rounded-lg p-4 text-gray-700">
                    {selectedOrder.remark}
                  </div>
                </div>
              )}

              {selectedOrder.photoUrl && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">作业照片</div>
                  <img
                    src={selectedOrder.photoUrl}
                    alt="作业照片"
                    className="rounded-lg max-h-64 object-contain bg-gray-50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
