export type AnnotationType = 'highlight' | 'note' | 'bookmark';

export type AnnotationPosition = {
  x: number;
  y: number;
  page: number;
};

// Database annotation type (what we store)
export type Annotation = {
  id: number;
  book_md5: string;
  device_id: string;
  annotation_type: AnnotationType;

  // Content
  text?: string;
  note?: string;

  // Styling
  drawer?: string;
  color?: string;

  // Location
  chapter?: string;
  pageno?: number;
  page_ref: string;
  total_pages?: number; // Total pages in document at time of annotation

  // Position (stored as JSON strings in DB, parsed to objects)
  pos0?: string | AnnotationPosition;
  pos1?: string | AnnotationPosition;

  // Timestamps from KoReader
  datetime: string;
  datetime_updated?: string;

  // Metadata
  created_at: string;
  updated_at: string;
  deleted_at?: string; // Soft-delete timestamp
  deleted?: boolean; // convenience flag set by API
};

// What we receive from KoReader plugin (.sdr metadata files)
export type KoReaderAnnotation = {
  datetime: string;
  datetime_updated?: string;
  drawer?: string;
  color?: string;
  text?: string;
  text_edited?: boolean;
  note?: string;
  chapter?: string;
  pageno?: number;
  pageref?: string;
  page: number | string; // PDF: number, EPUB: xPointer string
  total_pages?: number; // Total pages in document at time of annotation
  pos0?: AnnotationPosition;
  pos1?: AnnotationPosition;
  pboxes?: any[]; // PDF position boxes (advanced)
  ext?: any; // Multi-page highlight data
};
