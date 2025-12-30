import { Annotation, AnnotationType, KoReaderAnnotation } from '@koinsight/common/types';
import { db } from '../knex';

export class AnnotationsRepository {
  /**
   * Get all annotations for a book, optionally filtered by device
   * @param includeDeleted - If true, includes soft-deleted annotations
   */
  static async getByBookMd5(md5: string, deviceId?: string, includeDeleted = false): Promise<Annotation[]> {
    let query = db<Annotation>('annotation')
      .where({ book_md5: md5 })
      .orderBy('datetime', 'desc');

    if (deviceId) {
      query = query.where({ device_id: deviceId });
    }

    // Filter out soft-deleted annotations by default
    if (!includeDeleted) {
      query = query.whereNull('deleted_at');
    }

    const annotations = await query;

    // Parse JSON position data and expose a simple `deleted` flag for clients
    return annotations.map((a) => ({
      ...a,
      pos0: a.pos0 ? JSON.parse(a.pos0 as string) : undefined,
      pos1: a.pos1 ? JSON.parse(a.pos1 as string) : undefined,
      deleted: Boolean(a.deleted_at),
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
   * Can accept an optional transaction to avoid nested transactions
   */
  static async bulkInsert(
    bookMd5: string,
    deviceId: string,
    koreaderAnnotations: KoReaderAnnotation[],
    trx?: any
  ): Promise<void> {
    if (koreaderAnnotations.length === 0) {
      return;
    }

    const annotations = koreaderAnnotations.map((ka) =>
      this.convertFromKoReader(bookMd5, deviceId, ka)
    );

    const insertAnnotations = async (transaction: any) => {
      for (const annotation of annotations) {
        await transaction('annotation')
          .insert(annotation)
          .onConflict(['book_md5', 'device_id', 'page_ref', 'datetime'])
          .merge(['text', 'note', 'datetime_updated', 'pageno', 'chapter', 'updated_at']);
      }
    };

    // Use provided transaction or create a new one
    if (trx) {
      await insertAnnotations(trx);
    } else {
      await db.transaction(insertAnnotations);
    }
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
      .whereNull('deleted_at') // Only count non-deleted annotations
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
   * Get total count of deleted annotations for a book
   */
  static async getDeletedCount(md5: string): Promise<number> {
    const result = await db('annotation')
      .where({ book_md5: md5 })
      .whereNotNull('deleted_at')
      .count('* as count')
      .first();

    return result ? Number(result.count) : 0;
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

  /**
   * Soft-delete an annotation by ID
   * Sets deleted_at to current timestamp instead of removing the record
   */
  static async markAsDeleted(id: number): Promise<number> {
    return db('annotation')
      .where({ id })
      .update({ deleted_at: db.fn.now() });
  }

  /**
   * Soft-delete multiple annotations by their identifiers
   * Used during sync to mark annotations that were deleted in KoReader
   * 
   * @param bookMd5 - The book's MD5 hash
   * @param deviceId - The device ID
   * @param identifiers - Array of unique identifiers (page_ref + datetime)
   * @param trx - Optional transaction to use
   */
  static async markManyAsDeleted(
    bookMd5: string,
    deviceId: string,
    identifiers: Array<{ page_ref: string; datetime: string }>,
    trx?: any
  ): Promise<number> {
    if (identifiers.length === 0) {
      return 0;
    }

    const executor = trx || db;
    
    // Build conditions for each identifier
    const query = executor('annotation')
      .where({ book_md5: bookMd5, device_id: deviceId })
      .whereNull('deleted_at') // Only mark if not already deleted
      .where((builder: any) => {
        identifiers.forEach(({ page_ref, datetime }) => {
          builder.orWhere({ page_ref, datetime });
        });
      })
      .update({ deleted_at: db.fn.now() });

    return query;
  }

  /**
   * Restore a soft-deleted annotation
   * Sets deleted_at back to NULL
   */
  static async restore(id: number): Promise<number> {
    return db('annotation')
      .where({ id })
      .update({ deleted_at: null });
  }
}
