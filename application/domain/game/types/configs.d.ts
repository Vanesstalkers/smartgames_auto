export interface DomainGameCardsQuery {
  apiRequest?: boolean;
  selectGroup?: string | null;
  template?: string;
}

export interface DomainGameCardItem {
  group: string;
  name: string;
  title?: string;
  path?: string;
  [key: string]: any;
}

export interface DomainGameRankingHeader {
  code: string;
  title: string;
  format?: string;
}

export interface DomainGameRankingItem {
  title: string;
  active?: boolean;
  sortFunc?: (a: any, b: any) => number;
  headers?: DomainGameRankingHeader[];
  [key: string]: any;
}

export interface DomainGameConfigsModule {
  cards(query?: DomainGameCardsQuery): DomainGameCardItem[];
  games(): Record<string, any>;
  rankings(): Record<string, DomainGameRankingItem>;
  rankings(code: string): DomainGameRankingItem | undefined;
  rules(): Array<Record<string, any>>;
  cardTemplates: {
    random(opts?: { exclude?: string[] }): string;
    [key: string]: any;
  };
  [key: string]: any;
}
