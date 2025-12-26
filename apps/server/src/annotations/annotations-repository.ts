import { Annotation, AnnotationType, KoReaderAnnotation } from '@koinsight/common/types';
import { db } from '../knex';

export class AnnotationsRepository {
  /**
   * Get all annotations for a book, optionally filtered by device
   */
  static async getByBookMd5(md5: string, deviceId?: string): Promise<Annotation[]> {
    let query = db<Annotation>('annotation')
      .where({ book_md5: md5 })
      .orderBy('datetime', 'desc');

    if (deviceId) {
      query = query.where({ device_id: deviceId });
    }

    const annotations = await query;

    // Parse JSON position data
    return annotations.map((a) => ({
      ...a,
      pos0: a.pos0 ? JSON.parse(a.pos0 as string) : undefined,
      pos1: a.pos1 ? JSON.parse(a.pos1 as string) : undefined,
    }));
  }

  /**
   * Get annotations by type for a book
   */
  static async getByType(
    md5: string,
    type: AnnotationType,
    deviceId?: string
  ): Promise<Annotation[]> {
    const annotations = await this.getByBookMd5(md5, deviceId);
    return annotations.filter((a) => a.annotation_type === type);
  }

  /**
   * Get all annotations for a device
   */
  static async getByDeviceId(deviceId: string): Promise<Annotation[]> {
    const annotations = await db<Annotation>('annotation')
      .where({ device_id: deviceId })
      .orderBy('datetime', 'desc');

    return annotations.map((a) => ({
      ...a,
      pos0: a.pos0 ? JSON.parse(a.pos0 as string) : undefined,
      pos1: a.pos1 ? JSON.parse(a.pos1 as string) : undefined,
    }));
  }

  /**
   * Bulk insert annotations from KoReader
   */
  static async bulkInsert(
    bookMd5: string,
    deviceId: string,
    koreaderAnnotations: KoReaderAnnotation[]
  ): Promise<void> {
    if (koreaderAnnotations.length === 0) {
      return;
    }

    const annotations = koreaderAnnotations.map((ka) =>
      this.convertFromKoReader(bookMd5, deviceId, ka)
    );

    await db.transaction(async (trx) => {
      for (const annotation of annotations) {
        await trx('annotation')
          .insert(annotation)
          .onConflict(['book_md5', 'device_id', 'page_ref', 'datetime'])
          .merge(['text', 'note', 'datetime_updated', 'pageno', 'chapter', 'updated_at']);
      }
    });
  }

  /**
   * Insert a single annotation
   */
  static async insert(annotation: Omit<Annotation, 'id' | 'created_at' | 'updated_at'>): Promise<Annotation> {
    // Stringify position data if it's an object
    const annotationToInsert = {
      ...annotation,
      pos0: typeof annotation.pos0 === 'object' ? JSON.stringify(annotation.pos0) : annotation.pos0,
      pos1: typeof annotation.pos1 === 'object' ? JSON.stringify(annotation.pos1) : annotation.pos1,
    };

    const [inserted] = await db<Annotation>('annotation')
      .insert(annotationToInsert)
      .returning('*');

    return {
      ...inserted,
      pos0: inserted.pos0 ? JSON.parse(inserted.pos0 as string) : undefined,
      pos1: inserted.pos1 ? JSON.parse(inserted.pos1 as string) : undefined,
    };
  }

  /**
   * Update an annotation
   */
  static async update(
    id: number,
    updates: Partial<Omit<Annotation, 'id' | 'book_md5' | 'device_id' | 'created_at' | 'updated_at'>>
  ): Promise<number> {
    // Stringify position data if it's an object
    const updatesToApply = {
      ...updates,
      pos0: updates.pos0 && typeof updates.pos0 === 'object' 
        ? JSON.stringify(updates.pos0) 
        : updates.pos0,
      pos1: updates.pos1 && typeof updates.pos1 === 'object' 
        ? JSON.stringify(updates.pos1) 
        : updates.pos1,
    };

    return db('annotation').where({ id }).update(updatesToApply);
  }

  /**
   * Delete an annotation
   */
  static async delete(id: number): Promise<number> {
    return db('annotation').where({ id }).delete();
  }

  /**
   * Delete all annotations for a book
   */
  static async deleteByBookMd5(md5: string): Promise<number> {
    return db('annotation').where({ book_md5: md5 }).delete();
  }

  /**
   * Get counts by type for a book
   */
  static async getCountsByType(md5: string): Promise<Record<AnnotationType, number>> {
    const counts = await db('annotation')
      .where({ book_md5: md5 })
      .select('annotation_type')
      .count('* as count')
      .groupBy('annotation_type');

    const result: Record<AnnotationType, number> = {
      highlight: 0,
      note: 0,
      bookmark: 0,
    };

    counts.forEach((row: any) => {
      result[row.annotation_type as AnnotationType] = Number(row.count);
    });

    return result;
  }

  /**
   * Convert KoReader annotation format to our database format
   */
  private static convertFromKoReader(
    bookMd5: string,
    deviceId: string,
    ka: KoReaderAnnotation
  ): Omit<Annotation, 'id' | 'created_at' | 'updated_at'> {
    // Determine annotation type
    let type: AnnotationType;
    if (!ka.drawer && !ka.color && !ka.pos0 && !ka.pos1) {
      type = 'bookmark';
    } else if (ka.note && ka.text) {
      type = 'note';
    } else {
      type = 'highlight';
    }

    return {
      book_md5: bookMd5,
      device_id: deviceId,
      annotation_type: type,
      text: ka.text,
      note: ka.note,
      drawer: ka.drawer,
      color: ka.color,
      chapter: ka.chapter,
      pageno: ka.pageno,
      page_ref: String(ka.page),
      pos0: ka.pos0 ? JSON.stringify(ka.pos0) : undefined,
      pos1: ka.pos1 ? JSON.stringify(ka.pos1) : undefined,
      datetime: ka.datetime,
      datetime_updated: ka.datetime_updated,
    };
  }
}
