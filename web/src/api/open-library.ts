export interface SearchData {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: Doc[];
  num_found: number;
  q: string;
  offset: null;
}

export interface Doc {
  author_alternative_name?: string[];
  author_key: string[];
  author_name: string[];
  contributor?: string[];
  cover_edition_key?: string;
  cover_i?: number;
  ddc?: string[];
  ebook_access: string;
  ebook_count_i: number;
  edition_count: number;
  edition_key: string[];
  first_publish_year: number;
  format?: string[];
  has_fulltext: boolean;
  ia?: string[];
  ia_collection?: string[];
  ia_collection_s?: string;
  isbn: string[];
  key: string;
  language: string[];
  last_modified_i: number;
  lcc?: string[];
  lccn?: string[];
  lending_edition_s?: string;
  lending_identifier_s?: string;
  number_of_pages_median: number;
  oclc?: string[];
  printdisabled_s?: string;
  public_scan_b: boolean;
  publish_date: string[];
  publish_place?: string[];
  publish_year: number[];
  publisher: string[];
  seed: string[];
  title: string;
  title_sort: string;
  title_suggest: string;
  type: string;
  id_amazon?: string[];
  id_depósito_legal?: string[];
  id_goodreads?: string[];
  id_librarything?: string[];
  subject?: string[];
  ia_loaded_id?: string[];
  ia_box_id?: string[];
  ratings_average?: number;
  ratings_sortable?: number;
  ratings_count?: number;
  ratings_count_1?: number;
  ratings_count_2?: number;
  ratings_count_3?: number;
  ratings_count_4?: number;
  ratings_count_5?: number;
  readinglog_count: number;
  want_to_read_count: number;
  currently_reading_count: number;
  already_read_count: number;
  publisher_facet: string[];
  subject_facet?: string[];
  _version_: number;
  lcc_sort?: string;
  author_facet: string[];
  subject_key?: string[];
  ddc_sort?: string;
  first_sentence?: string[];
  osp_count?: number;
  id_librivox?: string[];
  id_project_gutenberg?: string[];
  id_overdrive?: string[];
  place?: string[];
  time?: string[];
  person?: string[];
  person_key?: string[];
  time_facet?: string[];
  place_key?: string[];
  person_facet?: string[];
  place_facet?: string[];
  time_key?: string[];
  id_better_world_books?: string[];
  id_google?: string[];
  id_wikidata?: string[];
}

export function queryBook(searchTerm: string): Promise<SearchData> {
  return fetch(`https://openlibrary.org/search.json?q=${searchTerm}&limit=5&lang=eng`).then(
    (response) => response.json()
  );
}

export function fetchCover(coverId: number): Promise<Blob> {
  return fetch(`https://covers.openlibrary.org/b/id/${coverId}.jpg`).then((response) =>
    response.blob()
  );
}
