import OrderDetail from '@/components/admin/orders/OrderDetail';
import { redirect } from 'next/navigation';

interface OrderDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const orderId = parseInt(id, 10);

  // Validar que el ID sea un número válido
  if (isNaN(orderId) || orderId <= 0) {
    redirect('/admin/ordenes');
  }

  return (
    <div className="py-8">
      <OrderDetail orderId={orderId} />
    </div>
  );
}
