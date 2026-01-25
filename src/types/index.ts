/**
 * 型定義のエントリポイント
 *
 * 全ての型定義をここからre-exportして、インポートを簡潔にする
 */

// ファイル関連
export type {
  FileType,
  FileNode,
  FileContent,
  BackupInfo,
  ImportResult,
  FileExistsInfo,
  ZipFileInfo,
} from './files'

// エディタ関連
export type { SelectedFile, SearchHighlight, MessageType, Message } from './editor'

// バリデーション関連
export type {
  ValidationSeverity,
  ValidationSource,
  ValidationError,
  ValidationResult,
} from './validation'

// テンプレート関連
export type {
  TemplateCategory,
  TemplateField,
  Template,
  CustomTemplate,
  SaveTemplateInput,
  UnifiedTemplate,
} from './templates'
export { isCustomTemplate } from './templates'
