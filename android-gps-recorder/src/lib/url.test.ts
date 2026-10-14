import { normalizeBaseUrl, uploadEndpoint } from './url';

describe('normalizeBaseUrl', () => {
  it('前後の空白と末尾の / を除く', () => {
    expect(normalizeBaseUrl('  http://192.168.1.10:3000/ ')).toEqual({ ok: true, url: 'http://192.168.1.10:3000' });
    expect(normalizeBaseUrl('https://home.example/gps//')).toEqual({ ok: true, url: 'https://home.example/gps' });
  });

  it('空・スキームなし・ほかのスキーム・クエリ付きは不正', () => {
    for (const input of ['', '   ', '192.168.1.10:3000', 'ftp://host', 'http://', 'http://host?x=1', 'http://a b']) {
      expect(normalizeBaseUrl(input).ok).toBe(false);
    }
  });
});

describe('uploadEndpoint', () => {
  it('API のパスをつなぐ', () => {
    expect(uploadEndpoint('http://192.168.1.10:3000')).toBe('http://192.168.1.10:3000/api/tracks');
  });
});
