import { TestBed } from '@angular/core/testing';

import { IngredientOrdersService } from './ingredient-orders.service';

describe('IngredientOrdersService', () => {
  let service: IngredientOrdersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IngredientOrdersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
