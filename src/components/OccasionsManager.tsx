import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar, Plus, Edit, Trash2, Bell, Gift } from 'lucide-react';

interface Occasion {
    id: string;
    occasion_type: string;
    occasion_name: string;
    recipient_name: string | null;
    date: string;
    is_recurring: boolean;
    reminder_days_before: number;
    reminder_enabled: boolean;
    notes?: string;
}

export function OccasionsManager() {
    const [occasions, setOccasions] = useState<Occasion[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOccasions();
    }, []);

    const fetchOccasions = async () => {
        try {
            // TODO: Call actual API
            // const response = await fetch('/api/v1/occasions');
            // const data = await response.json();
            // setOccasions(data.occasions);

            // Mock data for now
            setOccasions([
                {
                    id: '1',
                    occasion_type: 'birthday',
                    occasion_name: "Sinh nhật mẹ",
                    recipient_name: "Mẹ",
                    date: '2025-06-15',
                    is_recurring: true,
                    reminder_days_before: 7,
                    reminder_enabled: true
                }
            ]);
        } catch (error) {
            console.error('Error fetching occasions:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="occasions-manager max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Calendar className="h-8 w-8" />
                        Dịp quan trọng
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Lưu ngày đặc biệt và nhận nhắc nhở tự động
                    </p>
                </div>
                <Button onClick={() => setShowAddForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm dịp mới
                </Button>
            </div>

            {/* Add Occasion Form */}
            {showAddForm && (
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>Thêm dịp quan trọng</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <OccasionForm
                            onSave={(data) => {
                                console.log('Save:', data);
                                setShowAddForm(false);
                                fetchOccasions();
                            }}
                            onCancel={() => setShowAddForm(false)}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Occasions List */}
            <div className="space-y-4">
                {occasions.map((occasion) => (
                    <OccasionCard
                        key={occasion.id}
                        occasion={occasion}
                        onEdit={() => {
                            // Edit occasion
                            console.log('Edit:', occasion);
                        }}
                        onDelete={() => {
                            // Delete occasion
                            fetchOccasions();
                        }}
                    />
                ))}

                {occasions.length === 0 && !loading && (
                    <Card className="text-center py-12">
                        <Gift className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                            Chưa có dịp nào
                        </h3>
                        <p className="text-gray-500 mb-4">
                            Thêm ngày đặc biệt để không bao giờ quên!
                        </p>
                        <Button onClick={() => setShowAddForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Thêm dịp đầu tiên
                        </Button>
                    </Card>
                )}
            </div>
        </div>
    );
}

function OccasionCard({ occasion, onEdit, onDelete }: {
    occasion: Occasion;
    onEdit: (occasion: Occasion) => void;
    onDelete: () => void;
}) {
    const occasionTypeLabels = {
        birthday: '🎂 Sinh nhật',
        anniversary: '💕 Kỷ niệm',
        mothers_day: '🌸 Ngày của mẹ',
        fathers_day: '👔 Ngày của bố',
        valentines_day: '💝 Valentine',
        wedding: '💒 Đám cưới',
        graduation: '🎓 Tốt nghiệp',
        other: '🎉 Khác'
    };

    const daysUntil = Math.ceil(
        (new Date(occasion.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-gray-500">
                                {occasionTypeLabels[occasion.occasion_type as keyof typeof occasionTypeLabels]}
                            </span>
                            {occasion.is_recurring && (
                                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                    Hàng năm
                                </span>
                            )}
                        </div>
                        <h3 className="font-bold text-lg">{occasion.occasion_name}</h3>
                        {occasion.recipient_name && (
                            <p className="text-sm text-gray-600">Cho: {occasion.recipient_name}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {new Date(occasion.date).toLocaleDateString('vi-VN')}
                            </span>
                            {daysUntil > 0 && (
                                <span className="text-orange-600 font-medium">
                                    Còn {daysUntil} ngày
                                </span>
                            )}
                            {occasion.reminder_enabled && (
                                <span className="flex items-center gap-1 text-green-600">
                                    <Bell className="h-4 w-4" />
                                    Nhắc {occasion.reminder_days_before} ngày trước
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => onEdit(occasion)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={onDelete}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function OccasionForm({ onSave, onCancel, occasion }: {
    onSave: (data: any) => void;
    onCancel: () => void;
    occasion?: Occasion;
}) {
    const [formData, setFormData] = useState({
        occasion_type: occasion?.occasion_type || 'birthday',
        occasion_name: occasion?.occasion_name || '',
        recipient_name: occasion?.recipient_name || '',
        date: occasion?.date || '',
        is_recurring: occasion?.is_recurring ?? true,
        reminder_days_before: occasion?.reminder_days_before || 7,
        reminder_enabled: occasion?.reminder_enabled ?? true,
        notes: occasion?.notes || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Loại dịp</label>
                    <select
                        className="w-full border rounded-md p-2"
                        value={formData.occasion_type}
                        onChange={e => setFormData({ ...formData, occasion_type: e.target.value })}
                    >
                        <option value="birthday">🎂 Sinh nhật</option>
                        <option value="anniversary">💕 Kỷ niệm</option>
                        <option value="mothers_day">🌸 Ngày của mẹ</option>
                        <option value="fathers_day">👔 Ngày của bố</option>
                        <option value="valentines_day">💝 Valentine</option>
                        <option value="wedding">💒 Đám cưới</option>
                        <option value="graduation">🎓 Tốt nghiệp</option>
                        <option value="other">🎉 Khác</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Ngày</label>
                    <Input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Tên dịp</label>
                <Input
                    placeholder="VD: Sinh nhật mẹ"
                    value={formData.occasion_name}
                    onChange={e => setFormData({ ...formData, occasion_name: e.target.value })}
                    required
                />
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Người nhận (không bắt buộc)</label>
                <Input
                    placeholder="VD: Mẹ, Vợ/Chồng, Bạn gái..."
                    value={formData.recipient_name}
                    onChange={e => setFormData({ ...formData, recipient_name: e.target.value })}
                />
            </div>

            <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.is_recurring}
                        onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
                    />
                    <span className="text-sm">Lặp lại hàng năm</span>
                </label>

                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={formData.reminder_enabled}
                        onChange={e => setFormData({ ...formData, reminder_enabled: e.target.checked })}
                    />
                    <span className="text-sm">Bật nhắc nhở</span>
                </label>

                {formData.reminder_enabled && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Nhắc trước</span>
                        <Input
                            type="number"
                            min="1"
                            max="30"
                            className="w-20"
                            value={formData.reminder_days_before}
                            onChange={e => setFormData({ ...formData, reminder_days_before: parseInt(e.target.value) })}
                        />
                        <span className="text-sm">ngày</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Hủy
                </Button>
                <Button type="submit">
                    Lưu
                </Button>
            </div>
        </form>
    );
}
