import MainCard from 'components/MainCard';
import { Typography, Button, Table, Space, Popconfirm, message, Input, Modal, Form, InputNumber, Select, Card, Image, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, LinkOutlined, EyeOutlined } from '@ant-design/icons';
import { useState, useEffect, useCallback } from 'react';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../../api/database';

// ==============================|| СПРАВОЧНИК МАТЕРИАЛОВ ||============================== //

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' или 'edit'
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filteredMaterials, setFilteredMaterials] = useState([]);

  // Загрузка материалов
  const loadMaterials = async () => {
    setLoading(true);
    try {
      const data = await getMaterials();
      if (Array.isArray(data)) {
        setMaterials(data);
      } else if (data && Array.isArray(data.data)) {
        setMaterials(data.data);
      } else {
        console.warn('⚠️ getMaterials вернул не-массив, устанавливаю []');
        setMaterials([]);
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
      message.error('Ошибка загрузки материалов');
    } finally {
      setLoading(false);
    }
  };

  // Функция для поиска и фильтрации материалов
  const handleSearch = useCallback(
    (value) => {
      setSearchText(value);
      const safe = Array.isArray(materials) ? materials : [];
      const filtered = safe.filter(
        (material) =>
          material.name.toLowerCase().includes(value.toLowerCase()) ||
          material.unit?.toLowerCase().includes(value.toLowerCase()) ||
          material.id.toString().includes(value)
      );
      setFilteredMaterials(filtered);
    },
    [materials]
  );

  // Обновляем отфильтрованные материалы при изменении основного списка
  useEffect(() => {
    handleSearch(searchText);
  }, [materials, handleSearch, searchText]);

  // Загружаем материалы при монтировании компонента
  useEffect(() => {
    loadMaterials();
  }, []);

  const columns = [
    {
      title: 'Изображение',
      dataIndex: 'image_url',
      key: 'image',
      width: 60,
      render: (imageUrl, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={record.name}
              width={40}
              height={40}
              style={{ 
                objectFit: 'cover', 
                borderRadius: '6px',
                border: '1px solid #f0f0f0'
              }}
              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
              placeholder={
                <div style={{ 
                  width: 40, 
                  height: 40, 
                  backgroundColor: '#f5f5f5', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#999'
                }}>
                  <EyeOutlined />
                </div>
              }
            />
          ) : (
            <div style={{ 
              width: 40, 
              height: 40, 
              backgroundColor: '#f5f5f5', 
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999'
            }}>
              <EyeOutlined />
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Материал',
      key: 'material',
      width: 400,
      render: (_, record) => (
        <div>
          <div style={{ marginBottom: 8 }}>
            <Typography.Text strong style={{ fontSize: '14px', lineHeight: '1.4' }}>
              {record.name}
            </Typography.Text>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Tag color="blue" style={{ marginRight: 4 }}>
              ID: {record.id}
            </Tag>
            <Tag color="green">
              {record.unit}
            </Tag>
          </div>
          {record.item_url && (
            <div>
              <Button 
                type="link" 
                size="small" 
                icon={<LinkOutlined />}
                onClick={() => window.open(record.item_url, '_blank')}
                style={{ padding: 0, height: 'auto' }}
              >
                Перейти к товару
              </Button>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Цена',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (price) => (
        <div style={{ textAlign: 'right' }}>
          <Typography.Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
            {price ? `${parseFloat(price).toFixed(2)} ₽` : '-'}
          </Typography.Text>
        </div>
      )
    },
    {
      title: 'Характеристики',
      key: 'characteristics',
      width: 150,
      render: (_, record) => (
        <div>
          {record.expenditure && (
            <div style={{ marginBottom: 4 }}>
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                Расход: {parseFloat(record.expenditure).toFixed(6)}
              </Typography.Text>
            </div>
          )}
          {record.weight && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                Вес: {parseFloat(record.weight).toFixed(3)} кг
              </Typography.Text>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Button 
            type="primary" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)} 
            title="Редактировать"
            block
          />
          <Popconfirm
            title="Удаление материала"
            description="Вы уверены, что хотите удалить этот материал?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button 
              danger 
              size="small" 
              icon={<DeleteOutlined />} 
              title="Удалить"
              block
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const handleAdd = () => {
    setModalMode('create');
    setSelectedMaterial(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setModalMode('edit');
    setSelectedMaterial(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteMaterial(id);
      message.success('Материал успешно удален');
      loadMaterials(); // Перезагружаем список
    } catch {
      message.error('Ошибка удаления материала');
    }
  };

  const handleSave = async (values) => {
    try {
      if (modalMode === 'create') {
        await createMaterial(values);
        message.success('Материал успешно создан');
      } else {
        await updateMaterial(selectedMaterial.id, values);
        message.success('Материал успешно обновлен');
      }
      setModalVisible(false);
      loadMaterials(); // Перезагружаем список
    } catch {
      message.error(modalMode === 'create' ? 'Ошибка создания материала' : 'Ошибка обновления материала');
    }
  };

  return (
    <MainCard title="Справочник материалов">
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Добавить материал
        </Button>

        <Input.Search
          placeholder="Поиск материалов..."
          allowClear
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          onSearch={handleSearch}
        />
      </div>

      <Table
        columns={columns}
        dataSource={filteredMaterials}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} записей`,
          pageSizeOptions: ['10', '20', '50', '100']
        }}
        scroll={{ x: 1200 }}
        size="middle"
        bordered={false}
        style={{ 
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      />

      <div style={{ marginTop: 16, display: 'flex', gap: '20px', color: '#666', flexWrap: 'wrap' }}>
        <Typography.Text type="secondary">
          <strong>Всего материалов:</strong> {materials.length}
        </Typography.Text>
        <Typography.Text type="secondary">
          <strong>С изображениями:</strong> {materials.filter(m => m.image_url).length}
        </Typography.Text>
        <Typography.Text type="secondary">
          <strong>С ссылками:</strong> {materials.filter(m => m.item_url).length}
        </Typography.Text>
        <Typography.Text type="secondary">
          <strong>Средняя цена:</strong> {materials.length > 0 ? 
            `${(materials.reduce((sum, m) => sum + (parseFloat(m.unit_price) || 0), 0) / materials.length).toFixed(2)} ₽` : 
            '0 ₽'
          }
        </Typography.Text>
      </div>

      {/* Модальное окно для создания/редактирования */}
      <Modal
        title={modalMode === 'create' ? 'Создание материала' : 'Редактирование материала'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {modalMode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
        ]}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="id" label="ID материала" rules={[{ required: true, message: 'Введите ID материала' }]}>
            <Input placeholder="Например: m.1001" />
          </Form.Item>

          <Form.Item name="name" label="Наименование материала" rules={[{ required: true, message: 'Введите наименование материала' }]}>
            <Input placeholder="Наименование материала" />
          </Form.Item>

          <Form.Item name="image_url" label="URL изображения">
            <Input placeholder="https://example.com/image.jpg" />
          </Form.Item>

          <Form.Item name="item_url" label="URL товара">
            <Input placeholder="https://example.com/product" />
          </Form.Item>

          <Form.Item name="unit" label="Единица измерения" rules={[{ required: true, message: 'Выберите единицу измерения' }]}>
            <Select placeholder="Выберите единицу">
              <Select.Option value="шт.">шт.</Select.Option>
              <Select.Option value="кг">кг</Select.Option>
              <Select.Option value="л">л</Select.Option>
              <Select.Option value="м">м</Select.Option>
              <Select.Option value="м²">м²</Select.Option>
              <Select.Option value="м³">м³</Select.Option>
              <Select.Option value="т">т</Select.Option>
              <Select.Option value="комплект">комплект</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="unit_price" label="Цена за единицу (руб.)" rules={[{ required: true, message: 'Введите цену' }]}>
            <InputNumber placeholder="0.00" min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="expenditure" label="Расход">
            <InputNumber placeholder="0.000000" min={0} precision={6} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="weight" label="Вес (кг)">
            <InputNumber placeholder="0.000" min={0} precision={3} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </MainCard>
  );
}
