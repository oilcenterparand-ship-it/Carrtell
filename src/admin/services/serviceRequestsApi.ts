export {
  assignServiceRequestDriver,
  createServiceRequest,
  getDriverServiceRequests,
  getDriverUsers,
  getServiceRequests,
  getServiceRequestsByPhone,
  getServiceRequestStatusLabel,
  updateServiceRequestProgress,
  updateServiceRequestStatus,
} from '../../customer/services/serviceRequestsApi';

export type {
  AssignDriverInput,
  CreateServiceRequestInput,
  DriverUser,
  ServiceProgressInput,
  ServiceRequest,
  ServiceRequestStatus,
} from '../../customer/services/serviceRequestsApi';
