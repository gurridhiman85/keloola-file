import { ResourceParameter } from './resource-parameter';

export class DocumentResource extends ResourceParameter {
  id?: string = '';
  createdBy?: string = '';
  categoryId?: string = '';
  createDate?: string;
  parentId?: string = '';
  type?: string = '';
  exclude_document?:string = '';
  is_owner?: number = 0;
}
