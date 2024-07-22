import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImprimirComponent } from './imprimir.component';

describe('ImprimirComponent', () => {
  let component: ImprimirComponent;
  let fixture: ComponentFixture<ImprimirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImprimirComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ImprimirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
