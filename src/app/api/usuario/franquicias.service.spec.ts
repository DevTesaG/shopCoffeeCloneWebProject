import { TestBed } from '@angular/core/testing';

import { FranquiciasService } from './franquicias.service';

describe('FranquiciasService', () => {
  let service: FranquiciasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FranquiciasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
