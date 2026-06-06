import { useState, useEffect } from 'react';
import { Droplets, MapPin, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { useAppStore } from '../store/appStore';
import { api } from '../utils/api';
import { formatTime, getStatusText, getStatusColor } from '../utils/format';
import type { SensorData } from '../../shared/types';

export default function Dashboard() {
  const { fields, loading, lastUpdated, fetchFields } = useAppStore();
  const [selectedField, setSelectedField] = useState<number | null>(null);
  const [sensorData, setSensorData] = useState<SensorData[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchFields();
    const interval = setInterval(fetchFields, 30000);
    return () => clearInterval(interval);
  }, [fetchFields]);

  useEffect(() => {
    if (fields.length > 0 && !selectedField) {
      setSelectedField(fields[0].id);
    }
  }, [fields, selectedField]);

  useEffect(() => {
    if (selectedField) {
      api.sensorData.getByFieldId(selectedField, 2).then(setSensorData);
    }
  }, [selectedField, lastUpdated]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchFields();
    if (selectedField) {
      await api.sensorData.getByFieldId(selectedField, 2).then(setSensorData);
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  const selectedFieldData = fields.find(f => f.id === selectedField);

  const chartData = sensorData.map(d => ({
    time: formatTime(d.timestamp),
    humidity: d.humidity,
    timestamp: d.timestamp,
  }));

  const alarmCount = fields.filter(f => f.status === 'alarm').length;
  const warningCount = fields.filter(f => f.status === 'warning').length;
  const normalCount = fields.filter(f => f.status === 'normal').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">实时状态</h1>
          <p className="text-gray-500 mt-1">
            最后更新: {lastUpdated ? lastUpdated.toLocaleTimeString('zh-CN') : '--'}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-field text-white rounded-lg hover:bg-field-dark transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-green-700">{normalCount}</div>
              <div className="text-sm text-green-600">正常</div>
            </div>
          </div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-700">{warningCount}</div>
              <div className="text-sm text-amber-600">预警</div>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <div className="text-3xl font-bold text-red-700">{alarmCount}</div>
              <div className="text-sm text-red-600">超标待处理</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-field border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map(field => (
              <div
                key={field.id}
                onClick={() => setSelectedField(field.id)}
                className={`bg-white rounded-xl p-5 border-2 cursor-pointer transition-all hover:shadow-lg ${
                  selectedField === field.id
                    ? 'border-field shadow-md'
                    : field.status === 'alarm'
                    ? 'border-red-300 pulse-alarm'
                    : field.status === 'warning'
                    ? 'border-amber-300'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-field" />
                    <span className="font-semibold text-lg">{field.code}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(field.status || 'normal')}`}>
                    {getStatusText(field.status || 'normal')}
                  </span>
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">面积</div>
                    <div className="text-gray-700">{field.area} m²</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">湿度上限</div>
                    <div className="text-gray-700">{field.humidityThreshold}%</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className={`w-5 h-5 ${
                        field.status === 'alarm' ? 'text-red-500' : 
                        field.status === 'warning' ? 'text-amber-500' : 'text-field'
                      }`} />
                      <span className="text-sm text-gray-500">当前湿度</span>
                    </div>
                    <span className={`text-2xl font-bold ${
                      field.status === 'alarm' ? 'text-red-600' : 
                      field.status === 'warning' ? 'text-amber-600' : 'text-field'
                    }`}>
                      {field.currentHumidity?.toFixed(1) || '--'}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        field.status === 'alarm' ? 'bg-red-500' : 
                        field.status === 'warning' ? 'bg-amber-500' : 'bg-field'
                      }`}
                      style={{ width: `${Math.min((field.currentHumidity || 0) / 100 * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedFieldData && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">
                {selectedFieldData.code} - 近2小时湿度趋势
              </h2>
              <div className="h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} domain={[40, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          padding: '12px',
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, '湿度']}
                      />
                      <ReferenceLine
                        y={selectedFieldData.humidityThreshold}
                        stroke="#dc2626"
                        strokeDasharray="5 5"
                        label={{ value: `上限 ${selectedFieldData.humidityThreshold}%`, position: 'right', fill: '#dc2626', fontSize: 12 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="humidity"
                        stroke="#2d5a27"
                        strokeWidth={2}
                        dot={{ fill: '#2d5a27', r: 4 }}
                        activeDot={{ r: 6, fill: '#4a7c42' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    暂无数据
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
