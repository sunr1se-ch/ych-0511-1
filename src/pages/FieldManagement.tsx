import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, MapPin, Maximize2, Droplets, AlertCircle } from 'lucide-react';
import { api } from '../utils/api';
import { getStatusText, getStatusColor } from '../utils/format';
import type { Field, CreateFieldRequest } from '../../shared/types';

interface FormData {
  code: string;
  area: number | '';
  humidityThreshold: number | '';
}

export default function FieldManagement() {
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FormData>({
    code: '',
    area: '',
    humidityThreshold: '',
  });
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  const loadFields = async () => {
    setLoading(true);
    try {
      const data = await api.fields.getAll();
      setFields(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFields();
  }, []);

  const resetForm = () => {
    setFormData({ code: '', area: '', humidityThreshold: '' });
    setEditingId(null);
    setError('');
    setShowForm(false);
  };

  const handleEdit = (field: Field) => {
    setFormData({
      code: field.code,
      area: field.area,
      humidityThreshold: field.humidityThreshold,
    });
    setEditingId(field.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.code.trim()) {
      setError('请输入晒场编号');
      return;
    }
    if (formData.area === '' || formData.area <= 0) {
      setError('请输入有效的面积');
      return;
    }
    if (formData.humidityThreshold === '' || formData.humidityThreshold <= 0 || formData.humidityThreshold > 100) {
      setError('请输入有效的湿度上限(1-100)');
      return;
    }

    try {
      const data: CreateFieldRequest = {
        code: formData.code.trim(),
        area: Number(formData.area),
        humidityThreshold: Number(formData.humidityThreshold),
      };

      if (editingId) {
        await api.fields.update(editingId, data);
      } else {
        await api.fields.create(data);
      }

      resetForm();
      loadFields();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.fields.delete(id);
      setDeleteConfirm(null);
      loadFields();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">晒场管理</h1>
          <p className="text-gray-500 mt-1">共 {fields.length} 个晒场</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-field text-white rounded-lg hover:bg-field-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增晒场
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingId ? '编辑晒场' : '新增晒场'}
            </h3>
            <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {error && (
              <div className="md:col-span-3 bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                晒场编号 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="如 A-01"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-field focus:border-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                面积 (m²) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Maximize2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.area}
                  onChange={(e) => setFormData({ ...formData, area: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="如 500"
                  min="1"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-field focus:border-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                湿度上限 (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={formData.humidityThreshold}
                  onChange={(e) => setFormData({ ...formData, humidityThreshold: e.target.value ? Number(e.target.value) : '' })}
                  placeholder="如 70"
                  min="1"
                  max="100"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-field focus:border-field"
                />
              </div>
            </div>

            <div className="md:col-span-3 flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2 bg-field text-white rounded-lg hover:bg-field-dark transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingId ? '保存修改' : '创建晒场'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-field border-t-transparent"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(field => (
            <div key={field.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-field" />
                  <span className="font-semibold text-lg">{field.code}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(field.status || 'normal')}`}>
                  {getStatusText(field.status || 'normal')}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Maximize2 className="w-4 h-4" />
                    面积
                  </span>
                  <span className="font-medium">{field.area} m²</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <Droplets className="w-4 h-4" />
                    湿度上限
                  </span>
                  <span className="font-medium">{field.humidityThreshold}%</span>
                </div>
                {field.currentHumidity !== undefined && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">当前湿度</span>
                    <span className={`font-medium ${
                      field.status === 'alarm' ? 'text-red-600' :
                      field.status === 'warning' ? 'text-amber-600' : 'text-field'
                    }`}>
                      {field.currentHumidity.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleEdit(field)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 text-field hover:bg-field/5 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  编辑
                </button>
                {deleteConfirm === field.id ? (
                  <>
                    <button
                      onClick={() => handleDelete(field.id)}
                      className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      确认删除
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(field.id)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
