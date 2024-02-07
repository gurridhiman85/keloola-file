import { DocumentMetaData } from './documentMetaData';
import { DocumentVersion } from './documentVersion';

export interface DocumentInfo {
  id?: string;
  name?: string;
  url?: string;
  description?: string;
  createdDate?: Date;
  createdBy?: string;
  categoryId?: string;
  categoryName?: string;
  documentSource?: string;
  extension?: string;
  isVersion?: boolean;
  viewerType?: string;
  expiredDate?: Date;
  isAllowDownload?: boolean;
  documentVersions?: DocumentVersion[];
  documentMetaDatas?: DocumentMetaData[];
  fileArray?: any;
  fileData?: any;
  isAssignUser?:any;
  is_main?:any;
  parentId?:any;
  idArray?:any;
  childOwners?:any;
  reminderDetails?:any;
  is_download?:boolean;
  localPath?:string;
  documentType?:string;
  mainFolder?:any;
}
