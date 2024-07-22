import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreparacionProductosComponent } from './preparacion-productos.component';

describe('PreparacionProductosComponent', () => {
  let component: PreparacionProductosComponent;
  let fixture: ComponentFixture<PreparacionProductosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreparacionProductosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PreparacionProductosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
