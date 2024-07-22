import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsumosOpcionesComponent } from './insumos-opciones.component';

describe('InsumosOpcionesComponent', () => {
  let component: InsumosOpcionesComponent;
  let fixture: ComponentFixture<InsumosOpcionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InsumosOpcionesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InsumosOpcionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
