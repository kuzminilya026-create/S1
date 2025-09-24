import MainCard from 'components/MainCard';
import { Typography, Button, Table, Space, Popconfirm, message, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

// ==============================|| СПРАВОЧНИК МАТЕРИАЛОВ ||============================== //

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([
    {
      id: 1,
      name: 'Цемент М400',
      unit: 'кг',
      price: 12.50,
      category: 'Строительные смеси',
      inStock: true,
      supplier: 'СтройМатериалы ООО'
    },
    {
      id: 2,
      name: 'Кирпич красный',
      unit: 'шт',
      price: 8.20,
      category: 'Кирпич',
      inStock: true,
      supplier: 'КирпичСтрой'
    },
    {
      id: 3,
      name: 'Плитка керамическая',
      unit: 'м²',
      price: 850.00,
      category: 'Отделочные материалы',
      inStock: false,
      supplier: 'КерамТорг'
    },
    {
      id: 4,
      name: 'Краска водоэмульсионная',
      unit: 'л',
      price: 320.00,
      category: 'Лакокрасочные материалы',
      inStock: true,
      supplier: 'КрасКа Плюс'
    },
    {
      id: 5,
      name: 'Гипсокартон 12.5мм',
      unit: 'лист',
      price: 280.00,
      category: 'Листовые материалы',
      inStock: true,
      supplier: 'ГипсМастер'
    },
    {
      id: 6,
      name: 'Утеплитель минватный',
      unit: 'м³',
      price: 1250.00,
      category: 'Утеплители',
      inStock: false,
      supplier: 'ТеплоДом'
    }
  ]);

  const columns = [
    {
      title: '№',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Наименование',
      dataIndex: 'name',
      key: 'name',
      width: 180,
    },
    {
      title: 'Категория',
      dataIndex: 'category',
      key: 'category',
      width: 140,
    },
    {
      title: 'Ед. изм.',
      dataIndex: 'unit',
      key: 'unit',
      width: 80,
    },
    {
      title: 'Цена (руб.)',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price) => `${price.toFixed(2)} ₽`,
    },
    {
      title: 'Наличие',
      dataIndex: 'inStock',
      key: 'inStock',
      width: 100,
      render: (inStock) => (
        <Tag color={inStock ? 'green' : 'red'}>
          {inStock ? 'В наличии' : 'Нет в наличии'}
        </Tag>
      ),
    },
    {
      title: 'Поставщик',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            title="Редактировать"
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
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    message.info('Добавление нового материала (функция в разработке)');
  };

  const handleEdit = (record) => {
    message.info(`Редактирование материала: ${record.name} (функция в разработке)`);
  };

  const handleDelete = (id) => {
    setMaterials(materials.filter(material => material.id !== id));
    message.success('Материал успешно удален');
  };

  const inStockCount = materials.filter(m => m.inStock).length;
  const outOfStockCount = materials.filter(m => !m.inStock).length;

  return (
    <MainCard title="Справочник материалов">
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={handleAdd}
        >
          Добавить материал
        </Button>
      </div>
      
      <Table
        columns={columns}
        dataSource={materials}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} из ${total} записей`,
        }}
        scroll={{ x: 900 }}
      />
      
      <div style={{ marginTop: 16, display: 'flex', gap: '20px', color: '#666' }}>
        <Typography.Text type="secondary">
          Всего материалов: {materials.length}
        </Typography.Text>
        <Typography.Text type="secondary">
          В наличии: <span style={{ color: '#52c41a' }}>{inStockCount}</span>
        </Typography.Text>
        <Typography.Text type="secondary">
          Нет в наличии: <span style={{ color: '#ff4d4f' }}>{outOfStockCount}</span>
        </Typography.Text>
      </div>
    </MainCard>
  );
}
