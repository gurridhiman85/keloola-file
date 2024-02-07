// import { DocumentMetaData } from './documentMetaData';
// import { DocumentVersion } from './documentVersion';

export interface DocumentVerifyLinkInfo {
  id?: string;
  documentId?: string;
  documentPath?: string;
  password?: string;
  link?: string;
  createdBy?: string;
  toEmail?: string;
  startDate?: string;
  endDate?: string;
  allowPassword?: number;
  allowType?: number;
  isTimeBound?: number;
}
