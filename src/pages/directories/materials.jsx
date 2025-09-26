import MainCard from 'components/MainCard';
import { Typography, Button, Table, Space, Popconfirm, message, Input, Modal, Form, InputNumber, Select, Card, Image, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, LinkOutlined, EyeOutlined } from '@ant-design/icons';
import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { List } from 'react-window';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../../api/database';

// ==============================|| СПРАВОЧНИК МАТЕРИАЛОВ ||============================== //

// Хук для debounce
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Виртуализированный компонент строки материала
const VirtualizedMaterialRow = memo(({ index, style, data }) => {
  // Дополнительная защита от undefined/null
  if (!data || typeof data !== 'object') {
    return null;
  }

  // Безопасная деструктуризация с fallback значениями
  const { 
    materials = [], 
    onEdit = () => {}, 
    onDelete = () => {} 
  } = data;
  
  // Дополнительная проверка на массив
  if (!Array.isArray(materials)) {
    return null;
  }

  const material = materials[index];

  if (!material) return null;

  return (
    <div style={style}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px',
        borderBottom: '1px solid #f0f0f0',
        backgroundColor: '#fff',
        minHeight: '80px'
      }}>
        {/* Изображение */}
        <div style={{ width: '60px', textAlign: 'center', marginRight: '16px' }}>
          {material.image_url ? (
            <Image
              src={material.image_url}
              alt={material.name}
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

        {/* Материал */}
        <div style={{ flex: 1, marginRight: '16px' }}>
          <div style={{ marginBottom: 8 }}>
            <Typography.Text strong style={{ fontSize: '14px', lineHeight: '1.4' }}>
              {material.name}
            </Typography.Text>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Tag color="blue" style={{ marginRight: 4 }}>
              ID: {material.id}
            </Tag>
            <Tag color="green">
              {material.unit}
            </Tag>
          </div>
          {material.item_url && (
            <div>
              <Button
                type="link"
                size="small"
                icon={<LinkOutlined />}
                onClick={() => window.open(material.item_url, '_blank')}
                style={{ padding: 0, height: 'auto' }}
              >
                Перейти к товару
              </Button>
            </div>
          )}
        </div>

        {/* Цена */}
        <div style={{ width: '120px', textAlign: 'right', marginRight: '16px' }}>
          <Typography.Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
            {material.unit_price ? `${parseFloat(material.unit_price).toFixed(2)} ₽` : '-'}
          </Typography.Text>
        </div>

        {/* Характеристики */}
        <div style={{ width: '150px', marginRight: '16px' }}>
          {material.expenditure && (
            <div style={{ marginBottom: 4 }}>
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                Расход: {parseFloat(material.expenditure).toFixed(6)}
              </Typography.Text>
            </div>
          )}
          {material.weight && (
            <div>
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                Вес: {parseFloat(material.weight).toFixed(3)} кг
              </Typography.Text>
            </div>
          )}
        </div>

        {/* Действия */}
        <div style={{ width: '120px', textAlign: 'center' }}>
          <Space size="small" direction="vertical">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => onEdit(material)}
              title="Редактировать"
              block
            />
            <Popconfirm
              title="Удаление материала"
              description="Вы уверены, что хотите удалить этот материал?"
              onConfirm={() => onDelete(material.id)}
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
        </div>
      </div>
    </div>
  );
});

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' или 'edit'
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  
  // Debounce для поиска (300ms задержка)
  const debouncedSearchText = useDebounce(searchText, 300);

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

  // Мемоизированная фильтрация материалов
  const filteredMaterials = useMemo(() => {
    const safe = Array.isArray(materials) ? materials : [];
    
    if (!debouncedSearchText) {
      return safe;
    }
    
    return safe.filter(
      (material) =>
        material && 
        material.name && 
        material.id &&
        (material.name.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
         material.unit?.toLowerCase().includes(debouncedSearchText.toLowerCase()) ||
         material.id.toString().includes(debouncedSearchText))
    );
  }, [materials, debouncedSearchText]);

  // Функция для поиска (без debounce, только обновляет состояние)
  const handleSearch = useCallback((value) => {
    setSearchText(value);
  }, []);

  // Загружаем материалы при монтировании компонента
  useEffect(() => {
    loadMaterials();
  }, []);


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

             {/* Виртуализированная таблица материалов */}
             <div style={{ 
               backgroundColor: '#fff',
               borderRadius: '8px',
               boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
               border: '1px solid #d9d9d9'
             }}>
               {/* Заголовок таблицы */}
               <div style={{
                 display: 'flex',
                 alignItems: 'center',
                 padding: '12px',
                 backgroundColor: '#fafafa',
                 borderBottom: '2px solid #d9d9d9',
                 fontWeight: 'bold',
                 fontSize: '14px'
               }}>
                 <div style={{ width: '60px', textAlign: 'center', marginRight: '16px' }}>Изображение</div>
                 <div style={{ flex: 1, marginRight: '16px' }}>Материал</div>
                 <div style={{ width: '120px', textAlign: 'center', marginRight: '16px' }}>Цена</div>
                 <div style={{ width: '150px', textAlign: 'center', marginRight: '16px' }}>Характеристики</div>
                 <div style={{ width: '120px', textAlign: 'center' }}>Действия</div>
               </div>

               {/* Виртуализированный список */}
               {loading ? (
                 <div style={{ padding: '40px', textAlign: 'center' }}>
                   <Typography.Text>Загрузка материалов...</Typography.Text>
                 </div>
               ) : Array.isArray(filteredMaterials) && filteredMaterials.length > 0 ? (
                 <List
                   height={600}
                   itemCount={filteredMaterials.length}
                   itemSize={80}
                   itemData={{
                     materials: filteredMaterials,
                     onEdit: handleEdit,
                     onDelete: handleDelete
                   }}
                 >
                   {VirtualizedMaterialRow}
                 </List>
               ) : (
                 <div style={{ padding: '40px', textAlign: 'center' }}>
                   <Typography.Text>Нет материалов для отображения</Typography.Text>
                 </div>
               )}
             </div>

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
