import { useState, useEffect } from 'react';
import MainCard from 'components/MainCard';
import {
  Typography,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Divider,
  Tooltip,
  Popconfirm,
  Badge
} from 'antd';
import { PlusOutlined, CalculatorOutlined, DeleteOutlined, EditOutlined, FileTextOutlined, DownloadOutlined, SaveOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// ==============================|| РАСЧЕТ СМЕТЫ ||============================== //

export default function EstimateCalculationPage() {
  const [works, setWorks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [workMaterials, setWorkMaterials] = useState({}); // workId -> materials array
  const [estimateItems, setEstimateItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  // Загрузка данных
  useEffect(() => {
    loadWorks();
    loadMaterials();
  }, []);

  const loadWorks = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/works');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setWorks(data);
        } else {
          setWorks([]);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки работ:', error);
      setWorks([]);
    }
  };

  const loadMaterials = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/materials');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setMaterials(data);
        } else {
          setMaterials([]);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов:', error);
      setMaterials([]);
    }
  };

  const loadWorkMaterials = async (workId) => {
    if (!workId) return [];

    try {
      const response = await fetch(`http://localhost:3002/api/works/${workId}/materials`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setWorkMaterials((prev) => ({ ...prev, [workId]: data }));
          return data;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки материалов работы:', error);
    }
    setWorkMaterials((prev) => ({ ...prev, [workId]: [] }));
    return [];
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditItem = (record) => {
    setSelectedItem(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDeleteItem = (index) => {
    const newItems = estimateItems.filter((_, i) => i !== index);
    setEstimateItems(newItems);
    message.success('Позиция удалена из сметы');
  };

  const handleSaveItem = async (values) => {
    const quantity = values.quantity || 1;
    const itemsToAdd = [];

    // Добавляем основную позицию (работу или материал)
    const mainItem = {
      ...values,
      total: calculateTotal(values)
    };
    itemsToAdd.push(mainItem);

    // Если это работа, добавляем связанные материалы
    if (values.type === 'work') {
      const workMats = workMaterials[values.item_id] || [];
      workMats.forEach((mat) => {
        const materialQuantity = (mat.total_consumption || 0) * quantity;
        const materialTotal = materialQuantity * (mat.material_unit_price || 0);

        itemsToAdd.push({
          type: 'material',
          item_id: mat.material_id,
          name: mat.material_name,
          unit: mat.material_unit,
          unit_price: mat.material_unit_price || 0,
          quantity: materialQuantity,
          total: materialTotal,
          work_id: values.item_id,
          consumption_per_work_unit: mat.consumption_per_work_unit,
          waste_coeff: mat.waste_coeff
        });
      });
    }

    if (selectedItem) {
      // Редактирование - нужно найти и заменить основную позицию и связанные материалы
      const index = estimateItems.findIndex((item) => item === selectedItem);
      const newItems = [...estimateItems];

      // Удаляем старую позицию и связанные материалы
      let deleteCount = 1;
      if (selectedItem.type === 'work') {
        // Найдем сколько материалов связано с этой работой
        const relatedMaterials = estimateItems
          .slice(index + 1)
          .filter((item) => item.work_id === selectedItem.item_id && item.type === 'material');
        deleteCount += relatedMaterials.length;
      }

      newItems.splice(index, deleteCount, ...itemsToAdd);
      setEstimateItems(newItems);
      message.success('Позиция обновлена');
    } else {
      // Добавление
      setEstimateItems([...estimateItems, ...itemsToAdd]);
      message.success('Позиция добавлена в смету');
    }
    setModalVisible(false);
  };

  const calculateTotal = (item) => {
    const quantity = item.quantity || 0;
    const unitPrice = item.unit_price || 0;
    return quantity * unitPrice;
  };

  const getTotalEstimate = () => {
    return estimateItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const columns = [
    {
      title: '№',
      key: 'index',
      width: 60,
      render: (_, record, index) => (
        <Badge 
          count={index + 1} 
          style={{ backgroundColor: record.type === 'work' ? '#1890ff' : '#52c41a' }}
        />
      )
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => (
        <Tag 
          color={type === 'work' ? 'blue' : 'green'}
          icon={type === 'work' ? <CalculatorOutlined /> : <FileTextOutlined />}
        >
          {type === 'work' ? 'Работа' : 'Материал'}
        </Tag>
      )
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      width: 350,
      render: (text, record) => (
        <div>
          <Text strong style={{ fontSize: '14px', lineHeight: '1.4' }}>
            {text}
          </Text>
          {record.work_id && (
            <div style={{ marginTop: 4 }}>
              <Tag size="small" color="orange">
                Материал для работы
              </Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Ед. изм.',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
      render: (unit) => <Tag color="default">{unit}</Tag>
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (value) => (
        <Text strong style={{ color: '#1890ff' }}>
          {value ? parseFloat(value).toFixed(2) : '-'}
        </Text>
      )
    },
    {
      title: 'Цена за ед.',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (value) => (
        <Text style={{ color: '#666' }}>
          {value ? `${parseFloat(value).toFixed(2)} ₽` : '-'}
        </Text>
      )
    },
    {
      title: 'Итого',
      dataIndex: 'total',
      key: 'total',
      width: 140,
      render: (value) => (
        <Text strong style={{ color: '#722ed1', fontSize: '16px' }}>
          {value ? `${parseFloat(value).toFixed(2)} ₽` : '-'}
        </Text>
      )
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, record, index) => (
        <Space size="small">
          <Tooltip title="Редактировать">
            <Button 
              type="primary" 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => handleEditItem(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить позицию?"
            description="Вы уверены, что хотите удалить эту позицию из сметы?"
            onConfirm={() => handleDeleteItem(index)}
            okText="Да"
            cancelText="Нет"
          >
            <Tooltip title="Удалить">
              <Button 
                danger 
                size="small" 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Статистика сметы
  const stats = {
    totalItems: estimateItems.length,
    totalWorks: estimateItems.filter((item) => item.type === 'work').length,
    totalMaterials: estimateItems.filter((item) => item.type === 'material').length,
    totalAmount: getTotalEstimate(),
    worksAmount: estimateItems
      .filter((item) => item.type === 'work')
      .reduce((sum, item) => sum + (item.total || 0), 0),
    materialsAmount: estimateItems
      .filter((item) => item.type === 'material')
      .reduce((sum, item) => sum + (item.total || 0), 0)
  };

  // Функции для экспорта и сохранения
  const handleExportEstimate = () => {
    const estimateData = {
      date: new Date().toLocaleDateString('ru-RU'),
      items: estimateItems,
      statistics: stats
    };
    
    const dataStr = JSON.stringify(estimateData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `estimate_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.success('Смета экспортирована');
  };

  const handleClearEstimate = () => {
    setEstimateItems([]);
    message.success('Смета очищена');
  };

  return (
    <MainCard title="Расчет сметы">
      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Всего позиций" 
              value={stats.totalItems} 
              valueStyle={{ color: '#1890ff' }}
              prefix={<CalculatorOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Работ" 
              value={stats.totalWorks} 
              valueStyle={{ color: '#52c41a' }}
              prefix={<CalculatorOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Материалов" 
              value={stats.totalMaterials} 
              valueStyle={{ color: '#faad14' }}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Сумма работ" 
              value={stats.worksAmount} 
              precision={2} 
              suffix="₽" 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Сумма материалов" 
              value={stats.materialsAmount} 
              precision={2} 
              suffix="₽" 
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic 
              title="Общая сумма" 
              value={stats.totalAmount} 
              precision={2} 
              suffix="₽" 
              valueStyle={{ color: '#722ed1', fontSize: '20px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Кнопки управления */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space wrap>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem} size="large">
            Добавить позицию
          </Button>
          <Button
            icon={<CalculatorOutlined />}
            onClick={() => {
              loadWorks();
              loadMaterials();
            }}
            size="large"
          >
            Обновить справочники
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportEstimate}
            size="large"
            disabled={estimateItems.length === 0}
          >
            Экспорт сметы
          </Button>
          <Popconfirm
            title="Очистить смету?"
            description="Все позиции будут удалены. Это действие нельзя отменить."
            onConfirm={handleClearEstimate}
            okText="Да, очистить"
            cancelText="Отмена"
            disabled={estimateItems.length === 0}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              size="large"
              disabled={estimateItems.length === 0}
            >
              Очистить смету
            </Button>
          </Popconfirm>
        </Space>

        <div style={{ textAlign: 'right' }}>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            Смета на {new Date().toLocaleDateString('ru-RU')}
          </Text>
          <br />
          <Text strong style={{ color: '#722ed1', fontSize: '16px' }}>
            Итого: {stats.totalAmount.toFixed(2)} ₽
          </Text>
        </div>
      </div>

      {/* Таблица сметы */}
      <Table
        columns={columns}
        dataSource={estimateItems}
        rowKey={(record, index) => index}
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} позиций`,
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
        summary={() => (
          <Table.Summary.Row style={{ backgroundColor: '#f8f9fa' }}>
            <Table.Summary.Cell index={0} colSpan={6}>
              <Text strong style={{ fontSize: '16px' }}>
                Итого по смете:
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1}>
              <Text strong style={{ color: '#722ed1', fontSize: '18px' }}>
                {stats.totalAmount.toFixed(2)} ₽
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} />
          </Table.Summary.Row>
        )}
      />

      {/* Модальное окно для добавления/редактирования */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalculatorOutlined style={{ color: '#1890ff' }} />
            {selectedItem ? 'Редактирование позиции' : 'Добавление позиции в смету'}
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()} icon={<SaveOutlined />}>
            {selectedItem ? 'Сохранить изменения' : 'Добавить в смету'}
          </Button>
        ]}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSaveItem}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="type" label="Тип позиции" rules={[{ required: true, message: 'Выберите тип позиции' }]}>
                <Select placeholder="Выберите тип" size="large">
                  <Option value="work">
                    <Space>
                      <CalculatorOutlined />
                      Работа
                    </Space>
                  </Option>
                  <Option value="material">
                    <Space>
                      <FileTextOutlined />
                      Материал
                    </Space>
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quantity" label="Количество" rules={[{ required: true, message: 'Введите количество' }]}>
                <InputNumber 
                  placeholder="0.00" 
                  min={0} 
                  precision={2} 
                  style={{ width: '100%' }} 
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return (
                <Form.Item
                  name="item_id"
                  label={
                    <Space>
                      {type === 'work' ? <CalculatorOutlined /> : <FileTextOutlined />}
                      {type === 'work' ? 'Выберите работу' : 'Выберите материал'}
                    </Space>
                  }
                  rules={[{ required: true, message: 'Выберите позицию' }]}
                >
                  <Select
                    placeholder={type === 'work' ? 'Выберите работу' : 'Выберите материал'}
                    size="large"
                    showSearch
                    filterOption={(input, option) =>
                      option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                    }
                    onChange={async (value) => {
                      const item = type === 'work' ? works.find((w) => w.id === value) : materials.find((m) => m.id === value);
                      if (item) {
                        form.setFieldsValue({
                          name: item.name,
                          unit: item.unit,
                          unit_price: item.unit_price || 0
                        });

                        // Если выбрана работа, загрузим связанные материалы для отображения
                        if (type === 'work') {
                          await loadWorkMaterials(value);
                        }
                      }
                    }}
                  >
                    {type === 'work'
                      ? works.map((work) => (
                          <Option key={work.id} value={work.id}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{work.name}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {work.unit_price ? `${work.unit_price} ₽/${work.unit}` : 'цена не указана'}
                              </div>
                            </div>
                          </Option>
                        ))
                      : materials.map((material) => (
                          <Option key={material.id} value={material.id}>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{material.name}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>
                                {material.unit_price ? `${material.unit_price} ₽/${material.unit}` : 'цена не указана'}
                              </div>
                            </div>
                          </Option>
                        ))}
                  </Select>
                </Form.Item>
              );
            }}
          </Form.Item>

          {/* Отображение связанных материалов для работы */}
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.item_id !== currentValues.item_id || prevValues.quantity !== currentValues.quantity
            }
          >
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              const workId = getFieldValue('item_id');
              const quantity = getFieldValue('quantity') || 1;

              if (type === 'work' && workId && workMaterials[workId]?.length > 0) {
                const materials = workMaterials[workId];
                const totalMaterialsCost = materials.reduce((sum, mat) => {
                  const materialQuantity = (mat.total_consumption || 0) * quantity;
                  const materialCost = materialQuantity * (mat.material_unit_price || 0);
                  return sum + materialCost;
                }, 0);

                return (
                  <Card 
                    title={
                      <Space>
                        <FileTextOutlined style={{ color: '#52c41a' }} />
                        <Text strong style={{ color: '#52c41a' }}>
                          Связанные материалы (будут добавлены автоматически)
                        </Text>
                      </Space>
                    }
                    size="small"
                    style={{ marginTop: 16, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f' }}
                  >
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {materials.map((mat) => {
                        const materialQuantity = (mat.total_consumption || 0) * quantity;
                        const materialCost = materialQuantity * (mat.material_unit_price || 0);
                        return (
                          <div key={mat.material_id} style={{ 
                            marginBottom: 8, 
                            padding: '8px 12px', 
                            backgroundColor: '#fff',
                            borderRadius: '4px',
                            border: '1px solid #d9f7be'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <Text strong style={{ fontSize: '13px' }}>{mat.material_name}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                  Расход: {materialQuantity.toFixed(6)} {mat.material_unit}
                                </Text>
                              </div>
                              <Text strong style={{ color: '#52c41a', fontSize: '14px' }}>
                                {materialCost.toFixed(2)} ₽
                              </Text>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div style={{ textAlign: 'right' }}>
                      <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                        Итого материалов: {totalMaterialsCost.toFixed(2)} ₽
                      </Text>
                    </div>
                  </Card>
                );
              }
              return null;
            }}
          </Form.Item>

          <Form.Item name="name" style={{ display: 'none' }}>
            <Input />
          </Form.Item>
          <Form.Item name="unit" style={{ display: 'none' }}>
            <Input />
          </Form.Item>
          <Form.Item name="unit_price" style={{ display: 'none' }}>
            <InputNumber />
          </Form.Item>
        </Form>
      </Modal>
    </MainCard>
  );
}
