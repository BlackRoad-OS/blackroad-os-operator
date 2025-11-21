export interface OperatorService {
  id: string;
  name: string;
  baseUrl: string;
  healthEndpoint: string;
  infoEndpoint: string;
}

export const operatorService: OperatorService = {
  id: 'operator',
  name: 'BlackRoad OS – Operator',
  baseUrl: process.env.SERVICE_BASE_URL || 'https://operator.blackroad.systems',
  healthEndpoint: '/health',
  infoEndpoint: '/info',
};

export default operatorService;
