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
  Statistic
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

// ==============================|| СПРАВОЧНИК РАБОТ ||============================== //

export default function WorksPage() {
  const [works, setWorks] = useState([]);
  const [phases, setPhases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedWork, setSelectedWork] = useState(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filteredWorks, setFilteredWorks] = useState([]);

  // Функция для поиска и фильтрации работ
  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = works.filter(work =>
      work.name.toLowerCase().includes(value.toLowerCase()) ||
      work.phase_name?.toLowerCase().includes(value.toLowerCase()) ||
      work.stage_name?.toLowerCase().includes(value.toLowerCase()) ||
      work.id.toString().includes(value)
    );
    setFilteredWorks(filtered);
  };

  // Обновляем отфильтрованные работы при изменении основного списка
  useEffect(() => {
    handleSearch(searchText);
  }, [works]);

  // Загрузка данных
  useEffect(() => {
    loadWorks();
    loadPhases();
  }, []);

  const loadWorks = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/works');
      if (response.ok) {
        const data = await response.json();
        setWorks(data);
      } else {
        message.error('Ошибка загрузки работ');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      message.error('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const loadPhases = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/phases');
      if (response.ok) {
        const data = await response.json();
        setPhases(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки фаз:', error);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedWork(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setModalMode('edit');
    setSelectedWork(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleView = (record) => {
    setModalMode('view');
    setSelectedWork(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleSave = async (values) => {
    try {
      const response = await fetch('http://localhost:3001/api/works', {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success(modalMode === 'create' ? 'Работа создана' : 'Работа обновлена');
        setModalVisible(false);
        loadWorks();
      } else {
        message.error('Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      message.error('Ошибка подключения к серверу');
    }
  };

  const columns = [
    {
      title: 'ID работы',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'Наименование работы',
      dataIndex: 'name',
      key: 'name',
      width: 300,
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: 'Фаза',
      dataIndex: 'phase_name',
      key: 'phase_name',
      width: 150,
      render: (text) => text ? <Tag color="blue">{text}</Tag> : '-',
    },
    {
      title: 'Стадия',
      dataIndex: 'stage_name',
      key: 'stage_name',
      width: 150,
      render: (text) => text ? <Tag color="green">{text}</Tag> : '-',
    },
    {
      title: 'Подстадия',
      dataIndex: 'substage_name',
      key: 'substage_name',
      width: 150,
      render: (text) => text ? <Tag color="orange">{text}</Tag> : '-',
    },
    {
      title: 'Единица измерения',
      dataIndex: 'unit',
      key: 'unit',
      width: 100,
    },
    {
      title: 'Цена за единицу',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 120,
      render: (value) => value ? `${parseFloat(value).toFixed(2)} ₽` : '-',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)}
            size="small"
          />
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Button 
            type="link" 
            icon={<DeleteOutlined />} 
            danger
            size="small"
          />
        </Space>
      ),
    },
  ];

  // Статистика
  const stats = {
    total: filteredWorks.length,
    phases: [...new Set(filteredWorks.filter(w => w.phase_name).map(w => w.phase_name))].length,
    avgPrice: filteredWorks.length > 0 ? 
      filteredWorks.filter(w => w.unit_price).reduce((sum, w) => sum + w.unit_price, 0) / 
      filteredWorks.filter(w => w.unit_price).length : 0
  };

  return (
    <MainCard title="Справочник работ">
      {/* Статистика */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Всего работ" 
              value={stats.total} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Активных фаз" 
              value={stats.phases} 
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Средняя цена" 
              value={stats.avgPrice} 
              precision={2}
              suffix="₽"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic 
              title="Система" 
              value="Works Ref 2.0" 
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Кнопки управления */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            Добавить работу
          </Button>
          <Button onClick={loadWorks}>
            Обновить
          </Button>
        </Space>
        
        <Input.Search
          placeholder="Поиск работ..."
          allowClear
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => handleSearch(e.target.value)}
          onSearch={handleSearch}
        />
      </div>

      {/* Таблица работ */}
      <Table
        columns={columns}
        dataSource={filteredWorks}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} работ`,
        }}
        scroll={{ x: 1200 }}
      />

      {/* Модальное окно для создания/редактирования */}
      <Modal
        title={
          modalMode === 'create' ? 'Создание работы' :
          modalMode === 'edit' ? 'Редактирование работы' :
          'Просмотр работы'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={modalMode === 'view' ? [
          <Button key="close" onClick={() => setModalVisible(false)}>
            Закрыть
          </Button>
        ] : [
          <Button key="cancel" onClick={() => setModalVisible(false)}>
            Отмена
          </Button>,
          <Button key="submit" type="primary" onClick={() => form.submit()}>
            {modalMode === 'create' ? 'Создать' : 'Сохранить'}
          </Button>
        ]}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          disabled={modalMode === 'view'}
        >
          <Form.Item
            name="id"
            label="ID работы"
            rules={[{ required: true, message: 'Введите ID работы' }]}
          >
            <Input placeholder="Например: w.001" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Наименование работы"
            rules={[{ required: true, message: 'Введите наименование работы' }]}
          >
            <Input placeholder="Наименование работы" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="unit"
                label="Единица измерения"
              >
                <Select placeholder="Выберите единицу">
                  <Option value="м2">м²</Option>
                  <Option value="м3">м³</Option>
                  <Option value="м">м</Option>
                  <Option value="шт">шт</Option>
                  <Option value="т">т</Option>
                  <Option value="кг">кг</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unit_price"
                label="Цена за единицу (₽)"
              >
                <InputNumber 
                  placeholder="0.00"
                  min={0}
                  precision={2}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="phase_id"
            label="Фаза"
          >
            <Select placeholder="Выберите фазу" allowClear>
              {phases.map(phase => (
                <Option key={phase.id} value={phase.id}>
                  {phase.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </MainCard>
  );
}
