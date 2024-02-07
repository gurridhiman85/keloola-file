import { ResourceParameter } from './resource-parameter';

export class UserResource extends ResourceParameter {
  id?: string = '';
  userName?: string = '';
  createdBy?: string = '';
  createDate?: string;
  role?: string = '';
}
