import { useState, useEffect, useMemo } from 'react';
import { Droplets, MapPin, AlertTriangle, CheckCircle, Clock, RefreshCw, ClipboardList, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { api } from '../utils/api';
import { formatTime, getStatusText, getStatusColor, getFieldColor } from '../utils/format';
import type { SensorData } from '../../shared/types';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    fields,
    loading,
    lastUpdated,
    sensorData,
    selectedFieldIds,
    hiddenLineFieldIds,
    fetchFields,
    fetchSensorData,
    fetchWorkOrders,
    refreshAll,
    toggleFieldSelection,
    toggleLineVisibility,
    getPendingCountByFieldId,
  } = useAppStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (fields.length === 0) {
        await Promise.all([fetchFields(), fetchWorkOrders('pending')]);
      }
    };
    init();
  }, [fields.length, fetchFields, fetchWorkOrders]);

  useEffect(() => {
    if (fields.length > 0 && selectedFieldIds.length === 0) {
      toggleFieldSelection(fields[0].id);
    }
  }, [fields, selectedFieldIds.length, toggleFieldSelection]);

  useEffect(() => {
    selectedFieldIds.forEach(fieldId => {
      if (!sensorData[fieldId]) {
        fetchSensorData(fieldId, 2);
      }
    });
  }, [selectedFieldIds, sensorData, fetchSensorData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleViewTodos = (fieldId: number, fieldCode: string) => {
    navigate(`/todos?fieldId=${fieldId}&fieldCode=${encodeURIComponent(fieldCode)}`);
  };

  const selectedFields = useMemo(() => {
    return fields.filter(f => selectedFieldIds.includes(f.id));
  }, [fields, selectedFieldIds]);

  const chartData = useMemo(() => {
    if (selectedFields.length === 0) return [];

    const allTimestamps: Set<string> = new Set();
    selectedFields.forEach(field => {
      const data = sensorData[field.id] || [];
      data.forEach(d => allTimestamps.add(d.timestamp));
    });

    const sortedTimestamps = Array.from(allTimestamps).sort();

    return sortedTimestamps.map(timestamp => {
      const point: Record<string, string | number | null> = {
        time: formatTime(timestamp),
        timestamp,
      };
      selectedFields.forEach(field => {
        const data = sensorData[field.id] || [];
        const match = data.find(d => d.timestamp === timestamp);
        point[`humidity_${field.id}`] = match ? match.humidity : null;
        point[`threshold_${field.id}`] = field.humidityThreshold;
      });
      return point;
    });
  }, [selectedFields, sensorData]);

  const CustomLegend = () => {
    return (
      <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
        {selectedFields.map((field, index) => {
          const color = getFieldColor(index);
          const isHidden = hiddenLineFieldIds.includes(field.id);
          return (
            <div
              key={field.id}
              className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => toggleLineVisibility(field.id)}
            >
              {isHidden ? (
                <EyeOff className="w-4 h-4 text-gray-400" />
              ) : (
                <Eye className="w-4 h-4" style={{ color: color.main }} />
              )}
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: isHidden ? '#d1d5db' : color.main }}
              />
              <span className={`text-sm ${isHidden ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                {field.code} (上限 {field.humidityThreshold}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const alarmCount = fields.filter(f => f.status === 'alarm').length;
  const warningCount = fields.filter(f => f.status === 'warning').length;
  const normalCount = fields.filter(f => f.status === 'normal').length;

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
        <p className="text-sm text-gray-500 mb-2">{label}</p>
        {payload.map((entry, index) => {
          const fieldId = parseInt(entry.name.split('_')[1]);
          const field = fields.find(f => f.id === fieldId);
          if (!field) return null;
          const isOver = entry.value > field.humidityThreshold;
          return (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-600">{field.code}:</span>
              <span className={`font-semibold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                {entry.value.toFixed(1)}%
                {isOver && ' ⚠'}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

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

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-blue-700">
          <CheckSquare className="w-5 h-5" />
          <span className="font-medium">提示：点击卡片可多选晒场（最多3个），在下方图表中对比湿度趋势</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-field border-t-transparent"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map(field => {
              const isSelected = selectedFieldIds.includes(field.id);
              const selectIndex = selectedFieldIds.indexOf(field.id);
              const color = getFieldColor(selectIndex);
              const pendingCount = getPendingCountByFieldId(field.id);
              const hasWarning = field.status === 'warning' || field.status === 'alarm';

              return (
                <div
                  key={field.id}
                  onClick={() => toggleFieldSelection(field.id)}
                  className={`relative bg-white rounded-xl p-5 border-2 cursor-pointer transition-all hover:shadow-lg ${
                    isSelected
                      ? `shadow-md`
                      : field.status === 'alarm'
                      ? 'border-red-300 pulse-alarm'
                      : field.status === 'warning'
                      ? 'border-amber-300'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                  style={{
                    borderColor: isSelected ? color.main : undefined,
                  }}
                >
                  {isSelected && (
                    <div
                      className="absolute top-3 left-3 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: color.main }}
                    >
                      {selectIndex + 1}
                    </div>
                  )}

                  {pendingCount > 0 && hasWarning && (
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center justify-center px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6">
                        {pendingCount}
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-4 mt-2">
                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5" style={{ color: color.main }} />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300" />
                      )}
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

                  {hasWarning && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewTodos(field.id, field.code);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-field/10 text-field rounded-lg hover:bg-field/20 transition-colors text-sm font-medium"
                      >
                        <ClipboardList className="w-4 h-4" />
                        查看待办{pendingCount > 0 && ` (${pendingCount})`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedFields.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  近2小时湿度趋势对比
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (已选 {selectedFields.length}/3 个晒场)
                  </span>
                </h2>
              </div>
              <div className="h-80">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="time" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} domain={[40, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend content={<CustomLegend />} />
                      {selectedFields.map((field, index) => {
                        const color = getFieldColor(index);
                        const isHidden = hiddenLineFieldIds.includes(field.id);
                        return (
                          <ReferenceLine
                            key={`ref-${field.id}`}
                            y={field.humidityThreshold}
                            stroke={isHidden ? '#d1d5db' : color.main}
                            strokeDasharray="5 5"
                            strokeWidth={2}
                          />
                        );
                      })}
                      {selectedFields.map((field, index) => {
                        const color = getFieldColor(index);
                        const isHidden = hiddenLineFieldIds.includes(field.id);
                        return (
                          <Line
                            key={`line-${field.id}`}
                            type="monotone"
                            dataKey={`humidity_${field.id}`}
                            name={`humidity_${field.id}`}
                            stroke={isHidden ? '#d1d5db' : color.main}
                            strokeWidth={isHidden ? 1 : 2}
                            dot={{ fill: isHidden ? '#d1d5db' : color.main, r: isHidden ? 2 : 4 }}
                            activeDot={{ r: 6, fill: color.light }}
                            hide={isHidden}
                            connectNulls
                          />
                        );
                      })}
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
