import { useAuth } from '@/contexts/AuthContext';

export function useAuthorization() {
  const { currentUser } = useAuth();

  const role = currentUser?.role;

  const is_admin = role === 'admin';
  const is_manager = role === 'manager';
  const is_employee = role === 'employee';
  const is_customer = role === 'customer';

  // Hierarchical permissions
  const can_manage = is_admin || is_manager;
  const can_sell = can_manage || is_employee;

  return {
    role,
    is_admin,
    is_manager,
    is_employee,
    is_customer,
    can_manage,
    can_sell,
  };
}