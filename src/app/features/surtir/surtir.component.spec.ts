import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurtirComponent } from './surtir.component';

describe('SurtirComponent', () => {
  let component: SurtirComponent;
  let fixture: ComponentFixture<SurtirComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SurtirComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SurtirComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
