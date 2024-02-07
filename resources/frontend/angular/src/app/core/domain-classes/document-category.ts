import { Category } from './category';
import { DocumentInfo } from './document-info';

export interface DocumentCategory {
  document: DocumentInfo;
  categories: Category[];
}
