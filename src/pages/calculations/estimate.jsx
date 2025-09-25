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
  Divider
} from 'antd';
import { PlusOutlined, CalculatorOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// ==============================|| РАСЧЕТ СМЕТЫ ||============================== //

export default function EstimateCalculationPage() {
  const [works, setWorks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [workMaterials, setWorkMaterials] = useState({}); // workId -> materials array

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
      title: 'Тип',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type) => <Tag color={type === 'work' ? 'blue' : 'green'}>{type === 'work' ? 'Работа' : 'Материал'}</Tag>
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Единица измерения',
      dataIndex: 'unit',
      key: 'unit',
      width: 120
    },
    {
      title: 'Количество',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (value) => (value ? parseFloat(value).toFixed(2) : '-')
    },
    {
      title: 'Цена за ед.',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (value) => (value ? `${parseFloat(value).toFixed(2)} ₽` : '-')
    },
    {
      title: 'Итого',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (value) => (value ? `${parseFloat(value).toFixed(2)} ₽` : '-')
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record, index) => (
        <Space>
          <Button type="link" icon={<CalculatorOutlined />} onClick={() => handleEditItem(record)} size="small" />
          <Button type="link" icon={<DeleteOutlined />} danger onClick={() => handleDeleteItem(index)} size="small" />
        </Space>
      )
    }
  ];

  // Статистика сметы
  const stats = {
    totalItems: estimateItems.length,
    totalWorks: estimateItems.filter((item) => item.type === 'work').length,
    totalMaterials: estimateItems.filter((item) => item.type === 'material').length,
    totalAmount: getTotalEstimate()
  };

  return (
    <MainCard title="Расчет сметы">
      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic title="Всего позиций" value={stats.totalItems} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Работ" value={stats.totalWorks} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Материалов" value={stats.totalMaterials} valueStyle={{ color: '#faad14' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Общая сумма" value={stats.totalAmount} precision={2} suffix="₽" valueStyle={{ color: '#722ed1' }} />
          </Card>
        </Col>
      </Row>

      {/* Кнопки управления */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddItem}>
            Добавить позицию
          </Button>
          <Button
            onClick={() => {
              loadWorks();
              loadMaterials();
            }}
          >
            Обновить справочники
          </Button>
        </Space>

        <Text type="secondary">Смета на {new Date().toLocaleDateString('ru-RU')}</Text>
      </div>

      {/* Таблица сметы */}
      <Table
        columns={columns}
        dataSource={estimateItems}
        rowKey={(record, index) => index}
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} позиций`
        }}
        scroll={{ x: 1000 }}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={5}>
              <Text strong>Итого по смете:</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1}>
              <Text strong style={{ color: '#722ed1' }}>
                {stats.totalAmount.toFixed(2)} ₽
              </Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={2} />
          </Table.Summary.Row>
        )}
      />

      {/* Модальное окно для добавления/редактирования */}
      <Modal
        title={selectedItem ? 'Редактирование позиции' : 'Добавление позиции'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {selectedItem ? 'Сохранить' : 'Добавить'}
          </Button>
        ]}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveItem}>
          <Form.Item name="type" label="Тип позиции" rules={[{ required: true, message: 'Выберите тип позиции' }]}>
            <Select placeholder="Выберите тип">
              <Option value="work">Работа</Option>
              <Option value="material">Материал</Option>
            </Select>
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}>
            {({ getFieldValue }) => {
              const type = getFieldValue('type');
              return (
                <Form.Item
                  name="item_id"
                  label={type === 'work' ? 'Выберите работу' : 'Выберите материал'}
                  rules={[{ required: true, message: 'Выберите позицию' }]}
                >
                  <Select
                    placeholder={type === 'work' ? 'Выберите работу' : 'Выберите материал'}
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
                            {work.name} ({work.unit_price ? `${work.unit_price} ₽/${work.unit}` : 'цена не указана'})
                          </Option>
                        ))
                      : materials.map((material) => (
                          <Option key={material.id} value={material.id}>
                            {material.name} ({material.unit_price ? `${material.unit_price} ₽/${material.unit}` : 'цена не указана'})
                          </Option>
                        ))}
                  </Select>
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="quantity" label="Количество" rules={[{ required: true, message: 'Введите количество' }]}>
            <InputNumber placeholder="0.00" min={0} precision={2} style={{ width: '100%' }} />
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
                return (
                  <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
                    <Text strong style={{ color: '#52c41a' }}>
                      Связанные материалы (будут добавлены автоматически):
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      {materials.map((mat) => {
                        const materialQuantity = (mat.total_consumption || 0) * quantity;
                        const materialCost = materialQuantity * (mat.material_unit_price || 0);
                        return (
                          <div key={mat.material_id} style={{ marginBottom: 4, fontSize: '12px' }}>
                            • {mat.material_name}: {materialQuantity.toFixed(6)} {mat.material_unit} = {materialCost.toFixed(2)} ₽
                          </div>
                        );
                      })}
                    </div>
                  </div>
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
