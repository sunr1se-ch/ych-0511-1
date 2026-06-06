import { useState, useEffect } from 'react';
import { X, Upload, Clock, MapPin, Droplets, User, FileText, ArrowLeft, AlertCircle } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../utils/api';
import { formatDateTime, getDurationMinutes, getStatusText, getStatusBorderColor } from '../utils/format';
import type { WorkOrder } from '../../shared/types';

interface Props {
  order: WorkOrder;
  onClose: () => void;
  onSuccess: () => void;
}

function CompleteModal({ order, onClose, onSuccess }: Props) {
  const [workDuration, setWorkDuration] = useState(30);
  const [remark, setRemark] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!remark.trim()) {
      setError('请填写作业备注');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.workOrders.complete(order.id, {
        workDuration,
        remark,
        photoBase64: photo || undefined,
      });
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
      <div className="relative bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">完成登记 - {order.fieldCode}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>晒场编号：{order.fieldCode}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Droplets className="w-4 h-4" />
              <span>触发湿度：{order.humidityAvg.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>触发时间：{formatDateTime(order.triggeredAt)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作业时长（分钟）
            </label>
            <input
              type="number"
              value={workDuration}
              onChange={(e) => setWorkDuration(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-field focus:border-field"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              作业备注 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-field focus:border-field resize-none"
              placeholder="请描述作业情况，如翻粮完成、湿度已下降等"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              上传作业照片（可选）
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-field hover:bg-field/5 transition-colors">
              {photo ? (
                <img src={photo} alt="预览" className="h-full w-full object-contain p-2" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-500">点击上传照片</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-field text-white rounded-lg hover:bg-field-dark transition-colors disabled:opacity-50"
            >
              {loading ? '提交中...' : '确认完成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function WorkTodos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterFieldId = searchParams.get('fieldId');
  const filterFieldCode = searchParams.get('fieldCode');

  const { workOrders, loading, fetchWorkOrders, refreshAll } = useAppStore();
  const { user } = useAuthStore();
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);

  useEffect(() => {
    if (workOrders.length === 0) {
      fetchWorkOrders('pending');
    }
  }, [workOrders.length, fetchWorkOrders]);

  const pendingOrders = workOrders.filter(o => o.status === 'pending');

  const displayOrders = filterFieldId
    ? pendingOrders.filter(o => o.fieldId === parseInt(filterFieldId))
    : pendingOrders;

  const handleComplete = async () => {
    setSelectedOrder(null);
    await Promise.all([
      fetchWorkOrders('pending'),
      refreshAll(),
    ]);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const showFieldFilterHint = filterFieldId && displayOrders.length === 0 && pendingOrders.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {filterFieldId && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:text-field hover:bg-field/5 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              返回
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              工单待办
              {filterFieldCode && (
                <span className="text-lg font-normal text-field ml-2">
                  - {decodeURIComponent(filterFieldCode)}
                </span>
              )}
            </h1>
            <p className="text-gray-500 mt-1">
              {filterFieldId
                ? `该晒场待处理：${displayOrders.length} 个（共 ${pendingOrders.length} 个）`
                : `待处理：${pendingOrders.length} 个`
              }
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-field border-t-transparent"></div>
        </div>
      ) : displayOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {filterFieldId ? `该晒场暂无待办工单` : '暂无待办工单'}
          </h3>
          <p className="text-gray-500 mb-2">
            {filterFieldId && pendingOrders.length > 0
              ? '该晒场当前没有待处理的工单，其他晒场仍有待办。'
              : '所有工单已处理完毕，继续保持！'
            }
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mt-4">
            <AlertCircle className="w-4 h-4" />
            <span>连续三次超上限才开立工单</span>
          </div>
        </div>
      ) : (
        <>
          {showFieldFilterHint && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">
                  当前筛选显示「{decodeURIComponent(filterFieldCode || '')}」的工单，
                  点击「返回」查看全部待办
                </span>
              </div>
            </div>
          )}
          <div className="space-y-4">
            {displayOrders.map(order => {
              const pendingMinutes = getDurationMinutes(order.triggeredAt);
              const isUrgent = pendingMinutes > 60;

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl border-l-4 shadow-sm hover:shadow-md transition-shadow ${getStatusBorderColor(order.status)}`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-field/10 flex items-center justify-center">
                          <MapPin className="w-6 h-6 text-field" />
                        </div>
                        <div>
                          <div className="font-semibold text-lg">{order.fieldCode}</div>
                          <div className="text-sm text-gray-500">
                            触发时间：{formatDateTime(order.triggeredAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isUrgent && order.status === 'pending' && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded mb-2">
                            紧急
                          </span>
                        )}
                        <div className="text-sm text-gray-500">
                          已等待 <span className={`font-semibold ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>
                            {Math.floor(pendingMinutes / 60)}小时{pendingMinutes % 60}分钟
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">平均湿度</div>
                        <div className="font-semibold text-red-600">{order.humidityAvg.toFixed(1)}%</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">工单状态</div>
                        <div className="font-semibold text-amber-600">{getStatusText(order.status)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">处理人</div>
                        <div className="font-semibold text-gray-700">
                          {order.operatorName || user?.name || '--'}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">工单号</div>
                        <div className="font-semibold text-gray-700">#{order.id.toString().padStart(4, '0')}</div>
                      </div>
                    </div>

                    {order.status === 'pending' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="flex-1 bg-field hover:bg-field-dark text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          <User className="w-5 h-5" />
                          登记完成
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedOrder && (
        <CompleteModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onSuccess={handleComplete}
        />
      )}
    </div>
  );
}
