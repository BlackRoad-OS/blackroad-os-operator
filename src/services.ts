import { OS_ROOT, SERVICE_BASE_URL } from './config/serviceConfig';
import { config } from './config';

export const services = {
  operator: SERVICE_BASE_URL,
  osRoot: OS_ROOT,
  coreApi: config.coreApiUrl ?? `${OS_ROOT}/core`,
  agentsApi: config.agentsApiUrl ?? `${OS_ROOT}/agents`,
};
