import { TestBed } from '@angular/core/testing';

import { CorteService } from './corte.service';

describe('CorteService', () => {
  let service: CorteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CorteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
